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
) returns boolean 
language plpgsql 
stable 
set search_path = ''
as $$
declare
  enrollment_expires_at timestamptz;
  now_utc timestamptz := timezone('utc', now());
begin
  -- Validate input parameters
  if p_user_id is null or p_published_course_id is null then
    return false;
  end if;

  -- Get the expiration date of the active enrollment
  select expires_at
    into enrollment_expires_at
  from public.course_enrollments
  where user_id = p_user_id
    and published_course_id = p_published_course_id
    and is_active = true
  limit 1;

  -- If no active enrollment found, return false
  if not found then
    return false;
  end if;

  -- Return true if enrollment never expires OR hasn't expired yet
  return enrollment_expires_at is null or enrollment_expires_at > now_utc;

exception
  when others then
    -- Log the error and return false for safety
    raise notice 'Error in user_has_active_access for user % and course %: %', 
      p_user_id, p_published_course_id, SQLERRM;
    return false;
end;
$$;