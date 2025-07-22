-- ================================================================================================
-- function: update_lesson_progress_for_user
-- purpose:  updates the user's lesson progress using block completion data and course structure.
--           handles weighted progress calculations and sets the lesson's completion timestamp.
--           uses the course structure json as the source of truth.
--
-- parameters:
--   p_user_id              - uuid of the user whose progress is being updated
--   p_published_course_id  - uuid of the published course (links to structure + progress tables)
--   p_lesson_id            - uuid of the specific lesson being recalculated
--
-- logic:
--   1. extract lesson block weights from course structure json.
--   2. join with block_progress to calculate what the user has completed.
--   3. aggregate totals and determine if lesson is completed.
--   4. upsert the result into lesson_progress table.
--
-- notes:
--   - uses default weight of 1.0 if none is provided in the structure.
--   - rounds weight comparison with a tolerance to avoid floating-point issues.
--   - handles both initial insert and updates.
-- ================================================================================================

create or replace function public.update_lesson_progress_for_user(
  p_user_id uuid,
  p_published_course_id uuid,
  p_lesson_id uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  course_structure jsonb;
  lesson_total_blocks integer := 0;
  lesson_completed_blocks integer := 0;
  lesson_total_weight numeric := 0;
  lesson_completed_weight numeric := 0;
  lesson_is_completed boolean := false;
begin
  -- ============================================================================
  -- step 1: fetch the structure jsonb for the published course
  -- ============================================================================
  select course_structure_content
  into course_structure
  from public.published_course_structure_content
  where id = p_published_course_id;

  if course_structure is null then
    raise exception 'course structure not found for published_course_id: %', p_published_course_id;
  end if;

  -- ============================================================================
  -- step 2: extract block ids and weights from the jsonb structure for the lesson
  -- ============================================================================
  with lesson_blocks as (
    select 
      (block_obj->>'id')::uuid as block_id,
      coalesce((block_obj->>'weight')::numeric, 1.0) as block_weight
    from jsonb_path_query(
      course_structure,
      '$.chapters[*].lessons[*] ? (@.id == $lesson_id)',
      jsonb_build_object('lesson_id', p_lesson_id::text)
    ) as lesson_obj,
    jsonb_array_elements(lesson_obj->'blocks') as block_obj
  ),

  -- ============================================================================
  -- step 3: calculate total/completed blocks and weights
  -- ============================================================================
  lesson_stats as (
    select
      count(*) as total_blocks,
      sum(lb.block_weight) as total_weight,
      count(bp.id) filter (where bp.is_completed = true) as completed_blocks,
      coalesce(sum(lb.block_weight) filter (where bp.is_completed = true), 0) as completed_weight
    from lesson_blocks lb
    left join public.block_progress bp on (
      bp.user_id = p_user_id
      and bp.published_course_id = p_published_course_id
      and bp.block_id = lb.block_id
    )
  )

  -- ============================================================================
  -- step 4: assign values from stats to variables
  -- ============================================================================
  select 
    ls.total_blocks,
    ls.completed_blocks,
    ls.total_weight,
    least(ls.completed_weight, ls.total_weight) as completed_weight  -- avoid over-counting
  into 
    lesson_total_blocks,
    lesson_completed_blocks,
    lesson_total_weight,
    lesson_completed_weight
  from lesson_stats ls;

  -- ============================================================================
  -- step 5: determine if lesson is completed (based on total weight)
  -- ============================================================================
  lesson_is_completed := (
    lesson_total_weight > 0 and 
    lesson_completed_weight >= lesson_total_weight - 0.0001  -- tolerate float errors
  );

  -- ============================================================================
  -- step 6: upsert lesson_progress row for the user
  -- ============================================================================
  insert into public.lesson_progress (
    user_id, 
    published_course_id, 
    lesson_id,
    total_blocks,
    completed_blocks,
    total_weight,
    completed_weight,
    completed_at
  )
  values (
    p_user_id,
    p_published_course_id,
    p_lesson_id,
    lesson_total_blocks,
    lesson_completed_blocks,
    lesson_total_weight,
    lesson_completed_weight,
    case when lesson_is_completed then timezone('utc', now()) else null end
  )
  on conflict (user_id, published_course_id, lesson_id)
  do update set
    total_blocks     = excluded.total_blocks,
    completed_blocks = excluded.completed_blocks,
    total_weight     = excluded.total_weight,
    completed_weight = excluded.completed_weight,
    completed_at = case 
      -- set completed_at if it's newly completed
      when excluded.completed_weight >= excluded.total_weight - 0.0001
           and excluded.total_weight > 0
           and lesson_progress.completed_at is null
      then timezone('utc', now())

      -- reset completed_at if progress is no longer sufficient
      when excluded.completed_weight < excluded.total_weight - 0.0001
      then null

      -- else, retain existing completed_at
      else lesson_progress.completed_at
    end,
    updated_at = timezone('utc', now());

end;
$$;
