-- ============================================================================
-- FUNCTION: user_has_active_access
-- ============================================================================
-- Description:
--   Returns true if the user has an active, non-expired enrollment in a 
--   given published course. Assumes only one active enrollment per user.
-- ============================================================================

create or replace function public.user_has_active_access(
  p_user_id uuid,
  p_published_course_id uuid
) returns boolean as $$
declare
  enrollment_expires_at timestamptz;
  now_utc timestamptz := timezone('utc', now());
begin
  select expires_at
    into enrollment_expires_at
  from public.course_enrollments
  where user_id = p_user_id
    and published_course_id = p_published_course_id
    and is_active = true
  limit 1;

  if not found then
    return false;
  end if;

  return enrollment_expires_at is null or enrollment_expires_at > now_utc;
end;
$$ language plpgsql stable;

-- Set secure schema context
set search_path to '';
