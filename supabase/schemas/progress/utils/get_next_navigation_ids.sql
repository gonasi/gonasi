-- =================================================================================
-- FUNCTION: get_next_navigation_ids
-- DESCRIPTION: Determines next available block, lesson, and chapter IDs for a user
-- =================================================================================
CREATE OR REPLACE FUNCTION public.get_next_navigation_ids(
  p_user_id uuid,
  p_published_course_id uuid,
  p_current_block_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  course_structure jsonb;
  result jsonb;
  current_chapter_id uuid;
  current_lesson_id uuid;
  next_block_id uuid;
  next_lesson_id uuid;
  next_chapter_id uuid;
BEGIN
  -- Get course structure
  SELECT course_structure_content 
  INTO course_structure
  FROM public.published_course_structure_content 
  WHERE id = p_published_course_id;
  
  IF course_structure IS NULL THEN
    RETURN jsonb_build_object('error', 'Course structure not found');
  END IF;
  
  -- If current_block_id is provided, find current context
  IF p_current_block_id IS NOT NULL THEN
    SELECT 
      (chapter_obj->>'id')::uuid,
      (lesson_obj->>'id')::uuid
    INTO current_chapter_id, current_lesson_id
    FROM jsonb_array_elements(course_structure->'chapters') as chapter_obj,
         jsonb_array_elements(chapter_obj->'lessons') as lesson_obj,
         jsonb_array_elements(lesson_obj->'blocks') as block_obj
    WHERE (block_obj->>'id')::uuid = p_current_block_id;
  END IF;
  
  -- Find next available block (first incomplete or locked block that should be accessible)
  WITH block_progress_status AS (
    SELECT 
      (chapter_obj->>'id')::uuid as chapter_id,
      (lesson_obj->>'id')::uuid as lesson_id, 
      (block_obj->>'id')::uuid as block_id,
      ROW_NUMBER() OVER (ORDER BY 
        chapter_pos, lesson_pos, block_pos
      ) as global_position,
      COALESCE(bp.is_completed, false) as is_completed,
      COALESCE((block_obj->'settings'->>'can_skip')::boolean, false) as can_skip,
      LAG(COALESCE(bp.is_completed, false), 1, true) OVER (ORDER BY 
        chapter_pos, lesson_pos, block_pos
      ) as prev_block_completed
    FROM jsonb_array_elements(course_structure->'chapters') WITH ORDINALITY as chapters(chapter_obj, chapter_pos),
         jsonb_array_elements(chapter_obj->'lessons') WITH ORDINALITY as lessons(lesson_obj, lesson_pos),
         jsonb_array_elements(lesson_obj->'blocks') WITH ORDINALITY as blocks(block_obj, block_pos)
    LEFT JOIN public.block_progress bp ON (
      bp.user_id = p_user_id
      AND bp.published_course_id = p_published_course_id
      AND bp.block_id = (block_obj->>'id')::uuid
    )
  )
  SELECT block_id, lesson_id, chapter_id
  INTO next_block_id, next_lesson_id, next_chapter_id
  FROM block_progress_status
  WHERE NOT is_completed 
    AND (global_position = 1 OR prev_block_completed OR can_skip)
  ORDER BY global_position
  LIMIT 1;
  
  -- If no next block found, course might be completed
  IF next_block_id IS NULL THEN
    -- Check if there are any incomplete lessons
    SELECT 
      (lesson_obj->>'id')::uuid,
      (chapter_obj->>'id')::uuid
    INTO next_lesson_id, next_chapter_id
    FROM jsonb_array_elements(course_structure->'chapters') as chapter_obj,
         jsonb_array_elements(chapter_obj->'lessons') as lesson_obj
    LEFT JOIN public.lesson_progress lp ON (
      lp.user_id = p_user_id
      AND lp.published_course_id = p_published_course_id
      AND lp.lesson_id = (lesson_obj->>'id')::uuid
    )
    WHERE lp.completed_at IS NULL OR lp.id IS NULL
    ORDER BY 
      (chapter_obj->>'order_index')::integer,
      (lesson_obj->>'order_index')::integer
    LIMIT 1;
  END IF;
  
  RETURN jsonb_build_object(
    'next_block_id', next_block_id,
    'next_lesson_id', next_lesson_id,
    'next_chapter_id', next_chapter_id,
    'current_context', jsonb_build_object(
      'chapter_id', current_chapter_id,
      'lesson_id', current_lesson_id,
      'block_id', p_current_block_id
    )
  );
END;
$$;
