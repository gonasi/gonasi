-- ==========================================================
-- ENABLE RLS ON: organization_subscriptions
-- ==========================================================
alter table public.organization_subscriptions enable row level security;

-- ==========================================================
-- POLICY: SELECT
-- ==========================================================
-- Purpose:
--   Allow:
--     - Owners and members of the organization to view its subscription
--     - Admin roles (via has_org_role) to view as well
--
-- Notes:
--   - Subscriptions are never publicly visible.
-- ==========================================================
create policy "organization_subscriptions_select"
on public.organization_subscriptions
for select
to authenticated
using (
  exists (
    select 1
    from public.organizations o
    where o.id = organization_subscriptions.organization_id
      and (
        o.owned_by = (select auth.uid())
        or public.has_org_role(o.id, 'admin', (select auth.uid()))
      )
  )
);