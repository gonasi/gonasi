-- ============================================================================
-- SELECT: Allow any member of the organization that owns the course
-- ============================================================================
create policy "Select: Org members can view published_thumbnails"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'published_thumbnails'
  and exists (
    select 1
    from public.courses c
    where c.id = (split_part(storage.objects.name, '/', 1))::uuid
      and public.get_user_org_role(c.organization_id, (select auth.uid())) is not null
  )
);

-- ============================================================================
-- INSERT: Allow any org member (owner, admin, editor) to upload published_thumbnails
-- ============================================================================
create policy "Insert: Org members can upload published_thumbnails"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'published_thumbnails'
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
create policy "Update: Admins or owning editors can update published_thumbnails"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'published_thumbnails'
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
  bucket_id = 'published_thumbnails'
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
create policy "Delete: Admins or owning editors can delete published_thumbnails"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'published_thumbnails'
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
