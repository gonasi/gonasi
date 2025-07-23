-- =============================================================================
-- function: get_course_navigation_info
-- =============================================================================
-- description:
--   Returns basic metadata for a published course used in the navigation context,
--   such as title, description, and associated organization.
--
-- parameters:
--   p_user_id              - uuid of the user (currently unused but reserved for future use)
--   p_published_course_id  - uuid of the published course
--   course_structure       - jsonb structure of the course (not used here)
--
-- returns:
--   jsonb object with: id, title, description, organization_id
-- =============================================================================

create or replace function public.get_course_navigation_info(
  p_user_id uuid,
  p_published_course_id uuid,
  course_structure jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  course_info record;
begin
  -- fetch basic metadata about the course
  select 
    pc.id,
    pc.title,
    pc.description,
    pc.organization_id
  into course_info
  from public.published_courses pc
  where pc.id = p_published_course_id;

  -- return the course metadata as a jsonb object
  return jsonb_build_object(
    'id', course_info.id,
    'title', course_info.title,
    'description', course_info.description,
    'organization_id', course_info.organization_id
  );
end;
$$;
