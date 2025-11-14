-- ===========================================
-- FUNCTION: get_user_org_role
-- -------------------------------------------
-- Returns the role (e.g. 'owner', 'admin', 'editor') of a user 
-- within a specific organization.
--
-- If the user is not a member of the organization, returns NULL.
--
-- Used throughout the platform for permission checks and UI logic.
-- ===========================================

create or replace function public.get_user_org_role(
  arg_org_id uuid,         -- The ID of the organization
  arg_user_id uuid         -- The ID of the user being checked
)
returns text
language sql
security definer
stable
set search_path = ''
as $$
  select om.role::text
  from public.organization_members om
  where om.organization_id = arg_org_id
    and om.user_id = arg_user_id
  limit 1;
$$;
