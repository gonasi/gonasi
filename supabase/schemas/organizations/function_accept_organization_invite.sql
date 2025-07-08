-- =====================================================================
-- Function: public.accept_organization_invite
-- Purpose:
--   Accepts a pending organization invite and adds the user to the
--   organization if all validation checks pass.
--
-- Updates:
--   - Changed invite_token parameter from uuid to text to match schema
--   - Added organization name to response for better UX
--   - Enhanced error handling and response structure
--   - Added comprehensive logging for debugging
-- =====================================================================

create or replace function public.accept_organization_invite(
  invite_token text,    -- Changed from uuid to text
  user_id uuid,
  user_email text
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite record;
  v_organization record;
  v_existing_member_id uuid;
  now_ts timestamptz := now();
  v_original_rls_setting text;
begin
  -- Store the original RLS setting for restoration later
  select current_setting('row_security', true)
  into v_original_rls_setting;

  -- Temporarily disable RLS for this function
  execute 'set row_security = off';

  -- Step 1: Validate input parameters
  if invite_token is null or trim(invite_token) = '' then
    execute format('set row_security = %L', coalesce(v_original_rls_setting, 'on'));
    return json_build_object(
      'success', false, 
      'message', 'Invalid invitation token.',
      'error_code', 'INVALID_TOKEN'
    );
  end if;

  if user_id is null then
    execute format('set row_security = %L', coalesce(v_original_rls_setting, 'on'));
    return json_build_object(
      'success', false, 
      'message', 'User authentication required.',
      'error_code', 'AUTH_REQUIRED'
    );
  end if;

  if user_email is null or trim(user_email) = '' then
    execute format('set row_security = %L', coalesce(v_original_rls_setting, 'on'));
    return json_build_object(
      'success', false, 
      'message', 'User email is required.',
      'error_code', 'EMAIL_REQUIRED'
    );
  end if;

  -- Step 2: Fetch the invite by token
  select oi.id, oi.organization_id, oi.email, oi.role, oi.invited_by, oi.accepted_at, oi.revoked_at, oi.expires_at
  into v_invite
  from public.organization_invites oi
  where oi.token = accept_organization_invite.invite_token;

  if not found then
    execute format('set row_security = %L', coalesce(v_original_rls_setting, 'on'));
    return json_build_object(
      'success', false, 
      'message', 'This invite link is invalid or no longer exists.',
      'error_code', 'INVITE_NOT_FOUND'
    );
  end if;

  -- Step 3: Get organization details for response
  select o.id, o.name, o.tier
  into v_organization
  from public.organizations o
  where o.id = v_invite.organization_id;

  if not found then
    execute format('set row_security = %L', coalesce(v_original_rls_setting, 'on'));
    return json_build_object(
      'success', false, 
      'message', 'The organization for this invite no longer exists.',
      'error_code', 'ORGANIZATION_NOT_FOUND'
    );
  end if;

  -- Step 4: Validate invite state
  if v_invite.revoked_at is not null then
    execute format('set row_security = %L', coalesce(v_original_rls_setting, 'on'));
    return json_build_object(
      'success', false, 
      'message', 'This invite was revoked by the organization.',
      'error_code', 'INVITE_REVOKED'
    );
  end if;

  if v_invite.accepted_at is not null then
    execute format('set row_security = %L', coalesce(v_original_rls_setting, 'on'));
    return json_build_object(
      'success', false, 
      'message', 'This invite has already been accepted.',
      'error_code', 'INVITE_ALREADY_ACCEPTED'
    );
  end if;

  if v_invite.expires_at is not null and v_invite.expires_at < now_ts then
    execute format('set row_security = %L', coalesce(v_original_rls_setting, 'on'));
    return json_build_object(
      'success', false, 
      'message', 'This invite has expired. Please request a new one.',
      'error_code', 'INVITE_EXPIRED'
    );
  end if;

  -- Step 5: Validate email match (case-insensitive)
  if v_invite.email is not null and lower(v_invite.email) != lower(accept_organization_invite.user_email) then
    execute format('set row_security = %L', coalesce(v_original_rls_setting, 'on'));
    return json_build_object(
      'success', false, 
      'message', 'This invite was sent to a different email address.',
      'error_code', 'EMAIL_MISMATCH'
    );
  end if;

  -- Step 6: Check if the user is already a member
  select om.id
  into v_existing_member_id
  from public.organization_members om
  where om.organization_id = v_invite.organization_id
    and om.user_id = accept_organization_invite.user_id;

  if found then
    execute format('set row_security = %L', coalesce(v_original_rls_setting, 'on'));
    return json_build_object(
      'success', false, 
      'message', 'You are already a member of this organization.',
      'error_code', 'ALREADY_MEMBER'
    );
  end if;

  -- Step 7: Check if organization can accept new members
  if not public.can_accept_new_member(v_invite.organization_id) then
    execute format('set row_security = %L', coalesce(v_original_rls_setting, 'on'));
    return json_build_object(
      'success', false, 
      'message', 'This organization has reached its member limit.',
      'error_code', 'MEMBER_LIMIT_REACHED'
    );
  end if;

  -- Step 8: Mark invite as accepted
  update public.organization_invites
  set accepted_at = now_ts,
      accepted_by = accept_organization_invite.user_id,
      updated_at = now_ts
  where id = v_invite.id;

  -- Step 9: Add user to organization_members
  insert into public.organization_members (
    organization_id,
    user_id,
    role,
    invited_by,
    created_at,
    updated_at
  )
  values (
    v_invite.organization_id,
    accept_organization_invite.user_id,
    v_invite.role,
    v_invite.invited_by,
    now_ts,
    now_ts
  );

  -- Step 10: Restore original RLS setting
  execute format('set row_security = %L', coalesce(v_original_rls_setting, 'on'));

  -- Step 11: Return success response with enhanced data
  return json_build_object(
    'success', true,
    'message', format('Welcome to %s! You''ve successfully joined as %s.', v_organization.name, v_invite.role),
    'data', json_build_object(
      'organization_id', v_invite.organization_id,
      'organization_name', v_organization.name,
      'role', v_invite.role,
      'user_id', accept_organization_invite.user_id,
      'joined_at', now_ts
    )
  );

exception
  when others then
    -- Restore RLS setting in case of any exception
    execute format('set row_security = %L', coalesce(v_original_rls_setting, 'on'));
    
    -- Log the error for debugging
    raise log 'Error in accept_organization_invite: % %', sqlstate, sqlerrm;
    
    -- Return user-friendly error
    return json_build_object(
      'success', false,
      'message', 'An unexpected error occurred while processing your invitation.',
      'error_code', 'INTERNAL_ERROR'
    );
end;
$$;