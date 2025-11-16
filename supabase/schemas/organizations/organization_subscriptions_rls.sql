-- ==========================================================
-- ENABLE RLS ON: organization_subscriptions
-- ==========================================================
alter table public.organization_subscriptions enable row level security;

-- ==========================================================
-- POLICY: SELECT
-- ==========================================================
-- Purpose:
--   Allow:
--     - Owners
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
        or public.has_org_role(o.id, 'owner', (select auth.uid()))
      )
  )
);

-- Allow authenticated owner to update their organization's subscriptions
create policy "organization_subscriptions_update"
on public.organization_subscriptions
for update
to authenticated
using (
  exists (
    select 1
    from public.organizations o
    where o.id = organization_subscriptions.organization_id
      and (
        o.owned_by = (select auth.uid())
        or public.has_org_role(o.id, 'owner', (select auth.uid()))
      )
  )
)
with check (
  exists (
    select 1
    from public.organizations o
    where o.id = organization_subscriptions.organization_id
      and (
        o.owned_by = (select auth.uid())
        or public.has_org_role(o.id, 'owner', (select auth.uid()))
      )
  )
);
