-- =============================================================================
-- FUNCTION: get_continue_navigation_state
-- =============================================================================
-- Returns smart "continue" navigation targets (next incomplete content).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_continue_navigation_state(
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
  continue_block record;
  continue_lesson record;
  continue_chapter record;
BEGIN
  -- Get next incomplete block
  WITH block_structure AS (
    SELECT
      (chapter_obj ->> 'id')::uuid as chapter_id,
      (lesson_obj ->> 'id')::uuid as lesson_id,
      (block_obj ->> 'id')::uuid as block_id,
      ROW_NUMBER() OVER (ORDER BY 
        (chapter_obj ->> 'order_index')::int,
        (lesson_obj ->> 'order_index')::int,
        (block_obj ->> 'order_index')::int
      ) as global_order
    FROM jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
         jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj,
         jsonb_array_elements(lesson_obj -> 'blocks') as block_obj
  )
  SELECT bs.chapter_id, bs.lesson_id, bs.block_id
  INTO continue_block
  FROM block_structure bs
  LEFT JOIN public.block_progress bp ON (
    bp.user_id = p_user_id
    AND bp.published_course_id = p_published_course_id
    AND bp.block_id = bs.block_id
  )
  WHERE bs.global_order > COALESCE(current_context.block_global_order, 0)
    AND (bp.is_completed IS FALSE OR bp.id IS NULL)
  ORDER BY bs.global_order
  LIMIT 1;

  -- Get next incomplete lesson
  WITH lesson_structure AS (
    SELECT
      (chapter_obj ->> 'id')::uuid as chapter_id,
      (lesson_obj ->> 'id')::uuid as lesson_id,
      ROW_NUMBER() OVER (ORDER BY 
        (chapter_obj ->> 'order_index')::int,
        (lesson_obj ->> 'order_index')::int
      ) as global_order
    FROM jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
         jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj
  )
  SELECT ls.chapter_id, ls.lesson_id
  INTO continue_lesson
  FROM lesson_structure ls
  LEFT JOIN public.lesson_progress lp ON (
    lp.user_id = p_user_id
    AND lp.published_course_id = p_published_course_id
    AND lp.lesson_id = ls.lesson_id
  )
  WHERE ls.global_order > COALESCE(current_context.lesson_global_order, 0)
    AND (lp.completed_at IS NULL OR lp.id IS NULL)
  ORDER BY ls.global_order
  LIMIT 1;

  -- Get next incomplete chapter
  WITH chapter_structure AS (
    SELECT
      (chapter_obj ->> 'id')::uuid as chapter_id,
      ROW_NUMBER() OVER (ORDER BY (chapter_obj ->> 'order_index')::int) as global_order
    FROM jsonb_array_elements(course_structure -> 'chapters') as chapter_obj
  )
  SELECT cs.chapter_id
  INTO continue_chapter
  FROM chapter_structure cs
  LEFT JOIN public.chapter_progress cp ON (
    cp.user_id = p_user_id
    AND cp.published_course_id = p_published_course_id
    AND cp.chapter_id = cs.chapter_id
  )
  WHERE cs.global_order > COALESCE(current_context.chapter_global_order, 0)
    AND (cp.completed_at IS NULL OR cp.id IS NULL)
  ORDER BY cs.global_order
  LIMIT 1;

  RETURN jsonb_build_object(
    'block', CASE WHEN continue_block.block_id IS NOT NULL THEN
      jsonb_build_object(
        'id', continue_block.block_id,
        'lesson_id', continue_block.lesson_id,
        'chapter_id', continue_block.chapter_id,
        'course_id', p_published_course_id
      )
      ELSE NULL END,
    'lesson', CASE WHEN continue_lesson.lesson_id IS NOT NULL THEN
      jsonb_build_object(
        'id', continue_lesson.lesson_id,
        'chapter_id', continue_lesson.chapter_id,
        'course_id', p_published_course_id
      )
      ELSE NULL END,
    'chapter', CASE WHEN continue_chapter.chapter_id IS NOT NULL THEN
      jsonb_build_object(
        'id', continue_chapter.chapter_id,
        'course_id', p_published_course_id
      )
      ELSE NULL END
  );
END;
$$;