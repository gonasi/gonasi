-- ====================================================================================
-- ROW LEVEL SECURITY
-- ====================================================================================

alter table public.courses enable row level security;

-- ====================================================================================
-- RLS POLICIES: COURSES
-- ====================================================================================

-- Allow user to select (read) their own course or if they are admin/editor/viewer
create policy "Select: user can read their own course or if admin/editor/viewer"
on public.courses
for select
to authenticated
using (
  is_course_admin(id, (select auth.uid()))
  or is_course_editor(id, (select auth.uid()))
  or is_course_viewer(id, (select auth.uid()))
  or created_by = (select auth.uid())
);

-- Allow user to insert a course with their own ID
create policy "Insert: user can create a course under their ID"
on public.courses
for insert
to authenticated
with check ((select auth.uid()) = created_by);

-- Allow user to update their own course or if admin/editor
create policy "Update: admin/editor or owner can modify their own course"
on public.courses
for update
to authenticated
using (
  is_course_admin(id, (select auth.uid()))
  or is_course_editor(id, (select auth.uid()))
  or (created_by = (select auth.uid()))
)
with check (
  is_course_admin(id, (select auth.uid())) 
  or is_course_editor(id, (select auth.uid()))
  or (created_by = (select auth.uid()))
);

-- Allow user to delete their own course or if admin (assuming no members assigned)
create policy "Delete: owner can remove their own course"
on public.courses
for delete
to authenticated
using (
  (created_by = (select auth.uid()))
);

-- ====================================================================================
-- STORAGE BUCKET: COURSES
-- ====================================================================================

insert into storage.buckets (id, name, public)
values ('courses', 'courses', true)
on conflict (id) do nothing;

-- ====================================================================================
-- RLS POLICIES: STORAGE OBJECTS (Bucket: courses)
-- ====================================================================================

-- Allow public to read course thumbnails (public bucket)
create policy "Select: allow public read access to course thumbnails"
on storage.objects 
for select
using (
  bucket_id = 'courses'
);

-- Allow only admin/editor to upload objects to the courses bucket
create policy "Insert: allow only admin/editor to upload to courses bucket"
on storage.objects
for insert
with check (
  bucket_id = 'courses'
  and (
    is_course_admin((metadata ->> 'id')::uuid, (select auth.uid()))
    or is_course_editor((metadata ->> 'id')::uuid, (select auth.uid()))
    or (owner = (select auth.uid()))
  )
);

-- Allow admin/editor/owner to update course thumbnails
create policy "Update: admin/editor/owner can update course thumbnails"
on storage.objects
for update
using (
  bucket_id = 'courses' AND (
    is_course_admin((metadata ->> 'id')::uuid, (select auth.uid()))
    or is_course_editor((metadata ->> 'id')::uuid, (select auth.uid()))
    or (owner = (select auth.uid()))
  )
)
with check (
  bucket_id = 'courses'
);

-- Allow owner to delete course thumbnails
create policy "Delete: owner can delete course thumbnails"
on storage.objects
for delete
using (
  bucket_id = 'courses' AND (
    owner = (select auth.uid())
  )
);
