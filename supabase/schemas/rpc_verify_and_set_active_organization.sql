-- ===================================================
-- Function: public.rpc_verify_and_set_active_organization
-- Description:
--   - Verifies if the authenticated user is a member of a given organization.
--   - If the user is a member:
--       • Updates their profile to set the given org as the active organization.
--       • Returns full organization context including:
--           ◦ organization details
--           ◦ membership info
--           ◦ tier-based permissions (e.g. can_accept_new_member)
--   - If the user is NOT a member:
--       • Switches their profile to "personal" mode.
--       • Clears active_organization_id.
--       • Returns a message indicating access denial.
-- Use Case:
--   - Called on page load or navigation to a specific organization's dashboard
--   - Ensures the user has access and sets appropriate context
-- Security:
--   - `SECURITY DEFINER` to allow trusted access via RLS-protected tables
-- ===================================================

create or replace function public.rpc_verify_and_set_active_organization(
  organization_id_from_url uuid
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  org public.organizations;
  member public.organization_members;
  profile_active_org_id uuid;
  current_user_id uuid;
  can_add boolean;
  tier_limits_json json;
begin
  -- Get the ID of the currently authenticated user
  current_user_id := (select auth.uid());

  -- Block unauthenticated users
  if current_user_id is null then
    return json_build_object(
      'success', false,
      'message', 'User not authenticated',
      'data', null
    );
  end if;

  -- Check if the user is a member of the target organization
  select * into member
  from public.organization_members om
  where om.organization_id = organization_id_from_url
    and om.user_id = current_user_id;

  -- If not a member, reset profile to personal mode and return early
  if not found then
    update public.profiles
    set
      mode = 'personal',
      active_organization_id = null
    where id = current_user_id;

    return json_build_object(
      'success', false,
      'message', 'You are no longer a member of this organization. Switched to personal mode.',
      'data', null
    );
  end if;

  -- Fetch the current active organization from profile
  select p.active_organization_id into profile_active_org_id
  from public.profiles p
  where p.id = current_user_id;

  -- If already set to this org, return the current org context
  if profile_active_org_id = organization_id_from_url then
  begin
    select * into org
    from public.organizations o
    where o.id = organization_id_from_url;

    can_add := public.can_accept_new_member(organization_id_from_url);
    tier_limits_json := public.get_tier_limits_for_org(organization_id_from_url);

    return json_build_object(
      'success', true,
      'message', null,
      'data', json_build_object(
        'organization', to_json(org),
        'member', to_json(member),
        'permissions', json_build_object(
          'can_accept_new_member', can_add
        ),
        'tier_limits', tier_limits_json
      )
    );
  end;
  end if;

  -- Set the target org as the active org and update mode to "organization"
  update public.profiles p
  set
    active_organization_id = organization_id_from_url,
    mode = 'organization'
  where p.id = current_user_id;

  -- Fetch organization details
  select * into org
  from public.organizations o
  where o.id = organization_id_from_url;

  -- Fetch permissions and tier config
  can_add := public.can_accept_new_member(organization_id_from_url);
  tier_limits_json := public.get_tier_limits_for_org(organization_id_from_url);

  -- Return updated organization context
  return json_build_object(
    'success', true,
    'message', 'Active organization has been changed',
    'data', json_build_object(
      'organization', to_json(org),
      'member', to_json(member),
      'permissions', json_build_object(
        'can_accept_new_member', can_add
      ),
      'tier_limits', tier_limits_json
    )
  );
end;
$$;
