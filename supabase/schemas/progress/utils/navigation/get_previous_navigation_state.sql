-- =============================================================================
-- FUNCTION: get_previous_navigation_state
-- =============================================================================
-- Returns previous content navigation targets.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_previous_navigation_state(
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
  prev_block record;
  prev_lesson record;
  prev_chapter record;
BEGIN
  -- Get previous block (if current has a block)
  IF current_context.block_id IS NOT NULL THEN
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
    SELECT chapter_id, lesson_id, block_id
    INTO prev_block
    FROM block_structure
    WHERE global_order = current_context.block_global_order - 1;
  END IF;

  -- Get previous lesson
  IF current_context.lesson_id IS NOT NULL THEN
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
    SELECT chapter_id, lesson_id
    INTO prev_lesson
    FROM lesson_structure
    WHERE global_order = current_context.lesson_global_order - 1;
  END IF;

  -- Get previous chapter
  IF current_context.chapter_id IS NOT NULL THEN
    WITH chapter_structure AS (
      SELECT
        (chapter_obj ->> 'id')::uuid as chapter_id,
        ROW_NUMBER() OVER (ORDER BY (chapter_obj ->> 'order_index')::int) as global_order
      FROM jsonb_array_elements(course_structure -> 'chapters') as chapter_obj
    )
    SELECT chapter_id
    INTO prev_chapter
    FROM chapter_structure
    WHERE global_order = current_context.chapter_global_order - 1;
  END IF;

  RETURN jsonb_build_object(
    'block', CASE WHEN prev_block.block_id IS NOT NULL THEN
      jsonb_build_object(
        'id', prev_block.block_id,
        'lesson_id', prev_block.lesson_id,
        'chapter_id', prev_block.chapter_id,
        'course_id', p_published_course_id
      )
      ELSE NULL END,
    'lesson', CASE WHEN prev_lesson.lesson_id IS NOT NULL THEN
      jsonb_build_object(
        'id', prev_lesson.lesson_id,
        'chapter_id', prev_lesson.chapter_id,
        'course_id', p_published_course_id
      )
      ELSE NULL END,
    'chapter', CASE WHEN prev_chapter.chapter_id IS NOT NULL THEN
      jsonb_build_object(
        'id', prev_chapter.chapter_id,
        'course_id', p_published_course_id
      )
      ELSE NULL END
  );
END;
$$;
