-- =============================================================================
-- FUNCTION: get_next_navigation_state
-- =============================================================================
-- Returns next sequential content navigation targets.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_next_navigation_state(
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
  next_block record;
  next_lesson record;
  next_chapter record;
BEGIN
  -- Get next block (sequentially next, regardless of completion)
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
    INTO next_block
    FROM block_structure
    WHERE global_order = current_context.block_global_order + 1;
  END IF;

  -- Get next lesson (sequentially next)
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
    INTO next_lesson
    FROM lesson_structure
    WHERE global_order = current_context.lesson_global_order + 1;
  END IF;

  -- Get next chapter (sequentially next)
  IF current_context.chapter_id IS NOT NULL THEN
    WITH chapter_structure AS (
      SELECT
        (chapter_obj ->> 'id')::uuid as chapter_id,
        ROW_NUMBER() OVER (ORDER BY (chapter_obj ->> 'order_index')::int) as global_order
      FROM jsonb_array_elements(course_structure -> 'chapters') as chapter_obj
    )
    SELECT chapter_id
    INTO next_chapter
    FROM chapter_structure
    WHERE global_order = current_context.chapter_global_order + 1;
  END IF;

  RETURN jsonb_build_object(
    'block', CASE WHEN next_block.block_id IS NOT NULL THEN
      jsonb_build_object(
        'id', next_block.block_id,
        'lesson_id', next_block.lesson_id,
        'chapter_id', next_block.chapter_id,
        'course_id', p_published_course_id
      )
      ELSE NULL END,
    'lesson', CASE WHEN next_lesson.lesson_id IS NOT NULL THEN
      jsonb_build_object(
        'id', next_lesson.lesson_id,
        'chapter_id', next_lesson.chapter_id,
        'course_id', p_published_course_id
      )
      ELSE NULL END,
    'chapter', CASE WHEN next_chapter.chapter_id IS NOT NULL THEN
      jsonb_build_object(
        'id', next_chapter.chapter_id,
        'course_id', p_published_course_id
      )
      ELSE NULL END
  );
END;
$$;