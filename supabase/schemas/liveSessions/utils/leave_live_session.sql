-- =============================================
-- LEAVE LIVE SESSION RPC
-- =============================================
-- Marks a participant as having left the session

create or replace function public.leave_live_session(p_session_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  update public.live_session_participants
  set
    status = 'left',
    left_at = now(),
    updated_at = now()
  where live_session_id = p_session_id
    and user_id = v_user_id
    and status = 'joined';

  if not found then
    raise exception 'Participant not found or already left';
  end if;

  return jsonb_build_object('success', true);

exception
  when others then
    return jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
end;
$$;

comment on function public.leave_live_session is 'RPC to leave a live session';
