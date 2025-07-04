-- ===================================================
-- Function: public.rpc_verify_and_set_active_organization
-- Description: Sets active org if user is a member and returns org context
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
  -- Step 0: Get the current authenticated user's ID
  current_user_id := (select auth.uid());

  -- Step 1: Ensure user is authenticated
  if current_user_id is null then
    return json_build_object(
      'success', false,
      'message', 'User not authenticated',
      'data', null
    );
  end if;

  -- Step 2: Ensure user is a member of the organization
  select * into member
  from public.organization_members om
  where om.organization_id = organization_id_from_url
    and om.user_id = current_user_id;

  if not found then
    return json_build_object(
      'success', false,
      'message', 'You do not have permissions to view this organization',
      'data', null
    );
  end if;

  -- Step 3: Fetch user's current active organization
  select p.active_organization_id into profile_active_org_id
  from public.profiles p
  where p.id = current_user_id;

  -- Step 4: If already active, return current context
  if profile_active_org_id = organization_id_from_url then
  begin
    select * into org
    from public.organizations o
    where o.id = organization_id_from_url;

    can_add := public.can_add_org_member(organization_id_from_url);
    tier_limits_json := public.get_tier_limits_for_org(organization_id_from_url);

    return json_build_object(
      'success', true,
      'message', null,
      'data', json_build_object(
        'organization', to_json(org),
        'member', to_json(member),
        'permissions', json_build_object(
          'can_add_org_member', can_add
        ),
        'tier_limits', tier_limits_json
      )
    );
  end;
  end if;

  -- Step 5: Update profile to set active organization and mode
  update public.profiles p
  set
    active_organization_id = organization_id_from_url,
    mode = 'organization'
  where p.id = current_user_id;

  -- Step 6: Fetch updated organization
  select * into org
  from public.organizations o
  where o.id = organization_id_from_url;

  -- Step 7: Get permissions and tier info
  can_add := public.can_add_org_member(organization_id_from_url);
  tier_limits_json := public.get_tier_limits_for_org(organization_id_from_url);

  -- Step 8: Return updated org context
  return json_build_object(
    'success', true,
    'message', 'Active organization has been changed',
    'data', json_build_object(
      'organization', to_json(org),
      'member', to_json(member),
      'permissions', json_build_object(
        'can_add_org_member', can_add
      ),
      'tier_limits', tier_limits_json
    )
  );
end;
$$;
