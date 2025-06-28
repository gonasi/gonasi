-- ============================
-- 📦 Storage: Avatar policies
-- Bucket: profile_photos
-- ============================

-- ==================================================
-- ✅ INSERT: Allow users to upload to their own folder
--     - Files must be uploaded to profile_photos/{user_id}/
-- ==================================================
create policy "Allow authenticated uploads to own avatar folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile_photos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

-- ==================================================
-- 🔍 SELECT: Allow public or self access to profile_photos
--     - Users can view their own avatar
--     - Anyone can view profile_photos for public profiles
-- ==================================================
create policy "Allow public access to public profile profile_photos"
on storage.objects
for select
to authenticated, anon
using (
  bucket_id = 'profile_photos'
  and (
    owner = (select auth.uid()) -- Own file
    or exists (
      select 1
      from public.profiles
      where profiles.id::text = (storage.foldername(name))[1]
      and is_public = true
    )
  )
);

-- ==================================================
-- ✏️ UPDATE: Allow users to update their own avatar
-- ==================================================
create policy "Allow user to update own avatar"
on storage.objects
for update
to authenticated
using (
  owner = (select auth.uid())
)
with check (
  bucket_id = 'profile_photos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

-- ==================================================
-- 🗑️ DELETE: Allow users to delete their own avatar
-- ==================================================
create policy "Allow user to delete own avatar"
on storage.objects
for delete
to authenticated
using (
  owner = (select auth.uid())
  and bucket_id = 'profile_photos'
);
