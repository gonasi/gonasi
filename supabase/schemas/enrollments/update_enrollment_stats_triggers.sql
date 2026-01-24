-- ====================================================================================
-- TRIGGER FUNCTIONS: Update enrollment stats on published_courses
-- ====================================================================================
-- PURPOSE:
--   Automatically update total_enrollments and active_enrollments when:
--   - A new enrollment activity is created (includes re-enrollments)
--   - An enrollment is created, updated, or reactivated
-- ====================================================================================

-- ====================================================================================
-- FUNCTION: update_total_enrollments_on_activity
-- ====================================================================================
-- Increments total_enrollments when a new enrollment activity is created
-- This includes initial enrollments AND re-enrollments
create or replace function public.update_total_enrollments_on_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_published_course_id uuid;
begin
  -- Get the published_course_id from the enrollment record
  select published_course_id
  into v_published_course_id
  from public.course_enrollments
  where id = NEW.enrollment_id;

  if not found then
    raise exception 'Enrollment not found for enrollment_id: %', NEW.enrollment_id;
  end if;

  -- Increment total_enrollments (includes re-enrollments)
  update public.published_courses
  set
    total_enrollments = total_enrollments + 1,
    updated_at = timezone('utc', now())
  where id = v_published_course_id;

  return NEW;
end;
$$;

-- Trigger: After insert on course_enrollment_activities
drop trigger if exists trg_update_total_enrollments on public.course_enrollment_activities;
create trigger trg_update_total_enrollments
  after insert on public.course_enrollment_activities
  for each row
  execute function public.update_total_enrollments_on_activity();

-- ====================================================================================
-- FUNCTION: update_active_enrollments_count
-- ====================================================================================
-- Updates active_enrollments count when enrollments are created or updated
create or replace function public.update_active_enrollments_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := timezone('utc', now());
  v_old_is_active boolean := false;
  v_new_is_active boolean := false;
begin
  -- Determine if OLD enrollment was active
  if TG_OP = 'UPDATE' then
    v_old_is_active := OLD.is_active
      and (OLD.expires_at is null or OLD.expires_at > v_now);
  end if;

  -- Determine if NEW enrollment is active
  v_new_is_active := NEW.is_active
    and (NEW.expires_at is null or NEW.expires_at > v_now);

  -- Only update if the active status changed
  if v_old_is_active != v_new_is_active then
    update public.published_courses
    set
      active_enrollments = (
        select count(*)
        from public.course_enrollments ce
        where ce.published_course_id = NEW.published_course_id
          and ce.is_active = true
          and (ce.expires_at is null or ce.expires_at > v_now)
      ),
      updated_at = v_now
    where id = NEW.published_course_id;
  end if;

  return NEW;
end;
$$;

-- Triggers: After insert or update on course_enrollments
drop trigger if exists trg_update_active_enrollments_insert on public.course_enrollments;
create trigger trg_update_active_enrollments_insert
  after insert on public.course_enrollments
  for each row
  execute function public.update_active_enrollments_count();

drop trigger if exists trg_update_active_enrollments_update on public.course_enrollments;
create trigger trg_update_active_enrollments_update
  after update on public.course_enrollments
  for each row
  when (OLD.is_active is distinct from NEW.is_active or OLD.expires_at is distinct from NEW.expires_at)
  execute function public.update_active_enrollments_count();
