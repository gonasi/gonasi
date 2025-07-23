-- =============================================================================
-- FUNCTION: get_current_navigation_state
-- =============================================================================
-- Returns the current navigation state for a given user and course context,
-- including completion status and progress for block, lesson, and chapter.
--
-- Parameters:
--   p_user_id             - UUID of the user
--   p_published_course_id - UUID of the published course
--   course_structure      - JSONB structure of the course (not used here)
--   current_context       - Record with resolved block_id, lesson_id, chapter_id
--
-- Returns: JSONB object with structure:
-- {
--   block:   { id, is_completed, completed_at, progress_percentage } | null,
--   lesson:  { id, is_completed, completed_at, progress_percentage } | null,
--   chapter: { id, is_completed, completed_at, progress_percentage } | null,
--   course:  { id }
-- }
-- =============================================================================

create or replace function public.get_current_navigation_state(
  p_user_id uuid,
  p_published_course_id uuid,
  course_structure jsonb,
  current_context record
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  block_progress record;
  lesson_progress record;
  chapter_progress record;
begin
  -- =========================================================================
  -- STEP 1: Fetch block progress if a block is in context
  -- =========================================================================
  if current_context.block_id is not null then
    select
      is_completed,
      completed_at,
      progress_percentage
    into block_progress
    from public.block_progress
    where user_id = p_user_id
      and published_course_id = p_published_course_id
      and block_id = current_context.block_id;
  end if;

  -- =========================================================================
  -- STEP 2: Fetch lesson progress if a lesson is in context
  -- =========================================================================
  if current_context.lesson_id is not null then
    select
      is_completed,
      completed_at,
      progress_percentage
    into lesson_progress
    from public.lesson_progress
    where user_id = p_user_id
      and published_course_id = p_published_course_id
      and lesson_id = current_context.lesson_id;
  end if;

  -- =========================================================================
  -- STEP 3: Fetch chapter progress if a chapter is in context
  -- =========================================================================
  if current_context.chapter_id is not null then
    select
      is_completed,
      completed_at,
      progress_percentage
    into chapter_progress
    from public.chapter_progress
    where user_id = p_user_id
      and published_course_id = p_published_course_id
      and chapter_id = current_context.chapter_id;
  end if;

  -- =========================================================================
  -- STEP 4: Return unified JSONB structure of progress at all levels
  -- =========================================================================
  return jsonb_build_object(
    'block', case when current_context.block_id is not null then
      jsonb_build_object(
        'id', current_context.block_id,
        'is_completed', coalesce(block_progress.is_completed, false),
        'completed_at', block_progress.completed_at,
        'progress_percentage', coalesce(block_progress.progress_percentage, 0)
      )
      else null end,

    'lesson', case when current_context.lesson_id is not null then
      jsonb_build_object(
        'id', current_context.lesson_id,
        'is_completed', coalesce(lesson_progress.is_completed, false),
        'completed_at', lesson_progress.completed_at,
        'progress_percentage', coalesce(lesson_progress.progress_percentage, 0)
      )
      else null end,

    'chapter', case when current_context.chapter_id is not null then
      jsonb_build_object(
        'id', current_context.chapter_id,
        'is_completed', coalesce(chapter_progress.is_completed, false),
        'completed_at', chapter_progress.completed_at,
        'progress_percentage', coalesce(chapter_progress.progress_percentage, 0)
      )
      else null end,

    'course', jsonb_build_object(
      'id', p_published_course_id
    )
  );
end;
$$;
