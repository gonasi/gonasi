-- ============================================================================
-- Enable Row-Level Security on courses table
-- ============================================================================
alter table public.courses enable row level security;

-- ============================================================================
-- SELECT: Allow all org members to read courses
-- ============================================================================
create policy "Select: Org members can view courses"
on public.courses
for select
to authenticated
using (
  public.get_user_org_role(organization_id, (select auth.uid())) is not null
);

-- ============================================================================
-- INSERT: Allow all org members (owner, admin, editor) to create courses
-- ============================================================================
create policy "Insert: Org members can create courses"
on public.courses
for insert
with check (
  public.get_user_org_role(organization_id, (select auth.uid())) in ('owner', 'admin', 'editor')
);

-- ============================================================================
-- UPDATE: Allow only:
--   - org owner/admins, OR
--   - editors who personally own the course
-- ============================================================================
create policy "Update: Admins or owning editors can update courses"
on public.courses
for update
using (
  public.get_user_org_role(organization_id, (select auth.uid())) in ('owner', 'admin')
  or (
    public.get_user_org_role(organization_id, (select auth.uid())) = 'editor'
    and owned_by = (select auth.uid())
  )
);

-- ============================================================================
-- DELETE: Same as UPDATE
-- ============================================================================
create policy "Delete: Admins or owning editors can delete courses"
on public.courses
for delete
using (
  public.get_user_org_role(organization_id, (select auth.uid())) in ('owner', 'admin')
  or (
    public.get_user_org_role(organization_id, (select auth.uid())) = 'editor'
    and owned_by = (select auth.uid())
  )
);


-- ============================================================================
-- STORAGE BUCKET: THUMBNAILS (Updated to use path-based approach)
-- ============================================================================

-- ============================================================================
-- SELECT: Allow any member of the organization that owns the course
-- ============================================================================
create policy "Read: Org members can view course thumbnails"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'thumbnails'
  and exists (
    select 1
    from public.courses c
    where c.id = (split_part(storage.objects.name, '/', 1))::uuid
      and public.get_user_org_role(c.organization_id, (select auth.uid())) is not null
  )
);

-- ============================================================================
-- INSERT: Allow any org member (owner, admin, editor) to upload thumbnails
-- ============================================================================
create policy "Insert: Org members can upload thumbnails"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'thumbnails'
  and exists (
    select 1
    from public.courses c
    where c.id = (split_part(storage.objects.name, '/', 1))::uuid
      and public.get_user_org_role(c.organization_id, (select auth.uid())) in ('owner', 'admin', 'editor')
  )
);

-- ============================================================================
-- UPDATE: Allow only:
--   - org owner/admins, OR
--   - editors who personally own the course
-- ============================================================================
create policy "Update: Admins or owning editors can update thumbnails"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'thumbnails'
  and exists (
    select 1
    from public.courses c
    where c.id = (split_part(storage.objects.name, '/', 1))::uuid
      and (
        public.get_user_org_role(c.organization_id, (select auth.uid())) in ('owner', 'admin')
        or (
          public.get_user_org_role(c.organization_id, (select auth.uid())) = 'editor'
          and c.owned_by = (select auth.uid())
        )
      )
  )
)
with check (
  bucket_id = 'thumbnails'
  and exists (
    select 1
    from public.courses c
    where c.id = (split_part(storage.objects.name, '/', 1))::uuid
      and (
        public.get_user_org_role(c.organization_id, (select auth.uid())) in ('owner', 'admin')
        or (
          public.get_user_org_role(c.organization_id, (select auth.uid())) = 'editor'
          and c.owned_by = (select auth.uid())
        )
      )
  )
);

-- ============================================================================
-- DELETE: Same as UPDATE — admins or owning editors
-- ============================================================================
create policy "Delete: Admins or owning editors can delete thumbnails"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'thumbnails'
  and exists (
    select 1
    from public.courses c
    where c.id = (split_part(storage.objects.name, '/', 1))::uuid
      and (
        public.get_user_org_role(c.organization_id, (select auth.uid())) in ('owner', 'admin')
        or (
          public.get_user_org_role(c.organization_id, (select auth.uid())) = 'editor'
          and c.owned_by = (select auth.uid())
        )
      )
  )
);