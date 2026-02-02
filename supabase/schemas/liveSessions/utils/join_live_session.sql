-- =============================================
-- JOIN LIVE SESSION RPC
-- =============================================
-- Validates and joins a user to a live session
-- Checks visibility, session key, max participants, and session status

create or replace function join_live_session(
  p_session_code text,
  p_session_key text default null,
  p_display_name text default null
)
returns jsonb
language plpgsql
security invoker
as $$
declare
  v_session_id uuid;
  v_session_visibility live_session_visibility;
  v_session_status live_session_status;
  v_required_key text;
  v_organization_id uuid;
  v_allow_late_join boolean;
  v_max_participants integer;
  v_current_participants integer;
  v_participant_id uuid;
  v_user_id uuid;
begin
  -- Get current user
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  -- Find session
  select
    id, visibility, status, session_key, organization_id, allow_late_join, max_participants
  into
    v_session_id, v_session_visibility, v_session_status, v_required_key, v_organization_id, v_allow_late_join, v_max_participants
  from live_sessions
  where session_code = upper(p_session_code);

  if v_session_id is null then
    raise exception 'Session not found';
  end if;

  -- Check if session is joinable
  if v_session_status = 'draft' then
    raise exception 'Session has not started yet';
  end if;

  if v_session_status = 'ended' then
    raise exception 'Session has already ended';
  end if;

  if v_session_status = 'active' and not v_allow_late_join then
    raise exception 'Late joining is not allowed for this session';
  end if;

  -- Check visibility and key
  if v_session_visibility = 'private' then
    if p_session_key is null or p_session_key != v_required_key then
      raise exception 'Invalid session key';
    end if;
  end if;

  -- Check if user is member of the organization
  if not exists (
    select 1 from organization_members
    where user_id = v_user_id and organization_id = v_organization_id
  ) then
    raise exception 'You must be a member of this organization to join';
  end if;

  -- Check max participants
  if v_max_participants is not null then
    select count(*) into v_current_participants
    from live_session_participants
    where live_session_id = v_session_id and status = 'joined';

    if v_current_participants >= v_max_participants then
      raise exception 'Session is full';
    end if;
  end if;

  -- Insert or update participant
  insert into live_session_participants (
    live_session_id,
    user_id,
    organization_id,
    display_name,
    status
  )
  values (
    v_session_id,
    v_user_id,
    v_organization_id,
    p_display_name,
    'joined'
  )
  on conflict (live_session_id, user_id)
  do update set
    status = 'joined',
    display_name = coalesce(excluded.display_name, live_session_participants.display_name),
    joined_at = now(),
    left_at = null,
    updated_at = now()
  returning id into v_participant_id;

  return jsonb_build_object(
    'success', true,
    'session_id', v_session_id,
    'participant_id', v_participant_id
  );

exception
  when others then
    return jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
end;
$$;

comment on function join_live_session is 'RPC to join a live session with validation for visibility, key, and capacity';
