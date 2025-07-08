-- ============================================================================
-- FUNCTION: can_user_edit_course
-- DESCRIPTION:
--   Returns TRUE if the currently authenticated user has permission to edit
--   the given course, based on their organization role and course ownership.
--
--   Editing rights are granted to:
--     - Organization 'owner'
--     - Organization 'admin'
--     - Organization 'editor' *only if they personally own the course*
--
-- USAGE:
--   select public.can_user_edit_course('course-uuid-here');
--
-- NOTE:
--   This function is SECURITY DEFINER and sets `search_path` to ''
--   to prevent privilege escalation via malicious objects in the path.
-- ============================================================================

create or replace function public.can_user_edit_course(course_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  -- Select whether the current user is allowed to edit the course
  select coalesce(
    -- Check if the user has one of the allowed roles on the course's organization
    (
      public.get_user_org_role(c.organization_id, auth.uid()) in ('owner', 'admin')
      -- OR if the user is an 'editor' AND owns the course
      or (
        public.get_user_org_role(c.organization_id, auth.uid()) = 'editor'
        and c.owned_by = auth.uid()
      )
    ),
    -- If no course is found or conditions not met, default to false
    false
  )
  from public.courses c
  where c.id = course_id
$$;
