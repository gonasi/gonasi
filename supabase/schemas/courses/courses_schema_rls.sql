-- ============================================================================
-- RLS: public.courses
-- ============================================================================

alter table public.courses enable row level security;

-- ============================================================================
-- SELECT: Any organization member can view courses
-- ============================================================================
create policy "Select: Org members can view courses"
on public.courses
for select
to authenticated
using (
  public.get_user_org_role(organization_id, (select auth.uid())) is not null
);

-- ============================================================================
-- INSERT: Org members (owner/admin/editor) can create courses
-- ============================================================================
create policy "Insert: Org members can create courses"
on public.courses
for insert
to authenticated
with check (
  public.get_user_org_role(organization_id, (select auth.uid())) in ('owner', 'admin', 'editor')
);

-- ============================================================================
-- UPDATE: Admins OR designated course editors
-- ============================================================================
create policy "Update: Admins or course editors can update courses"
on public.courses
for update
using (
  public.can_user_edit_course(id)
)
with check (
  public.can_user_edit_course(id)
);

-- ============================================================================
-- DELETE: Only admins/owners may delete courses
--    → Editors CANNOT delete courses.
-- ============================================================================
create policy "Delete: Admins can delete courses"
on public.courses
for delete
to authenticated
using (
  public.get_user_org_role(organization_id, (select auth.uid())) in ('owner', 'admin')
);

-- ============================================================================
-- RLS: storage.objects (thumbnails bucket)
-- ============================================================================
-- Thumbnail path format: "<course_id>/<filename>"
-- ============================================================================

-- ============================================================================
-- SELECT: Org members can view thumbnails
-- ============================================================================
create policy "Select: Org members can view thumbnails"
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
-- INSERT: Org members (owner/admin/editor) can upload thumbnails
-- ============================================================================
create policy "Insert: Org members can upload thumbnails"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'thumbnails'
  and public.can_user_edit_course((split_part(name, '/', 1))::uuid)
);

-- ============================================================================
-- UPDATE: Admins OR designated course editors
-- ============================================================================
create policy "Update: Admins or owning editors can update thumbnails"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'thumbnails'
  and public.can_user_edit_course((split_part(name, '/', 1))::uuid)
)
with check (
  bucket_id = 'thumbnails'
  and public.can_user_edit_course((split_part(name, '/', 1))::uuid)
);

-- ============================================================================
-- DELETE: Same permissions as UPDATE (admin or editor)
-- ============================================================================
create policy "Delete: Admins or owning editors can delete thumbnails"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'thumbnails'
  and public.can_user_edit_course((split_part(name, '/', 1))::uuid)
);