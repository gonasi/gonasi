-- ============================================================================
-- FUNCTION: get_enrollment_status
-- ============================================================================
-- Description:
--   Returns detailed enrollment status for a given user and published course.
--   Specifically returns:
--     - Enrollment ID (if exists)
--     - Whether the user is enrolled
--     - Whether their enrollment is currently active (based on expiry)
--     - When the enrollment expires
--     - Days remaining until expiry (if any)
--     - ID of the most recent course activity (for engagement tracking)
-- ============================================================================

create or replace function public.get_enrollment_status(
  p_user_id uuid,               -- The ID of the user
  p_published_course_id uuid    -- The ID of the published course
) returns table (
  enrollment_id uuid,           -- ID of the enrollment record
  is_enrolled boolean,          -- Is the user enrolled?
  is_active boolean,            -- Is the enrollment still active (not expired)?
  expires_at timestamptz,       -- When the enrollment expires (if it does)
  days_remaining integer,       -- Days left until expiry (null if never expires)
  latest_activity_id uuid       -- Most recent activity ID (used for progress tracking)
)
as $$
declare
  -- Declare temporary variables to hold queried values
  enrollment_id_val uuid;
  enrollment_expires_at timestamptz;
  latest_activity_id_val uuid;
  now_utc timestamptz := timezone('utc', now());  -- Always compare times in UTC
begin
  -- STEP 1: Attempt to find an active enrollment for this user and course
  select ce.id, ce.expires_at
    into enrollment_id_val, enrollment_expires_at
  from public.course_enrollments ce
  where ce.user_id = p_user_id
    and ce.published_course_id = p_published_course_id
    and ce.is_active = true
  limit 1;

  -- STEP 2: If no enrollment was found, return a default "not enrolled" row
  if not found then
    return query select
      null::uuid as enrollment_id,
      false as is_enrolled,
      false as is_active,
      null::timestamptz as expires_at,
      null::integer as days_remaining,
      null::uuid as latest_activity_id;
  end if;

  -- STEP 3: If enrolled, find the most recent activity
  select cea.id
    into latest_activity_id_val
  from public.course_enrollment_activities cea
  where cea.enrollment_id = enrollment_id_val
  order by cea.created_at desc
  limit 1;

  -- STEP 4: Return detailed enrollment status
  return query select
    enrollment_id_val as enrollment_id,
    true as is_enrolled,
    enrollment_expires_at is null or enrollment_expires_at > now_utc as is_active,
    enrollment_expires_at as expires_at,
    case
      when enrollment_expires_at is null then null
      else extract(day from enrollment_expires_at - now_utc)::int
    end as days_remaining,
    latest_activity_id_val as latest_activity_id;
end;
$$ language plpgsql stable
set search_path = '';
