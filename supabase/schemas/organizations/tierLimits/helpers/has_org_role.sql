-- ===========================================
-- FUNCTION: has_org_role
-- -------------------------------------------
-- Checks if a user has a minimum required role within an organization.
--
-- Role hierarchy (highest → lowest):
--   - owner > admin > editor
--
-- Returns TRUE if user meets or exceeds the required role.
-- Returns FALSE if the user is not a member or has insufficient privileges.
-- ===========================================

create or replace function public.has_org_role(
  arg_org_id uuid,         -- The ID of the organization
  required_role text,      -- The minimum role required: 'owner', 'admin', or 'editor'
  arg_user_id uuid         -- The ID of the user being checked
)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select 
    case 
      when required_role = 'owner' then 
        coalesce(public.get_user_org_role(arg_org_id, arg_user_id), '') = 'owner'
      when required_role = 'admin' then 
        coalesce(public.get_user_org_role(arg_org_id, arg_user_id), '') in ('admin', 'owner')
      when required_role = 'editor' then 
        coalesce(public.get_user_org_role(arg_org_id, arg_user_id), '') in ('editor', 'admin', 'owner')
      else false  -- invalid role name fallback
    end;
$$;
