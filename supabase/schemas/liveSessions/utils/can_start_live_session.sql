-- =============================================
-- FUNCTION: can_start_live_session
-- =============================================
-- Validates if a live session is ready to start
-- Requirements:
-- 1. Must have a thumbnail (image_url)
-- 2. Must have at least one block
-- 3. Session must not be ended

create or replace function public.can_start_live_session(arg_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session record;
  v_block_count integer;
  v_errors text[] := '{}';
begin
  -- Get session details
  select
    id,
    name,
    image_url,
    status,
    session_type,
    scheduled_start_time
  into v_session
  from public.live_sessions
  where id = arg_session_id;

  -- Check if session exists
  if not found then
    return jsonb_build_object(
      'can_start', false,
      'errors', jsonb_build_array('Session not found')
    );
  end if;

  -- Check if session is already ended
  if v_session.status = 'ended' then
    v_errors := array_append(v_errors, 'Cannot start an ended session');
  end if;

  -- Check if auto_start sessions have scheduled_start_time
  if v_session.session_type = 'auto_start' and (v_session.scheduled_start_time is null) then
    v_errors := array_append(v_errors, 'Auto-start sessions must have a scheduled start time');
  end if;

  -- Check if thumbnail exists
  if v_session.image_url is null or v_session.image_url = '' then
    v_errors := array_append(v_errors, 'Session must have a thumbnail before starting');
  end if;

  -- Check if session has at least one block
  select count(*)
  into v_block_count
  from public.live_session_blocks
  where session_id = arg_session_id;

  if v_block_count = 0 then
    v_errors := array_append(v_errors, 'Session must have at least one block before starting');
  end if;

  -- Return result
  if array_length(v_errors, 1) > 0 then
    return jsonb_build_object(
      'can_start', false,
      'errors', array_to_json(v_errors)
    );
  else
    return jsonb_build_object(
      'can_start', true,
      'errors', jsonb_build_array()
    );
  end if;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.can_start_live_session(uuid) to authenticated;

-- Add comment
comment on function public.can_start_live_session(uuid) is 'Validates if a live session meets all requirements to be started (has thumbnail and at least one block)';
