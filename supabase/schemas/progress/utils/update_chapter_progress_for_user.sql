-- ===================================================================================
-- FUNCTION: update_chapter_progress_for_user
-- DESCRIPTION:
--   Calculates and updates a user's progress within a specific chapter of a published course.
--   This includes block and lesson progress, as well as cumulative weights within the chapter.
--   If the user completes the chapter, it updates the `completed_at` timestamp.
--
-- PARAMETERS:
--   p_user_id              - UUID of the user
--   p_published_course_id  - UUID of the published course
--   p_chapter_id           - UUID of the specific chapter to update
--
-- RETURNS:
--   VOID
--
-- SECURITY:
--   Runs with invoker privileges to ensure user-specific access controls
-- ===================================================================================
-- ===================================================================================
-- FUNCTION: update_chapter_progress_for_user
-- DESCRIPTION:
--   Calculates and updates a user's progress within a specific chapter of a published course.
--   This includes block and lesson progress, as well as cumulative weights within the chapter.
--   If the user completes the chapter, it updates the `completed_at` timestamp.
--
-- PARAMETERS:
--   p_user_id              - UUID of the user
--   p_published_course_id  - UUID of the published course
--   p_chapter_id           - UUID of the specific chapter to update
--   p_course_progress_id   - UUID of the course_progress record (required for FK)
--
-- RETURNS:
--   VOID
--
-- SECURITY:
--   Runs with invoker privileges to ensure user-specific access controls
-- ===================================================================================

create or replace function public.update_chapter_progress_for_user(
  p_user_id uuid,
  p_published_course_id uuid,
  p_chapter_id uuid,
  p_course_progress_id uuid  -- ✅ Required FK reference
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  course_structure jsonb;

  chapter_total_blocks integer := 0;
  chapter_completed_blocks integer := 0;

  chapter_total_lessons integer := 0;
  chapter_completed_lessons integer := 0;

  chapter_total_weight numeric := 0;
  chapter_completed_weight numeric := 0;

  chapter_total_lesson_weight numeric := 0;
  chapter_completed_lesson_weight numeric := 0;

  chapter_is_completed boolean := false;
begin
  -- STEP 1: Load course structure
  select course_structure_content 
  into course_structure
  from public.published_course_structure_content 
  where id = p_published_course_id;

  if course_structure is null then
    raise exception 'Course structure not found for published_course_id: %', p_published_course_id;
  end if;

  -- STEP 2: Compute chapter progress
  with chapter_blocks as (
    select 
      (chapter_obj->>'id')::uuid as chapter_id,
      (lesson_obj->>'id')::uuid as lesson_id,
      (block_obj->>'id')::uuid as block_id,
      coalesce((block_obj->>'weight')::numeric, 1.0) as block_weight
    from jsonb_array_elements(course_structure->'chapters') as chapter_obj,
         jsonb_array_elements(chapter_obj->'lessons') as lesson_obj,
         jsonb_array_elements(lesson_obj->'blocks') as block_obj
    where (chapter_obj->>'id')::uuid = p_chapter_id
  ),
  chapter_lesson_weights as (
    select 
      lesson_id,
      sum(block_weight) as lesson_weight
    from chapter_blocks
    group by lesson_id
  ),
  chapter_stats as (
    select 
      count(*) as total_blocks,
      count(distinct lesson_id) as total_lessons,
      sum(block_weight) as total_weight
    from chapter_blocks
  ),
  user_chapter_block_progress as (
    select 
      count(*) filter (where bp.is_completed = true) as completed_blocks,
      coalesce(sum(cb.block_weight) filter (where bp.is_completed = true), 0) as completed_weight
    from chapter_blocks cb
    left join public.block_progress bp on (
      bp.user_id = p_user_id
      and bp.published_course_id = p_published_course_id
      and bp.block_id = cb.block_id
    )
  ),
  user_chapter_lesson_progress as (
    select 
      count(*) filter (where lp.completed_at is not null) as completed_lessons,
      coalesce(sum(clw.lesson_weight) filter (where lp.completed_at is not null), 0) as completed_lesson_weight,
      sum(clw.lesson_weight) as total_lesson_weight
    from chapter_lesson_weights clw
    left join public.lesson_progress lp on (
      lp.user_id = p_user_id
      and lp.published_course_id = p_published_course_id
      and lp.lesson_id = clw.lesson_id
    )
  )
  select 
    cs.total_blocks,
    ucbp.completed_blocks,
    cs.total_lessons,
    uclp.completed_lessons,
    cs.total_weight,
    least(ucbp.completed_weight, cs.total_weight),
    uclp.total_lesson_weight,
    least(uclp.completed_lesson_weight, uclp.total_lesson_weight)
  into 
    chapter_total_blocks,
    chapter_completed_blocks,
    chapter_total_lessons,
    chapter_completed_lessons,
    chapter_total_weight,
    chapter_completed_weight,
    chapter_total_lesson_weight,
    chapter_completed_lesson_weight
  from chapter_stats cs
  cross join user_chapter_block_progress ucbp
  cross join user_chapter_lesson_progress uclp;

  -- STEP 3: Determine completion
  chapter_is_completed := (
    chapter_total_weight > 0 and 
    chapter_completed_weight >= chapter_total_weight - 0.0001 and
    chapter_completed_lessons >= chapter_total_lessons and
    chapter_total_lessons > 0
  );

  -- STEP 4: Upsert into chapter_progress with course_progress_id
  insert into public.chapter_progress (
    course_progress_id,  -- ✅ Required
    user_id,
    published_course_id,
    chapter_id,
    total_blocks,
    completed_blocks,
    total_lessons,
    completed_lessons,
    total_weight,
    completed_weight,
    total_lesson_weight,
    completed_lesson_weight,
    is_completed,
    completed_at
  )
  values (
    p_course_progress_id,
    p_user_id,
    p_published_course_id, 
    p_chapter_id,
    chapter_total_blocks,
    chapter_completed_blocks,
    chapter_total_lessons,
    chapter_completed_lessons,
    chapter_total_weight,
    chapter_completed_weight,
    chapter_total_lesson_weight,
    chapter_completed_lesson_weight,
    chapter_is_completed,
    case when chapter_is_completed then timezone('utc', now()) else null end
  )
  on conflict (user_id, published_course_id, chapter_id)
  do update set
    course_progress_id = excluded.course_progress_id,  -- ✅ Update it
    total_blocks = excluded.total_blocks,
    completed_blocks = excluded.completed_blocks,
    total_lessons = excluded.total_lessons,
    completed_lessons = excluded.completed_lessons,
    total_weight = excluded.total_weight,
    completed_weight = excluded.completed_weight,
    total_lesson_weight = excluded.total_lesson_weight,
    completed_lesson_weight = excluded.completed_lesson_weight,
    is_completed = excluded.is_completed,
    completed_at = case 
      when excluded.completed_weight >= excluded.total_weight - 0.0001
        and excluded.total_weight > 0
        and excluded.completed_lessons >= excluded.total_lessons
        and chapter_progress.completed_at is null
      then timezone('utc', now())
      when not (
        excluded.completed_weight >= excluded.total_weight - 0.0001
        and excluded.completed_lessons >= excluded.total_lessons
      )
      then null
      else chapter_progress.completed_at
    end,
    updated_at = timezone('utc', now());
end;
$$;
