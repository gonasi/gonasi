-- ================================================================
-- 📦 STORAGE SECURITY POLICIES
-- Bucket: profile_photos
--
-- Folder Structure:
--   - profile_photos/{user_id}/avatar.jpg
-- ================================================================

-- ================================================================
-- ✅ insert_avatar: Allow only user to upload to their own folder
-- ================================================================
create policy "insert_avatar: only user can upload"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile_photos'
  and split_part(name, '/', 1) = auth.uid()::text
);

-- ================================================================
-- 🔍 select_avatar: Allow public access if profile is public,
--                  otherwise only the user themselves
-- ================================================================
create policy "select_avatar: public if profile is public"
on storage.objects
for select
to authenticated, anon
using (
  bucket_id = 'profile_photos'
  and (
    split_part(name, '/', 1) = auth.uid()::text
    or exists (
      select 1
      from public.profiles p
      where p.id::text = split_part(storage.objects.name, '/', 1)
    )
  )
);

-- ================================================================
-- ✏️ update_avatar: Allow only user to update their own avatar
-- ================================================================
create policy "update_avatar: only user can update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile_photos'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'profile_photos'
  and split_part(name, '/', 1) = auth.uid()::text
);

-- ================================================================
-- 🗑️ delete_avatar: Allow only user to delete their own avatar
-- ================================================================
create policy "delete_avatar: only user can delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile_photos'
  and split_part(name, '/', 1) = auth.uid()::text
);
