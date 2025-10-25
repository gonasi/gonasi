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
        or exists (
          select 1
          from public.organization_members om
          where om.organization_id = o.id
            and om.user_id = (select auth.uid())
        )
      )
  )
);

-- ==========================================================
-- POLICY: INSERT
-- ==========================================================
-- Purpose:
--   Prevent users from manually creating subscriptions.
--   Normally, this happens automatically (via trigger) when
--   an organization is created, or via system-level upgrade flows.
--
-- Notes:
--   - Only backend service roles (e.g. via Supabase function) can insert.
--   - Regular authenticated users cannot insert directly.
-- ==========================================================
create policy "organization_subscriptions_insert"
on public.organization_subscriptions
for insert
to service_role  -- restrict to backend system context
with check (true);

-- ==========================================================
-- POLICY: UPDATE
-- ==========================================================
-- Purpose:
--   Allow:
--     - Owners or admins to view but NOT update subscriptions directly.
--     - Only backend system roles (service_role) can modify status, tier, or billing details.
--
-- Notes:
--   - Protects billing integrity from client tampering.
--   - You can later create specific function-based policies for upgrade/downgrade APIs.
-- ==========================================================
create policy "organization_subscriptions_update"
on public.organization_subscriptions
for update
to service_role
using (true)
with check (true);

-- ==========================================================
-- POLICY: DELETE
-- ==========================================================
-- Purpose:
--   Prevent deletion by end users.
--   Subscriptions are lifecycle-managed (e.g., canceled, expired)
--   instead of deleted for audit consistency.
--
-- Notes:
--   - Only backend service role may delete if ever needed.
-- ==========================================================
create policy "organization_subscriptions_delete"
on public.organization_subscriptions
for delete
to service_role
using (true);
