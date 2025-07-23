-- =============================================================================
-- UNIFIED NAVIGATION SYSTEM
-- =============================================================================
-- This system provides consistent navigation metadata across all content levels
-- with standardized return formats and terminology.
-- =============================================================================

-- =============================================================================
-- FUNCTION: get_unified_navigation
-- =============================================================================
-- Core unified navigation function that provides complete navigation state
-- for any content item (block, lesson, chapter) in the course structure.
--
-- Parameters:
--   p_user_id             - UUID of the authenticated user
--   p_published_course_id - UUID of the published course
--   p_current_block_id    - UUID of the current block (optional)
--   p_current_lesson_id   - UUID of the current lesson (optional)
--   p_current_chapter_id  - UUID of the current chapter (optional)
--
-- Returns: Unified JSONB navigation object with consistent structure
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_unified_navigation(
  p_user_id uuid,
  p_published_course_id uuid,
  p_current_block_id uuid DEFAULT NULL,
  p_current_lesson_id uuid DEFAULT NULL,
  p_current_chapter_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  course_structure jsonb;
  current_context record;
  navigation_result jsonb;
BEGIN
  -- =========================================================================
  -- STEP 1: Get course structure
  -- =========================================================================
  SELECT course_structure_content
  INTO course_structure
  FROM public.published_course_structure_content
  WHERE id = p_published_course_id;

  IF course_structure IS NULL THEN
    RETURN jsonb_build_object('error', 'course structure not found');
  END IF;

  -- =========================================================================
  -- STEP 2: Determine current context from provided parameters
  -- =========================================================================
  SELECT * INTO current_context FROM public.resolve_current_context(
    course_structure,
    p_current_block_id,
    p_current_lesson_id,
    p_current_chapter_id
  );

  IF current_context IS NULL THEN
    RETURN jsonb_build_object('error', 'could not resolve current context');
  END IF;

  -- =========================================================================
  -- STEP 3: Build unified navigation response
  -- =========================================================================
  SELECT jsonb_build_object(
    'current', public.get_current_navigation_state(
      p_user_id, 
      p_published_course_id, 
      course_structure, 
      current_context
    ),
    'previous', public.get_previous_navigation_state(
      p_user_id, 
      p_published_course_id, 
      course_structure, 
      current_context
    ),
    'next', public.get_next_navigation_state(
      p_user_id, 
      p_published_course_id, 
      course_structure, 
      current_context
    ),
    'continue', public.get_continue_navigation_state(
      p_user_id, 
      p_published_course_id, 
      course_structure, 
      current_context
    ),
    'completion', public.get_completion_navigation_state(
      p_user_id, 
      p_published_course_id, 
      course_structure, 
      current_context
    ),
    'course_info', public.get_course_navigation_info(
      p_user_id, 
      p_published_course_id, 
      course_structure
    )
  ) INTO navigation_result;

  RETURN navigation_result;
END;
$$;
