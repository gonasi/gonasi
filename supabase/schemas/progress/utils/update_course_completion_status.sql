-- ========================================================================
-- FUNCTION: update_course_completion_status
-- DESCRIPTION:
--   Aggregates course-level completion stats for the authenticated user:
--     - Computes total lessons, chapters, blocks
--     - Calculates how many of those the user has completed
--     - Determines if the course is completed
--     - Upserts into `course_progress` with computed stats
-- ========================================================================
create or replace function public.update_course_completion_status(
  p_course_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());  -- Authenticated user ID
  course_structure jsonb;                       -- JSON course structure
  course_completed boolean := false;            -- Is course fully complete
  result jsonb;                                 -- Final JSON result
begin
  -- ============================================================
  -- STEP 1: Fetch the course structure JSON
  -- ============================================================
  select course_structure_content into course_structure
  from public.published_course_structure_content
  where id = p_course_id;

  -- ============================================================
  -- STEP 2: Compute completion statistics
  -- ============================================================
  with course_stats as (
    select 
      -- Total unique chapters
      count(distinct chapter->>'id') as total_chapters,

      -- Total unique lessons
      count(distinct lesson->>'id') as total_lessons,

      -- Total number of all blocks in all lessons
      (
        select count(*)
        from jsonb_array_elements(course_structure->'chapters') as chapter,
            jsonb_array_elements(chapter->'lessons') as lesson,
            jsonb_array_elements(lesson->'blocks') as block
      ) as total_blocks,

      -- Number of completed lessons by user
      (
        select count(distinct lp.lesson_id)
        from public.lesson_progress lp
        where lp.user_id = current_user_id
          and lp.published_course_id = p_course_id
          and lp.completed_at is not null
      ) as completed_lessons,

      -- Number of completed blocks by user
      (
        select count(*)
        from public.block_progress bp
        where bp.user_id = current_user_id
          and bp.published_course_id = p_course_id
          and bp.is_completed = true
      ) as completed_blocks
    from jsonb_array_elements(course_structure->'chapters') as chapter,
        jsonb_array_elements(chapter->'lessons') as lesson
  )
  select 
    total_chapters, total_lessons, total_blocks,
    completed_lessons, completed_blocks,
    (completed_lessons = total_lessons) as is_course_completed
  into result
  from course_stats;

  course_completed := (result->>'is_course_completed')::boolean;

  -- ============================================================
  -- STEP 3: Insert or update `course_progress` record
  -- ============================================================
  insert into public.course_progress (
    user_id, published_course_id,
    total_blocks, completed_blocks,
    total_lessons, completed_lessons,
    total_chapters, completed_chapters,
    completed_at
  )
  values (
    current_user_id, p_course_id,
    (result->>'total_blocks')::int,
    (result->>'completed_blocks')::int,
    (result->>'total_lessons')::int,
    (result->>'completed_lessons')::int,
    (result->>'total_chapters')::int,

    -- Dynamically calculate how many chapters have all lessons completed
    (
      select count(distinct chapter_id)
      from (
        select distinct 
          jsonb_path_query_first(
            course_structure,
            '$.chapters[*] ? (@.lessons[*].id == $lesson_id)',
            jsonb_build_object('lesson_id', lp.lesson_id::text)
          )->>'id' as chapter_id
        from public.lesson_progress lp
        where lp.user_id = current_user_id
          and lp.published_course_id = p_course_id
          and lp.completed_at is not null
      ) as completed_chapters
    ),

    -- Set `completed_at` timestamp only if course is now complete
    case when course_completed then now() else null end
  )

  on conflict (user_id, published_course_id)
  do update set
    total_blocks = excluded.total_blocks,
    completed_blocks = excluded.completed_blocks,
    total_lessons = excluded.total_lessons,
    completed_lessons = excluded.completed_lessons,
    total_chapters = excluded.total_chapters,
    completed_chapters = excluded.completed_chapters,
    completed_at = case 
      -- Set timestamp if course just completed and it was previously null
      when excluded.completed_lessons = excluded.total_lessons 
        and course_progress.completed_at is null
      then now()

      -- Clear timestamp if the course regressed to incomplete
      when excluded.completed_lessons < excluded.total_lessons
      then null

      -- Otherwise keep existing value
      else course_progress.completed_at
    end,
    updated_at = now();

  -- ============================================================
  -- STEP 4: Return combined stats and completion info as JSON
  -- ============================================================
  return result || jsonb_build_object(
    'course_completed', course_completed,
    'completion_percentage',
      round(
        (result->>'completed_lessons')::numeric * 100.0 / greatest((result->>'total_lessons')::numeric, 1),
        2
      )
  );
end;
$$;
