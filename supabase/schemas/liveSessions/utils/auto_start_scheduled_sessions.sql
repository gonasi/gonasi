-- =============================================
-- FUNCTION: auto_start_scheduled_sessions
-- =============================================
-- Automatically starts sessions that:
-- 1. Have session_type = 'auto_start'
-- 2. Have scheduled_start_time in the past
-- 3. Are currently in 'waiting' status
-- 4. Meet all requirements to start (validated by can_start_live_session)
--
-- This function is designed to be called by a cron job or scheduled task
-- Returns array of session IDs that were successfully started

create or replace function public.auto_start_scheduled_sessions()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session record;
  v_started_sessions uuid[] := '{}';
  v_failed_sessions jsonb[] := '{}';
  v_validation_result jsonb;
begin
  -- Find all auto_start sessions ready to begin
  for v_session in
    select id, name, scheduled_start_time
    from public.live_sessions
    where session_type = 'auto_start'
      and status = 'waiting'
      and scheduled_start_time is not null
      and scheduled_start_time <= now()
    order by scheduled_start_time asc
  loop
    -- Validate session can start
    v_validation_result := public.can_start_live_session(v_session.id);

    if (v_validation_result->>'can_start')::boolean then
      -- Start the session by transitioning to active
      -- This will automatically:
      -- 1. Set actual_start_time to now()
      -- 2. Trigger play_state to become 'lobby' via existing triggers
      update public.live_sessions
      set
        status = 'active',
        actual_start_time = now(),
        play_state = 'lobby',
        updated_at = now()
      where id = v_session.id;

      -- Add to success list
      v_started_sessions := array_append(v_started_sessions, v_session.id);

      -- TODO: Consider emitting a notification/event here for participants
      -- that the session has started

    else
      -- Add to failed list with reason
      v_failed_sessions := array_append(
        v_failed_sessions,
        jsonb_build_object(
          'session_id', v_session.id,
          'session_name', v_session.name,
          'scheduled_time', v_session.scheduled_start_time,
          'errors', v_validation_result->'errors'
        )
      );
    end if;
  end loop;

  -- Return summary
  return jsonb_build_object(
    'started_count', array_length(v_started_sessions, 1),
    'started_session_ids', v_started_sessions,
    'failed_count', array_length(v_failed_sessions, 1),
    'failed_sessions', v_failed_sessions,
    'executed_at', now()
  );
end;
$$;

-- Grant execute permission to service role (for cron jobs)
grant execute on function public.auto_start_scheduled_sessions() to service_role;

-- Add comment
comment on function public.auto_start_scheduled_sessions() is
'Automatically starts auto_start sessions whose scheduled_start_time has passed. Returns summary of started and failed sessions. Intended to be called by scheduled cron job.';
