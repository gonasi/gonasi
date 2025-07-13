-- ==========================================================================
-- CLEANUP AND MAINTENANCE FUNCTIONS
-- ==========================================================================

-- Function to deactivate expired enrollments and update stats
create or replace function deactivate_expired_enrollments()
returns integer as $$
declare
  updated_count integer;
  affected_courses uuid[];
  course_id uuid;
  now_utc timestamptz := timezone('utc', now());
begin
  -- Get list of courses that will be affected
  select array_agg(distinct published_course_id) into affected_courses
  from course_enrollments
  where is_active = true
    and expires_at is not null
    and expires_at <= now_utc;
  
  -- Deactivate expired enrollments
  update course_enrollments
  set is_active = false
  where is_active = true
    and expires_at is not null
    and expires_at <= now_utc;
  
  get diagnostics updated_count = row_count;
  
  -- Update stats for affected published courses
  if affected_courses is not null then
    foreach course_id in array affected_courses
    loop
      update published_courses 
      set 
        active_enrollments = (
          select count(*)
          from course_enrollments ce
          where ce.published_course_id = course_id
            and ce.is_active = true
            and (ce.expires_at is null or ce.expires_at > now_utc)
        ),
        updated_at = now_utc
      where id = course_id;
    end loop;
  end if;
  
  return updated_count;
end;
$$ language plpgsql;

-- Function to mark course as completed and update stats
create or replace function mark_course_completed(
  p_enrollment_id uuid,
  p_completed_by uuid
) returns boolean as $$
declare
  enrollment_record record;
  now_utc timestamptz := timezone('utc', now());
begin
  -- Get enrollment details
  select * into enrollment_record
  from course_enrollments
  where id = p_enrollment_id
    and is_active = true
    and completed_at is null;
  
  if not found then
    return false;
  end if;
  
  -- Mark as completed
  update course_enrollments
  set completed_at = now_utc
  where id = p_enrollment_id;
  
  -- Update published course completion stats
  update published_courses 
  set 
    completion_rate = (
      select (count(*) filter (where completed_at is not null) * 100.0 / count(*))::numeric(5,2)
      from course_enrollments ce
      where ce.published_course_id = enrollment_record.published_course_id
        and ce.is_active = true
    ),
    updated_at = now_utc
  where id = enrollment_record.published_course_id;
  
  return true;
end;
$$ language plpgsql;
