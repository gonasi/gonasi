-- ===================================================================================
-- FUNCTION: update_course_progress_for_user
-- DESCRIPTION:
--   Calculates and updates a user's progress across an entire published course.
--   This includes block, lesson, and chapter progress, as well as cumulative weights.
--   If the user completes the course, it updates the `completed_at` timestamp.
--
-- PARAMETERS:
--   p_user_id              - UUID of the user
--   p_published_course_id  - UUID of the published course
--
-- RETURNS:
--   VOID
--
-- SECURITY:
--   Runs with invoker privileges to ensure user-specific access controls
-- ===================================================================================

create or replace function public.update_course_progress_for_user(
  p_user_id uuid,
  p_published_course_id uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  -- Course structure JSON object
  course_structure jsonb;

  -- Total vs completed counts
  course_total_blocks integer := 0;
  course_completed_blocks integer := 0;

  course_total_lessons integer := 0;
  course_completed_lessons integer := 0;

  course_total_chapters integer := 0;
  course_completed_chapters integer := 0;

  -- Weight-related tracking
  course_total_weight numeric := 0;
  course_completed_weight numeric := 0;

  course_total_lesson_weight numeric := 0;
  course_completed_lesson_weight numeric := 0;

  -- Flag for full course completion
  course_is_completed boolean := false;
begin
  -- ============================================================================
  -- STEP 1: Load course structure
  -- ============================================================================
  select course_structure_content 
  into course_structure
  from public.published_course_structure_content 
  where id = p_published_course_id;

  if course_structure is null then
    raise exception 'Course structure not found for published_course_id: %', p_published_course_id;
  end if;

  -- ============================================================================
  -- STEP 2: Compute progress metrics using CTEs
  -- ============================================================================

  with course_blocks as (
    -- Flatten all blocks with their respective lesson & chapter IDs and weights
    select 
      (chapter_obj->>'id')::uuid as chapter_id,
      (lesson_obj->>'id')::uuid as lesson_id,
      (block_obj->>'id')::uuid as block_id,
      coalesce((block_obj->>'weight')::numeric, 1.0) as block_weight
    from jsonb_array_elements(course_structure->'chapters') as chapter_obj,
         jsonb_array_elements(chapter_obj->'lessons') as lesson_obj,
         jsonb_array_elements(lesson_obj->'blocks') as block_obj
  ),

  lesson_weights as (
    -- Aggregate weights per lesson
    select 
      lesson_id,
      sum(block_weight) as lesson_weight
    from course_blocks
    group by lesson_id
  ),

  chapter_lesson_counts as (
    -- Count how many lessons are in each chapter
    select 
      chapter_id,
      count(distinct lesson_id) as lessons_in_chapter
    from course_blocks
    group by chapter_id
  ),

  course_stats as (
    -- Total course-wide stats
    select 
      count(*) as total_blocks,
      count(distinct lesson_id) as total_lessons,
      count(distinct chapter_id) as total_chapters,
      sum(block_weight) as total_weight
    from course_blocks
  ),

  user_block_progress as (
    -- User-specific completed blocks and weight
    select 
      count(*) filter (where bp.is_completed = true) as completed_blocks,
      coalesce(sum(cb.block_weight) filter (where bp.is_completed = true), 0) as completed_weight
    from course_blocks cb
    left join public.block_progress bp on (
      bp.user_id = p_user_id
      and bp.published_course_id = p_published_course_id
      and bp.block_id = cb.block_id
    )
  ),

  user_lesson_progress as (
    -- User-specific completed lessons and lesson weights
    select 
      count(*) filter (where lp.completed_at is not null) as completed_lessons,
      coalesce(sum(lw.lesson_weight) filter (where lp.completed_at is not null), 0) as completed_lesson_weight,
      sum(lw.lesson_weight) as total_lesson_weight
    from lesson_weights lw
    left join public.lesson_progress lp on (
      lp.user_id = p_user_id
      and lp.published_course_id = p_published_course_id
      and lp.lesson_id = lw.lesson_id
    )
  ),

  user_chapter_progress as (
    -- A chapter is completed if all its lessons are completed
    select count(*) as completed_chapters
    from (
      select 
        cb.chapter_id,
        clc.lessons_in_chapter,
        count(lp.id) filter (where lp.completed_at is not null) as completed_lessons_in_chapter
      from course_blocks cb
      inner join chapter_lesson_counts clc on clc.chapter_id = cb.chapter_id
      left join public.lesson_progress lp on (
        lp.user_id = p_user_id
        and lp.published_course_id = p_published_course_id
        and lp.lesson_id = cb.lesson_id
        and lp.completed_at is not null
      )
      group by cb.chapter_id, clc.lessons_in_chapter
      having count(lp.id) filter (where lp.completed_at is not null) = clc.lessons_in_chapter
    ) completed_chapters_subq
  )

  -- ============================================================================
  -- STEP 3: Store computed values into local variables
  -- ============================================================================
  select 
    cs.total_blocks,
    ubp.completed_blocks,
    cs.total_lessons,
    ulp.completed_lessons,
    cs.total_chapters,
    ucp.completed_chapters,
    cs.total_weight,
    least(ubp.completed_weight, cs.total_weight),
    ulp.total_lesson_weight,
    least(ulp.completed_lesson_weight, ulp.total_lesson_weight)
  into 
    course_total_blocks,
    course_completed_blocks,
    course_total_lessons,
    course_completed_lessons,
    course_total_chapters,
    course_completed_chapters,
    course_total_weight,
    course_completed_weight,
    course_total_lesson_weight,
    course_completed_lesson_weight
  from course_stats cs
  cross join user_block_progress ubp
  cross join user_lesson_progress ulp
  cross join user_chapter_progress ucp;

  -- ============================================================================
  -- STEP 4: Determine if course is fully completed
  -- ============================================================================
  course_is_completed := (
    course_total_weight > 0 and 
    course_completed_weight >= course_total_weight - 0.0001 and
    course_completed_lessons >= course_total_lessons and
    course_completed_chapters >= course_total_chapters and
    course_total_lessons > 0 and
    course_total_chapters > 0
  );

  -- ============================================================================
  -- STEP 5: Upsert progress into course_progress table
  -- ============================================================================
  insert into public.course_progress (
    user_id,
    published_course_id,
    total_blocks,
    completed_blocks,
    total_lessons,
    completed_lessons,
    total_chapters,
    completed_chapters,
    total_weight,
    completed_weight,
    total_lesson_weight,
    completed_lesson_weight,
    completed_at
  )
  values (
    p_user_id,
    p_published_course_id,
    course_total_blocks,
    course_completed_blocks,
    course_total_lessons,
    course_completed_lessons,
    course_total_chapters,
    course_completed_chapters,
    course_total_weight,
    course_completed_weight,
    course_total_lesson_weight,
    course_completed_lesson_weight,
    case when course_is_completed then timezone('utc', now()) else null end
  )
  on conflict (user_id, published_course_id)
  do update set
    total_blocks = excluded.total_blocks,
    completed_blocks = excluded.completed_blocks,
    total_lessons = excluded.total_lessons,
    completed_lessons = excluded.completed_lessons,
    total_chapters = excluded.total_chapters,
    completed_chapters = excluded.completed_chapters,
    total_weight = excluded.total_weight,
    completed_weight = excluded.completed_weight,
    total_lesson_weight = excluded.total_lesson_weight,
    completed_lesson_weight = excluded.completed_lesson_weight,
    -- Handle setting or unsetting completed_at
    completed_at = case 
      when excluded.completed_weight >= excluded.total_weight - 0.0001
        and excluded.total_weight > 0
        and excluded.completed_lessons >= excluded.total_lessons
        and excluded.completed_chapters >= excluded.total_chapters
        and course_progress.completed_at is null
      then timezone('utc', now())
      when not (
        excluded.completed_weight >= excluded.total_weight - 0.0001
        and excluded.completed_lessons >= excluded.total_lessons
        and excluded.completed_chapters >= excluded.total_chapters
      )
      then null
      else course_progress.completed_at
    end,
    updated_at = timezone('utc', now());
end;
$$;
