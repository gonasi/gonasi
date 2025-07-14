-- ================================================================
-- 📦 STORAGE SECURITY POLICIES 
-- Buckets:
--   - organization_profile_photos
--   - organization_banner_photos
-- Folder Structure:
--   - organization_profile_photos/{organization_id}/profile.jpg
--   - organization_banner_photos/{organization_id}/banner.jpg
-- ================================================================

-- ================================================================
-- 🛡️ Policies for organization_profile_photos
-- ================================================================
-- ✅ INSERT
-- 📤 INSERT
create policy "insert_profile: only org owner/admin can upload"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'organization_profile_photos'
  and public.get_user_org_role((storage.foldername(name))[1]::uuid, (select auth.uid())) in ('owner', 'admin')
);

-- 🔍 SELECT
create policy "select_profile: public if org is public"
on storage.objects
for select
to authenticated, anon
using (
  bucket_id = 'organization_profile_photos'
  and exists (
    select 1
    from public.organizations o
    where o.id::text = (storage.foldername(name))[1]
      and o.is_public = true
  )
);

-- ✏️ UPDATE
create policy "update_profile: only org owner/admin"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'organization_profile_photos'
  and public.get_user_org_role((storage.foldername(name))[1]::uuid, (select auth.uid())) in ('owner', 'admin')
)
with check (
  bucket_id = 'organization_profile_photos'
  and public.get_user_org_role((storage.foldername(name))[1]::uuid, (select auth.uid())) in ('owner', 'admin')
);

-- 🗑️ DELETE
create policy "delete_profile: only org owner/admin"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'organization_profile_photos'
  and public.get_user_org_role((storage.foldername(name))[1]::uuid, (select auth.uid())) in ('owner', 'admin')
);

-- ================================================================
-- 🛡️ Policies for organization_banner_photos
-- ================================================================

-- ✅ INSERT
create policy "insert_banner: only org owner/admin can upload"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'organization_banner_photos'
  and public.get_user_org_role((storage.foldername(name))[1]::uuid, (select auth.uid())) in ('owner', 'admin')
);

-- 🔍 SELECT
create policy "select_banner: public if org is public"
on storage.objects
for select
to authenticated, anon
using (
  bucket_id = 'organization_banner_photos'
  and exists (
    select 1
    from public.organizations o
    where o.id::text = (storage.foldername(name))[1]
      and o.is_public = true
  )
);

-- ✏️ UPDATE
create policy "update_banner: only org owner/admin"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'organization_banner_photos'
  and public.get_user_org_role((storage.foldername(name))[1]::uuid, (select auth.uid())) in ('owner', 'admin')
)
with check (
  bucket_id = 'organization_banner_photos'
  and public.get_user_org_role((storage.foldername(name))[1]::uuid, (select auth.uid())) in ('owner', 'admin')
);

-- 🗑️ DELETE
create policy "delete_banner: only org owner/admin"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'organization_banner_photos'
  and public.get_user_org_role((storage.foldername(name))[1]::uuid, (select auth.uid())) in ('owner', 'admin')
);
