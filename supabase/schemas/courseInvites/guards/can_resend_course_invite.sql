-- ===================================================
-- FUNCTION: can_resend_course_invite
-- ===================================================
-- Purpose: Prevent spam by enforcing a cooldown period between resends
--
-- Rules:
-- - Must wait at least 5 minutes between resend attempts
-- - This prevents accidental or malicious rapid resending
-- ===================================================

create or replace function public.can_resend_course_invite(
  p_invite_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  last_sent timestamptz;
  min_wait_interval interval := interval '5 minutes';
begin
  -- Get the last sent timestamp
  select last_sent_at into last_sent
  from public.course_invites
  where id = p_invite_id;

  -- If no record found, return false
  if last_sent is null then
    return false;
  end if;

  -- Check if enough time has passed since last send
  return (now() - last_sent) >= min_wait_interval;
end;
$$;
