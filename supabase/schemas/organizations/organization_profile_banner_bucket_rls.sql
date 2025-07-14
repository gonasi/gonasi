-- ================================================================
-- 📦 STORAGE SECURITY POLICIES
-- Bucket: organization_banner_photos
--
-- Folder Structure:
--   - organization_banner_photos/{organization_id}/banner.jpg
-- ================================================================


-- ================================================================
-- 🔍 select_banner: Allow public access if the organization is public
-- ================================================================
create policy "select_banner: public if org is public"
on storage.objects
for select
to authenticated, anon
using (
  bucket_id = 'organization_banner_photos'
  and exists (
    select 1
    from public.organizations o
    where o.id = (split_part(storage.objects.name, '/', 1))::uuid
      and o.is_public = true
  )
);

-- ================================================================
-- ✅ insert_banner: Allow only organization owner/admin to upload
-- ================================================================
create policy "insert_banner: only org owner/admin can upload"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'organization_banner_photos'
  and exists (
    select 1
    from public.organizations o
    where o.id = (split_part(storage.objects.name, '/', 1))::uuid
      and public.get_user_org_role(o.id, (select auth.uid())) in ('owner', 'admin')
  )
);

-- ================================================================
-- ✏️ update_banner: Allow only organization owner/admin to update
-- ================================================================
create policy "update_banner: only org owner/admin"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'organization_banner_photos'
  and exists (
    select 1
    from public.organizations o
    where o.id = (split_part(storage.objects.name, '/', 1))::uuid
      and public.get_user_org_role(o.id, (select auth.uid())) in ('owner', 'admin')
  )
)
with check (
  bucket_id = 'organization_banner_photos'
  and exists (
    select 1
    from public.organizations o
    where o.id = (split_part(storage.objects.name, '/', 1))::uuid
      and public.get_user_org_role(o.id, (select auth.uid())) in ('owner', 'admin')
  )
);

-- ================================================================
-- 🗑️ delete_banner: Allow only organization owner/admin to delete
-- ================================================================
create policy "delete_banner: only org owner/admin"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'organization_banner_photos'
  and exists (
    select 1
    from public.organizations o
    where o.id = (split_part(storage.objects.name, '/', 1))::uuid
      and public.get_user_org_role(o.id, (select auth.uid())) in ('owner', 'admin')
  )
);
