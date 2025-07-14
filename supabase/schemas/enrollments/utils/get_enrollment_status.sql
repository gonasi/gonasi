-- ============================================================================
-- FUNCTION: get_enrollment_status
-- ============================================================================
-- Description:
--   Returns detailed enrollment status for a given user and published course:
--     - Whether enrolled and active
--     - Expiry timestamp and days remaining (if applicable)
--     - Latest activity ID for engagement tracking
-- ============================================================================

create or replace function public.get_enrollment_status(
  p_user_id uuid,
  p_published_course_id uuid
) returns table (
  enrollment_id uuid,
  is_enrolled boolean,
  is_active boolean,
  expires_at timestamptz,
  days_remaining integer,
  latest_activity_id uuid
) as $$
declare
  enrollment_expires_at timestamptz;
  enrollment_id_val uuid;
  latest_activity_id_val uuid;
  now_utc timestamptz := timezone('utc', now());
begin
  -- Find active enrollment
  select id, expires_at
    into enrollment_id_val, enrollment_expires_at
  from public.course_enrollments
  where user_id = p_user_id
    and published_course_id = p_published_course_id
    and is_active = true
  limit 1;

  -- Not enrolled
  if not found then
    return query select
      null::uuid,  -- enrollment_id
      false,       -- is_enrolled
      false,       -- is_active
      null::timestamptz,
      null::integer,
      null::uuid;  -- latest_activity_id
    return;
  end if;

  -- Get latest activity
  select id
    into latest_activity_id_val
  from public.course_enrollment_activities
  where enrollment_id = enrollment_id_val
  order by created_at desc
  limit 1;

  -- Return detailed enrollment status
  return query select
    enrollment_id_val,
    true,
    enrollment_expires_at is null or enrollment_expires_at > now_utc,
    enrollment_expires_at,
    case
      when enrollment_expires_at is null then null
      else extract(day from enrollment_expires_at - now_utc)::int
    end,
    latest_activity_id_val;
end;
$$ language plpgsql stable;

-- Set secure schema context
set search_path to '';
