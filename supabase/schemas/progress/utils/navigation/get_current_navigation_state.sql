-- =============================================================================
-- FUNCTION: get_current_navigation_state
-- =============================================================================
-- Returns current content state with completion status and progress.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_current_navigation_state(
  p_user_id uuid,
  p_published_course_id uuid,
  course_structure jsonb,
  current_context record
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  block_progress record;
  lesson_progress record;
  chapter_progress record;
BEGIN
  -- Get block progress if block_id exists
  IF current_context.block_id IS NOT NULL THEN
    SELECT is_completed, completed_at, progress_percentage
    INTO block_progress
    FROM public.block_progress
    WHERE user_id = p_user_id 
      AND published_course_id = p_published_course_id 
      AND block_id = current_context.block_id;
  END IF;

  -- Get lesson progress
  IF current_context.lesson_id IS NOT NULL THEN
    SELECT is_completed, completed_at, progress_percentage
    INTO lesson_progress
    FROM public.lesson_progress
    WHERE user_id = p_user_id 
      AND published_course_id = p_published_course_id 
      AND lesson_id = current_context.lesson_id;
  END IF;

  -- Get chapter progress
  IF current_context.chapter_id IS NOT NULL THEN
    SELECT is_completed, completed_at, progress_percentage
    INTO chapter_progress
    FROM public.chapter_progress
    WHERE user_id = p_user_id 
      AND published_course_id = p_published_course_id 
      AND chapter_id = current_context.chapter_id;
  END IF;

  RETURN jsonb_build_object(
    'block', CASE WHEN current_context.block_id IS NOT NULL THEN
      jsonb_build_object(
        'id', current_context.block_id,
        'is_completed', COALESCE(block_progress.is_completed, false),
        'completed_at', block_progress.completed_at,
        'progress_percentage', COALESCE(block_progress.progress_percentage, 0)
      )
      ELSE NULL END,
    'lesson', CASE WHEN current_context.lesson_id IS NOT NULL THEN
      jsonb_build_object(
        'id', current_context.lesson_id,
        'is_completed', COALESCE(lesson_progress.is_completed, false),
        'completed_at', lesson_progress.completed_at,
        'progress_percentage', COALESCE(lesson_progress.progress_percentage, 0)
      )
      ELSE NULL END,
    'chapter', CASE WHEN current_context.chapter_id IS NOT NULL THEN
      jsonb_build_object(
        'id', current_context.chapter_id,
        'is_completed', COALESCE(chapter_progress.is_completed, false),
        'completed_at', chapter_progress.completed_at,
        'progress_percentage', COALESCE(chapter_progress.progress_percentage, 0)
      )
      ELSE NULL END,
    'course', jsonb_build_object(
      'id', p_published_course_id
    )
  );
END;
$$;