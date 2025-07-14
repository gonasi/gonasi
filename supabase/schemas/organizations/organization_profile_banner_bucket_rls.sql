-- ================================================================
-- 📦 STORAGE SECURITY POLICIES
-- Bucket:
--   - organization_banner_photos
--
-- Folder Structure:
--   - organization_banner_photos/{organization_id}/banner.jpg
-- ================================================================


-- ================================================================
-- 🛡️ Policies for organization_banner_photos
-- ================================================================

-- ✅ INSERT: Allow only organization owners/admins to upload banner photos
create policy "insert_banner: only org owner/admin can upload"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'organization_banner_photos'
  and (
    case
      when position('/' in name) > 0 then
        public.get_user_org_role(
          (split_part(name, '/', 1))::uuid,
          auth.uid()
        ) in ('owner', 'admin')
      else false
    end
  )
);

-- 🔍 SELECT: Allow anyone to read banner photos if the organization is public
create policy "select_banner: public if org is public"
on storage.objects
for select
to authenticated, anon
using (
  bucket_id = 'organization_banner_photos'
  and (
    case
      when position('/' in name) > 0 then
        exists (
          select 1
          from public.organizations o
          where o.id::text = split_part(name, '/', 1)
            and o.is_public = true
        )
      else false
    end
  )
);

-- ✏️ UPDATE: Allow only organization owners/admins to update banner photos
create policy "update_banner: only org owner/admin"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'organization_banner_photos'
  and (
    case
      when position('/' in name) > 0 then
        public.get_user_org_role(
          (split_part(name, '/', 1))::uuid,
          auth.uid()
        ) in ('owner', 'admin')
      else false
    end
  )
)
with check (
  bucket_id = 'organization_banner_photos'
  and (
    case
      when position('/' in name) > 0 then
        public.get_user_org_role(
          (split_part(name, '/', 1))::uuid,
          auth.uid()
        ) in ('owner', 'admin')
      else false
    end
  )
);

-- 🗑️ DELETE: Allow only organization owners/admins to delete banner photos
create policy "delete_banner: only org owner/admin"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'organization_banner_photos'
  and (
    case
      when position('/' in name) > 0 then
        public.get_user_org_role(
          (split_part(name, '/', 1))::uuid,
          auth.uid()
        ) in ('owner', 'admin')
      else false
    end
  )
);
