-- ====================================================================================
-- RLS POLICIES: STORAGE OBJECTS (Bucket: published_thumbnails)
-- ====================================================================================

-- Allow anyone (including unauthenticated users) to read from the published_thumbnails bucket
create policy "Select: allow public read from published_thumbnails"
on storage.objects 
for select
using (
  bucket_id = 'published_thumbnails'
);

-- Allow only course admins, editors, or the owner to upload to the published_thumbnails bucket
create policy "Insert: allow course admin/editor/owner to upload to published_thumbnails"
on storage.objects
for insert
with check (
  bucket_id = 'published_thumbnails'
  and (
    is_course_admin((metadata ->> 'id')::uuid, (select auth.uid()))
    or is_course_editor((metadata ->> 'id')::uuid, (select auth.uid()))
    or (owner = (select auth.uid()))
  )
);

-- Allow course admins, editors, or the owner to update objects in the published_thumbnails bucket
create policy "Update: allow course admin/editor/owner to update published_thumbnails"
on storage.objects
for update
using (
  bucket_id = 'published_thumbnails' AND (
    is_course_admin((metadata ->> 'id')::uuid, (select auth.uid()))
    or is_course_editor((metadata ->> 'id')::uuid, (select auth.uid()))
    or (owner = (select auth.uid()))
  )
)
with check (
  bucket_id = 'published_thumbnails'
);

-- Allow only the owner to delete objects from the published_thumbnails bucket
create policy "Delete: allow owner to delete from published_thumbnails"
on storage.objects
for delete
using (
  bucket_id = 'published_thumbnails' AND (
    owner = (select auth.uid())
  )
);
