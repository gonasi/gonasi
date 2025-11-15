-- =======================================
-- FILE_LIBRARY TABLE POLICIES
-- =======================================
alter table public.file_library enable row level security;

create policy "select: org members can view file_library"
on public.file_library
for select
to authenticated
using (
  public.can_user_edit_course(file_library.course_id)
);

create policy "insert: org owner/admin or course creator"
on public.file_library
for insert
to authenticated
with check ( 
  public.can_user_edit_course(file_library.course_id)
);

create policy "update: org owner/admin or course creator"
on public.file_library
for update
to authenticated
using (
  public.can_user_edit_course(file_library.course_id)
)
with check (
  public.can_user_edit_course(file_library.course_id)
);


create policy "delete: org owner/admin or course creator"
on public.file_library
for delete
to authenticated
using (
  public.can_user_edit_course(file_library.course_id)
);


-- =======================================
-- STORAGE.OBJECTS (FILES BUCKET) POLICIES
-- =======================================

-- SELECT: Check if user has access to the file via file_library
create policy "select: org members can view files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'files'
  and exists (
    select 1 from public.file_library fl
    where fl.path = storage.objects.name
      and public.can_user_edit_course(fl.course_id)
  )
);

-- INSERT: Org owner/admin or course creator with robust storage limit
create policy "insert: org owner/admin or course creator with robust storage limit"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'files'
  and exists (
    select 1 from public.courses c
    where c.id = (split_part(storage.objects.name, '/', 2))::uuid
      and c.organization_id = (split_part(storage.objects.name, '/', 1))::uuid
      and public.can_user_edit_course(c.id)
      and public.check_storage_limit_for_org(
        c.organization_id,
        coalesce((storage.objects.metadata->>'size')::bigint, 0)
      ) = true
  )
);


-- UPDATE: Org owner/admin or course creator with robust storage limit
create policy "update: org owner/admin or course creator with robust storage limit"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'files'
  and exists (
    select 1
    from public.file_library fl
    where fl.path = storage.objects.name
      and public.can_user_edit_course(fl.course_id)
  )
)
with check (
  bucket_id = 'files'
  and exists (
    select 1
    from public.file_library fl
    where fl.path = storage.objects.name
      and public.can_user_edit_course(fl.course_id)
      and public.check_storage_limit_for_org(
        fl.organization_id,
        coalesce((storage.objects.metadata->>'size')::bigint, 0),
        storage.objects.name  -- exclude current file from quota calculation
      )
  )
);


-- DELETE: Same as update
create policy "delete: org owner/admin or course creator"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'files'
  and exists (
    select 1 from public.file_library fl
    where fl.path = storage.objects.name
      and public.can_user_edit_course(fl.course_id)
  )
);