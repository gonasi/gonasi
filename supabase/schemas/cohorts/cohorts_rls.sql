-- =====================================================================================
-- RLS Policies for Cohorts and Cohort Membership History
-- =====================================================================================
-- This file defines row-level security policies for cohorts functionality.
-- All policies use can_user_edit_course() helper to check permissions.
-- Note: published_courses.id references courses.id, so we can use the published_course_id
-- directly with can_user_edit_course().
-- =====================================================================================

-- =====================================================================================
-- Enable RLS on cohorts table
-- =====================================================================================
alter table public.cohorts enable row level security;

-- =====================================================================================
-- SELECT Policy: Course editors can view cohorts
-- =====================================================================================
-- Users who can edit the course can view its cohorts
-- =====================================================================================
create policy "select: course editors can view cohorts"
on public.cohorts
for select
to authenticated
using (
  public.can_user_edit_course(cohorts.published_course_id)
);

-- =====================================================================================
-- INSERT Policy: Course editors can create cohorts
-- =====================================================================================
-- Users who can edit the course can create cohorts for it
-- =====================================================================================
create policy "insert: course editors can create cohorts"
on public.cohorts
for insert
to authenticated
with check (
  public.can_user_edit_course(cohorts.published_course_id)
);

-- =====================================================================================
-- UPDATE Policy: Course editors can update cohorts
-- =====================================================================================
-- Users who can edit the course can update its cohorts
-- =====================================================================================
create policy "update: course editors can update cohorts"
on public.cohorts
for update
to authenticated
using (
  public.can_user_edit_course(cohorts.published_course_id)
)
with check (
  public.can_user_edit_course(cohorts.published_course_id)
);

-- =====================================================================================
-- DELETE Policy: Course editors can delete cohorts
-- =====================================================================================
-- Users who can edit the course can delete its cohorts
-- =====================================================================================
create policy "delete: course editors can delete cohorts"
on public.cohorts
for delete
to authenticated
using (
  public.can_user_edit_course(cohorts.published_course_id)
);

-- =====================================================================================
-- Enable RLS on cohort_membership_history table
-- =====================================================================================
alter table public.cohort_membership_history enable row level security;

-- =====================================================================================
-- SELECT Policy: Course editors can view cohort history
-- =====================================================================================
-- Users who can edit the course can view cohort membership history
-- Requires joining through enrollment to get the published_course_id
-- =====================================================================================
create policy "select: course editors can view cohort history"
on public.cohort_membership_history
for select
to authenticated
using (
  exists (
    select 1
    from public.course_enrollments ce
    where ce.id = cohort_membership_history.enrollment_id
      and public.can_user_edit_course(ce.published_course_id)
  )
);

-- =====================================================================================
-- NOTE: No INSERT/UPDATE/DELETE policies for cohort_membership_history
-- =====================================================================================
-- The cohort_membership_history table is managed entirely by triggers.
-- It serves as a read-only audit trail for users with appropriate permissions.
-- All modifications are performed by the log_cohort_membership_change() trigger.
-- =====================================================================================
