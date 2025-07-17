-- ====================================================================================
-- rls (row-level security) setup for table: public.course_enrollment_activities
-- ====================================================================================
-- description:
--   - select: allowed for organization owners, admins, editors who own the course, 
--             or the user who owns the enrollment
--   - insert: allowed only if the row is created by the enrolled user (enforced with check)
--   - update & delete: no policies defined (denied by default)
-- ====================================================================================

-- enable rls on the table
alter table public.course_enrollment_activities enable row level security;

-- ====================================================================================
-- select policy: allow org owners/admins, owning editors, or the enrolled user
-- ====================================================================================
create policy "select: allowed org roles or enrollment owner"
on public.course_enrollment_activities
for select
to authenticated
using (
  exists (
    select 1
    from public.course_enrollments ce
    join public.courses pc on pc.id = ce.published_course_id
    where ce.id = course_enrollment_activities.enrollment_id
      and (
        -- org owners/admins can access all
        public.get_user_org_role(pc.organization_id, (select auth.uid())) in ('owner', 'admin')

        -- editors can access if they own the course
        or (
          public.get_user_org_role(pc.organization_id, (select auth.uid())) = 'editor'
          and pc.owned_by = (select auth.uid())
        )

        -- enrolled user can view their own activity
        or ce.user_id = (select auth.uid())
      )
  )
);

