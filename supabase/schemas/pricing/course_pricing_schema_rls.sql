-- ============================================================================
-- RLS POLICIES FOR course_pricing_tiers
-- Mirrors logic used in the public.courses table for consistent access control
-- ============================================================================

-- Enable Row-Level Security on course_pricing_tiers
alter table public.course_pricing_tiers enable row level security;

-- ============================================================================
-- SELECT: Allow all organization members to view pricing tiers
-- (Only if they can access the parent course)
-- ============================================================================
create policy "select: org members can view pricing tiers"
on public.course_pricing_tiers
for select
to authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = course_pricing_tiers.course_id
      and public.get_user_org_role(c.organization_id, (select auth.uid())) is not null
  )
);

-- ============================================================================
-- INSERT: Allow only:
--   - org owners/admins
--   - or editors who personally own the course
-- ============================================================================
create policy "insert: admins or owning editors can add pricing tiers"
on public.course_pricing_tiers
for insert
to authenticated
with check (
  exists (
    select 1
    from public.courses c
    where c.id = course_pricing_tiers.course_id
      and (
        public.get_user_org_role(c.organization_id, (select auth.uid())) in ('owner', 'admin')
        or (
          public.get_user_org_role(c.organization_id, (select auth.uid())) = 'editor'
          and c.owned_by = auth.uid()
        )
      )
  )
);

-- ============================================================================
-- UPDATE: Allow only:
--   - org owners/admins, OR
--   - editors who personally own the course
-- ============================================================================
create policy "update: admins or owning editors can update pricing tiers"
on public.course_pricing_tiers
for update
to authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = course_pricing_tiers.course_id
      and (
        public.get_user_org_role(c.organization_id, (select auth.uid())) in ('owner', 'admin')
        or (
          public.get_user_org_role(c.organization_id, (select auth.uid())) = 'editor'
          and c.owned_by = auth.uid()
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.courses c
    where c.id = course_pricing_tiers.course_id
      and (
        public.get_user_org_role(c.organization_id, (select auth.uid())) in ('owner', 'admin')
        or (
          public.get_user_org_role(c.organization_id, (select auth.uid())) = 'editor'
          and c.owned_by = auth.uid()
        )
      )
  )
);

-- ============================================================================
-- DELETE: Same rules as UPDATE
-- ============================================================================
create policy "delete: admins or owning editors can delete pricing tiers"
on public.course_pricing_tiers
for delete
to authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = course_pricing_tiers.course_id
      and (
        public.get_user_org_role(c.organization_id, (select auth.uid())) in ('owner', 'admin')
        or (
          public.get_user_org_role(c.organization_id, (select auth.uid())) = 'editor'
          and c.owned_by = auth.uid()
        )
      )
  )
);
