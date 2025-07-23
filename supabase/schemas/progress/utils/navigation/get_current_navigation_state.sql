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

  -- Always fetch block progress (with defaults when no block in context)
  select
    coalesce(bp.is_completed, false) as is_completed,
    bp.completed_at,
    coalesce(bp.progress_percentage, 0) as progress_percentage
  into block_progress
  from (
    select 
      false as is_completed, 
      null::timestamp as completed_at, 
      0 as progress_percentage
  ) as defaults
  left join public.block_progress bp on (
    current_context.block_id is not null
    and bp.user_id = p_user_id
    and bp.published_course_id = p_published_course_id
    and bp.block_id = current_context.block_id
  );

  -- Always fetch lesson progress (with defaults when no lesson in context)
  select
    coalesce(lp.is_completed, false) as is_completed,
    lp.completed_at,
    coalesce(lp.progress_percentage, 0) as progress_percentage
  into lesson_progress
  from (
    select 
      false as is_completed, 
      null::timestamp as completed_at, 
      0 as progress_percentage
  ) as defaults
  left join public.lesson_progress lp on (
    current_context.lesson_id is not null
    and lp.user_id = p_user_id
    and lp.published_course_id = p_published_course_id
    and lp.lesson_id = current_context.lesson_id
  );

  -- Fetch chapter progress if a chapter is in context
  if current_context.chapter_id is not null then
    select
      coalesce(cp.is_completed, false) as is_completed,
      cp.completed_at,
      coalesce(cp.progress_percentage, 0) as progress_percentage
    into chapter_progress
    from (select 1) as dummy
    left join public.chapter_progress cp on (
      cp.user_id = p_user_id
      and cp.published_course_id = p_published_course_id
      and cp.chapter_id = current_context.chapter_id
    );
  end if;

  -- Return unified JSONB structure
  return jsonb_build_object(
    'block', case when current_context.block_id is not null then
      jsonb_build_object(
        'id', current_context.block_id,
        'is_completed', block_progress.is_completed,
        'completed_at', block_progress.completed_at,
        'progress_percentage', block_progress.progress_percentage
      )
      else null end,

    'lesson', case when current_context.lesson_id is not null then
      jsonb_build_object(
        'id', current_context.lesson_id,
        'is_completed', lesson_progress.is_completed,
        'completed_at', lesson_progress.completed_at,
        'progress_percentage', lesson_progress.progress_percentage
      )
      else null end,

    'chapter', case when current_context.chapter_id is not null then
      jsonb_build_object(
        'id', current_context.chapter_id,
        'is_completed', chapter_progress.is_completed,
        'completed_at', chapter_progress.completed_at,
        'progress_percentage', chapter_progress.progress_percentage
      )
      else null end,

    'course', jsonb_build_object(
      'id', p_published_course_id
    )
  );
end;
$$;
