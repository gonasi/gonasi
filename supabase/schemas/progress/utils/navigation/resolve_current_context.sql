-- =============================================================================
-- FUNCTION: resolve_current_context
-- =============================================================================
-- Resolves the current context (block, lesson, chapter) from provided IDs
-- and returns structured information with global ordering.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.resolve_current_context(
  course_structure jsonb,
  p_block_id uuid DEFAULT NULL,
  p_lesson_id uuid DEFAULT NULL,
  p_chapter_id uuid DEFAULT NULL
)
RETURNS TABLE(
  block_id uuid,
  lesson_id uuid,
  chapter_id uuid,
  block_global_order integer,
  lesson_global_order integer,
  chapter_global_order integer
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  -- If block_id is provided, resolve from block
  IF p_block_id IS NOT NULL THEN
    RETURN QUERY
    WITH structure AS (
      SELECT
        (chapter_obj ->> 'id')::uuid as chap_id,
        (lesson_obj ->> 'id')::uuid as less_id,
        (block_obj ->> 'id')::uuid as block_id,
        ROW_NUMBER() OVER (ORDER BY 
          (chapter_obj ->> 'order_index')::int,
          (lesson_obj ->> 'order_index')::int,
          (block_obj ->> 'order_index')::int
        ) as block_order,
        ROW_NUMBER() OVER (ORDER BY 
          (chapter_obj ->> 'order_index')::int,
          (lesson_obj ->> 'order_index')::int
        ) as lesson_order,
        ROW_NUMBER() OVER (ORDER BY 
          (chapter_obj ->> 'order_index')::int
        ) as chapter_order
      FROM jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
           jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj,
           jsonb_array_elements(lesson_obj -> 'blocks') as block_obj
    )
    SELECT s.block_id, s.less_id, s.chap_id, 
           s.block_order::int, s.lesson_order::int, s.chapter_order::int
    FROM structure s
    WHERE s.block_id = p_block_id;
    
  -- If lesson_id is provided, resolve from lesson
  ELSIF p_lesson_id IS NOT NULL THEN
    RETURN QUERY
    WITH structure AS (
      SELECT
        (chapter_obj ->> 'id')::uuid as chap_id,
        (lesson_obj ->> 'id')::uuid as less_id,
        NULL::uuid as block_id,
        NULL::int as block_order,
        ROW_NUMBER() OVER (ORDER BY 
          (chapter_obj ->> 'order_index')::int,
          (lesson_obj ->> 'order_index')::int
        ) as lesson_order,
        ROW_NUMBER() OVER (ORDER BY 
          (chapter_obj ->> 'order_index')::int
        ) as chapter_order
      FROM jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
           jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj
    )
    SELECT s.block_id, s.less_id, s.chap_id, 
           s.block_order, s.lesson_order::int, s.chapter_order::int
    FROM structure s
    WHERE s.less_id = p_lesson_id;
    
  -- If chapter_id is provided, resolve from chapter
  ELSIF p_chapter_id IS NOT NULL THEN
    RETURN QUERY
    WITH structure AS (
      SELECT
        (chapter_obj ->> 'id')::uuid as chap_id,
        NULL::uuid as less_id,
        NULL::uuid as block_id,
        NULL::int as block_order,
        NULL::int as lesson_order,
        ROW_NUMBER() OVER (ORDER BY 
          (chapter_obj ->> 'order_index')::int
        ) as chapter_order
      FROM jsonb_array_elements(course_structure -> 'chapters') as chapter_obj
    )
    SELECT s.block_id, s.less_id, s.chap_id, 
           s.block_order, s.lesson_order, s.chapter_order::int
    FROM structure s
    WHERE s.chap_id = p_chapter_id;
  END IF;
END;
$$;