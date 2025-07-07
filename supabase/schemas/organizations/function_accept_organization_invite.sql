-- =====================================================================
-- Function: public.accept_organization_invite
-- Purpose:
--   Accepts a pending organization invite and adds the user to the
--   organization if all validation checks pass.
--
-- Notes:
--   - Uses SECURITY DEFINER and disables RLS temporarily.
--   - No exception block: errors will bubble up to the caller.
--   - Fully qualifies ambiguous references to avoid type mismatches.
-- =====================================================================

create or replace function public.accept_organization_invite(
  invite_token uuid,
  user_id uuid,
  user_email text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite record;
  v_existing_member_id uuid;
  now_ts timestamptz := now();
  v_original_rls_setting text;
begin
  -- Store the original RLS setting for restoration later
  select current_setting('row_security', true)
  into v_original_rls_setting;

  -- Temporarily disable RLS for this function
  execute 'set row_security = off';

  -- Step 1: Fetch the invite by token
  select id, organization_id, email, role, invited_by, accepted_at, revoked_at, expires_at
  into v_invite
  from public.organization_invites
  where token = accept_organization_invite.invite_token;

  if not found then
    execute format('set row_security = %L', coalesce(v_original_rls_setting, 'on'));
    return json_build_object('success', false, 'message', 'This invite link is invalid or no longer exists.');
  end if;

  -- Step 2: Validate invite state
  if v_invite.revoked_at is not null then
    execute format('set row_security = %L', coalesce(v_original_rls_setting, 'on'));
    return json_build_object('success', false, 'message', 'This invite was revoked by the organization.');
  end if;

  if v_invite.accepted_at is not null then
    execute format('set row_security = %L', coalesce(v_original_rls_setting, 'on'));
    return json_build_object('success', false, 'message', 'This invite has already been accepted.');
  end if;

  if v_invite.expires_at is not null and v_invite.expires_at < now_ts then
    execute format('set row_security = %L', coalesce(v_original_rls_setting, 'on'));
    return json_build_object('success', false, 'message', 'This invite has expired. Please request a new one.');
  end if;

  -- Step 3: Validate email match (if applicable)
  if v_invite.email is not null and v_invite.email != accept_organization_invite.user_email then
    execute format('set row_security = %L', coalesce(v_original_rls_setting, 'on'));
    return json_build_object('success', false, 'message', 'This invite was sent to a different email address.');
  end if;

  -- Step 4: Check if the user is already a member
  select id
  into v_existing_member_id
  from public.organization_members
  where organization_id = v_invite.organization_id
    and user_id = accept_organization_invite.user_id; -- qualified to avoid ambiguity

  if found then
    execute format('set row_security = %L', coalesce(v_original_rls_setting, 'on'));
    return json_build_object('success', false, 'message', 'You are already a member of this organization.');
  end if;

  -- Step 5: Mark invite as accepted
  update public.organization_invites
  set accepted_at = now_ts,
      accepted_by = accept_organization_invite.user_id,
      updated_at = now_ts
  where id = v_invite.id;

  -- Step 6: Add user to organization_members
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

  -- Step 7: Restore original RLS setting
  execute format('set row_security = %L', coalesce(v_original_rls_setting, 'on'));

  -- Step 8: Return success response
  return json_build_object(
    'success', true,
    'message', 'You''ve successfully joined the organization.',
    'data', json_build_object(
      'organization_id', v_invite.organization_id,
      'role', v_invite.role,
      'user_id', accept_organization_invite.user_id,
      'joined_at', now_ts
    )
  );
end;
$$;
