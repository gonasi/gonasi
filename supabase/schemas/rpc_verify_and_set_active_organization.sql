create or replace function public.rpc_verify_and_set_active_organization(
  organization_id_from_url uuid  -- Org ID from URL
)
returns json
language plpgsql
security definer  -- This ensures the function runs with elevated privileges
set search_path = ''
as $$
declare
  org public.organizations;                  
  member public.organization_members;        
  profile_active_org_id uuid;
  current_user_id uuid;                
begin
  -- Get the current authenticated user's ID
  current_user_id := (select auth.uid());
  
  -- Ensure user is authenticated
  if current_user_id is null then
    return json_build_object(
      'success', false,
      'message', 'User not authenticated',
      'data', null
    );
  end if;

  -- Step 1: Ensure user is a member of the organization
  select * into member
  from public.organization_members om
  where om.organization_id = rpc_verify_and_set_active_organization.organization_id_from_url
    and om.user_id = current_user_id;

  if not found then
    return json_build_object(
      'success', false,
      'message', 'You do not have permissions to view this organization',
      'data', null
    );
  end if;

  -- Step 2: Fetch user's current active organization
  select p.active_organization_id into profile_active_org_id
  from public.profiles p
  where p.id = current_user_id;

  -- Step 3: If already active, just return data silently
  if profile_active_org_id = rpc_verify_and_set_active_organization.organization_id_from_url then
    select * into org
    from public.organizations o
    where o.id = rpc_verify_and_set_active_organization.organization_id_from_url;

    return json_build_object(
      'success', true,
      'message', null,
      'data', json_build_object(
        'organization', to_json(org),
        'member', to_json(member)
      )
    );
  end if;

  -- Step 4: Update profile to switch active organization
  update public.profiles p
  set active_organization_id = rpc_verify_and_set_active_organization.organization_id_from_url
  where p.id = current_user_id;

  -- Step 5: Fetch the updated organization
  select * into org
  from public.organizations o
  where o.id = rpc_verify_and_set_active_organization.organization_id_from_url;

  -- Step 6: Return success with updated state
  return json_build_object(
    'success', true,
    'message', 'Active organization has been changed',
    'data', json_build_object(
      'organization', to_json(org),
      'member', to_json(member)
    )
  );
end;
$$;