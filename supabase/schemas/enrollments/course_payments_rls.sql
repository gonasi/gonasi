-- ====================================================================================
-- row-level security (rls) setup for course_payments
-- ====================================================================================
-- description:
--   - select: only organization owners and admins can view course payment records
--   - insert & update: handled by trusted backend roles (e.g., service_role); no rls needed
--   - delete: disallowed by omission of a delete policy
-- ====================================================================================

-- enable row-level security
alter table public.course_payments enable row level security;

-- ====================================================================================
-- select policy: allow only organization owners and admins to view course payments
-- ====================================================================================
create policy "select: only owners and admins can view course payments"
on public.course_payments
for select
to authenticated
using (
  public.get_user_org_role(organization_id, (select auth.uid())) in ('owner', 'admin')
);

-- ====================================================================================
-- insert & update:
--   - no policy defined
--   - assumes operations are restricted to trusted roles (e.g., service_role)
-- ====================================================================================

-- ====================================================================================
-- delete:
--   - no delete policy defined
--   - this prevents deletion of course_payments by any regular user
--   - delete access reserved for elevated roles (if explicitly granted)
-- ====================================================================================
