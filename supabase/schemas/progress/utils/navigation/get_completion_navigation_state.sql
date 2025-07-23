-- =============================================================================
-- FUNCTION: get_completion_navigation_state
-- =============================================================================
-- Returns completion status for all levels.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_completion_navigation_state(
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
  completion_stats record;
BEGIN
  WITH 
  -- Count all content at each level
  all_blocks AS (
    SELECT (block_obj ->> 'id')::uuid as block_id
    FROM jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
         jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj,
         jsonb_array_elements(lesson_obj -> 'blocks') as block_obj
  ),
  all_lessons AS (
    SELECT (lesson_obj ->> 'id')::uuid as lesson_id
    FROM jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
         jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj
  ),
  all_chapters AS (
    SELECT (chapter_obj ->> 'id')::uuid as chapter_id
    FROM jsonb_array_elements(course_structure -> 'chapters') as chapter_obj
  ),
  
  -- Count completed content
  completed_blocks AS (
    SELECT COUNT(*) as count
    FROM all_blocks ab
    INNER JOIN public.block_progress bp ON bp.block_id = ab.block_id
    WHERE bp.user_id = p_user_id
      AND bp.published_course_id = p_published_course_id
      AND bp.is_completed = true
  ),
  completed_lessons AS (
    SELECT COUNT(*) as count
    FROM all_lessons al
    INNER JOIN public.lesson_progress lp ON lp.lesson_id = al.lesson_id
    WHERE lp.user_id = p_user_id
      AND lp.published_course_id = p_published_course_id
      AND lp.completed_at IS NOT NULL
  ),
  completed_chapters AS (
    SELECT COUNT(*) as count
    FROM all_chapters ac
    INNER JOIN public.chapter_progress cp ON cp.chapter_id = ac.chapter_id
    WHERE cp.user_id = p_user_id
      AND cp.published_course_id = p_published_course_id
      AND cp.completed_at IS NOT NULL
  )
  
  SELECT
    (SELECT COUNT(*) FROM all_blocks) as total_blocks,
    (SELECT count FROM completed_blocks) as completed_blocks,
    (SELECT COUNT(*) FROM all_lessons) as total_lessons,
    (SELECT count FROM completed_lessons) as completed_lessons,
    (SELECT COUNT(*) FROM all_chapters) as total_chapters,
    (SELECT count FROM completed_chapters) as completed_chapters
  INTO completion_stats;

  RETURN jsonb_build_object(
    'blocks', jsonb_build_object(
      'total', completion_stats.total_blocks,
      'completed', completion_stats.completed_blocks,
      'percentage', CASE 
        WHEN completion_stats.total_blocks > 0 THEN 
          ROUND((completion_stats.completed_blocks::numeric / completion_stats.total_blocks) * 100, 2)
        ELSE 0 
      END,
      'is_complete', (completion_stats.completed_blocks = completion_stats.total_blocks AND completion_stats.total_blocks > 0)
    ),
    'lessons', jsonb_build_object(
      'total', completion_stats.total_lessons,
      'completed', completion_stats.completed_lessons,
      'percentage', CASE 
        WHEN completion_stats.total_lessons > 0 THEN 
          ROUND((completion_stats.completed_lessons::numeric / completion_stats.total_lessons) * 100, 2)
        ELSE 0 
      END,
      'is_complete', (completion_stats.completed_lessons = completion_stats.total_lessons AND completion_stats.total_lessons > 0)
    ),
    'chapters', jsonb_build_object(
      'total', completion_stats.total_chapters,
      'completed', completion_stats.completed_chapters,
      'percentage', CASE 
        WHEN completion_stats.total_chapters > 0 THEN 
          ROUND((completion_stats.completed_chapters::numeric / completion_stats.total_chapters) * 100, 2)
        ELSE 0 
      END,
      'is_complete', (completion_stats.completed_chapters = completion_stats.total_chapters AND completion_stats.total_chapters > 0)
    ),
    'course', jsonb_build_object(
      'is_complete', (completion_stats.completed_blocks = completion_stats.total_blocks AND completion_stats.total_blocks > 0)
    )
  );
END;
$$;
