-- =============================================================================
-- FUNCTION: get_course_navigation_info
-- =============================================================================
-- Returns general course information for navigation context.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_course_navigation_info(
  p_user_id uuid,
  p_published_course_id uuid,
  course_structure jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  course_info record;
BEGIN
  SELECT 
    pc.id,
    pc.title,
    pc.description,
    pc.organization_id
  INTO course_info
  FROM public.published_courses pc
  WHERE pc.id = p_published_course_id;

  RETURN jsonb_build_object(
    'id', course_info.id,
    'title', course_info.title,
    'description', course_info.description,
    'organization_id', course_info.organization_id
  );
END;
$$;