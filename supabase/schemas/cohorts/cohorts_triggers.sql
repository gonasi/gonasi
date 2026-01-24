-- =====================================================================================
-- Cohorts Triggers and Functions
-- =====================================================================================
-- This file defines triggers for cohorts functionality:
-- 1. Validation triggers (organization/course matching)
-- 2. Enrollment count triggers (maintain denormalized counts)
-- 3. History logging triggers (track cohort reassignments)
-- 4. Updated_at triggers (maintain audit timestamps)
-- =====================================================================================

-- =====================================================================================
-- VALIDATION TRIGGER 1: Validate Cohort Organization-Course Match
-- =====================================================================================
-- Ensures cohort.organization_id matches published_courses.organization_id
-- Prevents cohorts from being created for courses they don't own
-- =====================================================================================
create or replace function public.validate_cohort_organization_course_match()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_course_org_id uuid;
begin
  -- Get the organization_id from the published course
  select organization_id
  into v_course_org_id
  from public.published_courses
  where id = NEW.published_course_id;

  if not found then
    raise exception 'Published course not found: %', NEW.published_course_id;
  end if;

  -- Verify organization match
  if v_course_org_id != NEW.organization_id then
    raise exception 'Cohort organization_id (%) does not match published course organization_id (%)',
      NEW.organization_id, v_course_org_id;
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_validate_cohort_org_course_match on public.cohorts;
create trigger trg_validate_cohort_org_course_match
  before insert or update on public.cohorts
  for each row
  execute function public.validate_cohort_organization_course_match();

-- =====================================================================================
-- VALIDATION TRIGGER 2: Validate Enrollment Cohort-Course Match
-- =====================================================================================
-- Ensures enrollment.cohort_id references a cohort for the same published_course_id
-- Allows cohort_id = NULL (enrollments can exist without cohorts)
-- =====================================================================================
create or replace function public.validate_enrollment_cohort_course_match()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cohort_course_id uuid;
begin
  -- Allow NULL cohort_id (enrollments without cohorts are valid)
  if NEW.cohort_id is null then
    return NEW;
  end if;

  -- Get the published_course_id from the cohort
  select published_course_id
  into v_cohort_course_id
  from public.cohorts
  where id = NEW.cohort_id;

  if not found then
    raise exception 'Cohort not found: %', NEW.cohort_id;
  end if;

  -- Verify course match
  if v_cohort_course_id != NEW.published_course_id then
    raise exception 'Cohort belongs to course % but enrollment is for course %',
      v_cohort_course_id, NEW.published_course_id;
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_validate_enrollment_cohort_match on public.course_enrollments;
create trigger trg_validate_enrollment_cohort_match
  before insert or update of cohort_id on public.course_enrollments
  for each row
  execute function public.validate_enrollment_cohort_course_match();

-- =====================================================================================
-- ENROLLMENT COUNT TRIGGER 1: INSERT - Increment Cohort Count
-- =====================================================================================
-- Increments cohort.current_enrollment_count when a new enrollment is created with a cohort
-- =====================================================================================
create or replace function public.increment_cohort_enrollment_count_on_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Only update if cohort_id is not null
  if NEW.cohort_id is not null then
    update public.cohorts
    set
      current_enrollment_count = current_enrollment_count + 1,
      updated_at = timezone('utc', now())
    where id = NEW.cohort_id;
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_increment_cohort_count_insert on public.course_enrollments;
create trigger trg_increment_cohort_count_insert
  after insert on public.course_enrollments
  for each row
  execute function public.increment_cohort_enrollment_count_on_insert();

-- =====================================================================================
-- ENROLLMENT COUNT TRIGGER 2: UPDATE - Handle Cohort Changes
-- =====================================================================================
-- Updates enrollment counts when an enrollment is reassigned between cohorts
-- Decrements old cohort, increments new cohort
-- =====================================================================================
create or replace function public.update_cohort_enrollment_count_on_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Only process if cohort_id actually changed
  if OLD.cohort_id is distinct from NEW.cohort_id then
    -- Decrement old cohort count (if there was one)
    if OLD.cohort_id is not null then
      update public.cohorts
      set
        current_enrollment_count = current_enrollment_count - 1,
        updated_at = timezone('utc', now())
      where id = OLD.cohort_id;
    end if;

    -- Increment new cohort count (if there is one)
    if NEW.cohort_id is not null then
      update public.cohorts
      set
        current_enrollment_count = current_enrollment_count + 1,
        updated_at = timezone('utc', now())
      where id = NEW.cohort_id;
    end if;
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_update_cohort_count_update on public.course_enrollments;
create trigger trg_update_cohort_count_update
  after update of cohort_id on public.course_enrollments
  for each row
  when (OLD.cohort_id is distinct from NEW.cohort_id)
  execute function public.update_cohort_enrollment_count_on_update();

-- =====================================================================================
-- ENROLLMENT COUNT TRIGGER 3: DELETE - Decrement Cohort Count
-- =====================================================================================
-- Decrements cohort.current_enrollment_count when an enrollment is deleted
-- =====================================================================================
create or replace function public.decrement_cohort_enrollment_count_on_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Only update if cohort_id was not null
  if OLD.cohort_id is not null then
    update public.cohorts
    set
      current_enrollment_count = current_enrollment_count - 1,
      updated_at = timezone('utc', now())
    where id = OLD.cohort_id;
  end if;

  return OLD;
end;
$$;

drop trigger if exists trg_decrement_cohort_count_delete on public.course_enrollments;
create trigger trg_decrement_cohort_count_delete
  after delete on public.course_enrollments
  for each row
  execute function public.decrement_cohort_enrollment_count_on_delete();

-- =====================================================================================
-- HISTORY LOGGING TRIGGER: Log Cohort Membership Changes
-- =====================================================================================
-- Records cohort reassignments in cohort_membership_history table
-- Captures changed_by from auth.uid()
-- =====================================================================================
create or replace function public.log_cohort_membership_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_changed_by uuid;
begin
  -- Only log if cohort_id actually changed
  if OLD.cohort_id is distinct from NEW.cohort_id then
    -- Get current user ID (may be null for system operations)
    begin
      v_changed_by := auth.uid();
    exception when others then
      v_changed_by := null;
    end;

    -- Insert history record
    insert into public.cohort_membership_history (
      enrollment_id,
      old_cohort_id,
      new_cohort_id,
      changed_by,
      changed_at
    ) values (
      NEW.id,
      OLD.cohort_id,
      NEW.cohort_id,
      v_changed_by,
      timezone('utc', now())
    );
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_log_cohort_membership_change on public.course_enrollments;
create trigger trg_log_cohort_membership_change
  after update of cohort_id on public.course_enrollments
  for each row
  when (OLD.cohort_id is distinct from NEW.cohort_id)
  execute function public.log_cohort_membership_change();

-- =====================================================================================
-- AUDIT TRIGGER: Update updated_at Timestamp
-- =====================================================================================
-- Automatically updates the updated_at field on cohorts table modifications
-- Uses existing update_updated_at_column() function
-- =====================================================================================
drop trigger if exists trg_cohorts_update_updated_at on public.cohorts;
create trigger trg_cohorts_update_updated_at
  before update on public.cohorts
  for each row
  execute function public.update_updated_at_column();
