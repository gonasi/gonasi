-- ============================================================================
-- Enable Row-Level Security on chapters table
-- ============================================================================
alter table public.chapters enable row level security;

-- ============================================================================
-- SELECT: Allow org members with access to course to view chapters
-- ============================================================================
create policy "select: org members can view chapters"
on public.chapters
for select
to authenticated
using (
  exists (
    select 1 from public.courses c
    where c.id = chapters.course_id
      and public.get_user_org_role(c.organization_id, (select auth.uid())) is not null
  )
);

-- ============================================================================
-- INSERT: Allow owner, admin, or editor in org to add chapters
-- ============================================================================
create policy "insert: org members (owner, admin, editor) can add chapters"
on public.chapters
for insert
to authenticated
with check (
  exists (
    select 1 from public.courses c
    where c.id = chapters.course_id
      and public.get_user_org_role(c.organization_id, (select auth.uid())) in ('owner', 'admin', 'editor')
  )
);

-- ============================================================================
-- UPDATE: Allow owner/admin, or owning editor of the course to update chapters
-- ============================================================================
create policy "update: admins or owning editors can update chapters"
on public.chapters
for update
to authenticated
using (
  exists (
    select 1 from public.courses c
    where c.id = chapters.course_id
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
    select 1 from public.courses c
    where c.id = chapters.course_id
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
-- DELETE: Same as UPDATE — allow admins or owning editors to delete chapters
-- ============================================================================
create policy "delete: admins or owning editors can delete chapters"
on public.chapters
for delete
to authenticated
using (
  exists (
    select 1 from public.courses c
    where c.id = chapters.course_id
      and (
        public.get_user_org_role(c.organization_id, (select auth.uid())) in ('owner', 'admin')
        or (
          public.get_user_org_role(c.organization_id, (select auth.uid())) = 'editor'
          and c.owned_by = auth.uid()
        )
      )
  )
);
