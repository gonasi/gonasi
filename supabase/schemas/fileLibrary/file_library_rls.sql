-- =======================================
-- FILE_LIBRARY TABLE POLICIES
-- =======================================
alter table public.file_library enable row level security;

create policy "select: org members can view file_library"
on public.file_library
for select
to authenticated
using (
  public.get_user_org_role(file_library.organization_id, (select auth.uid())) is not null
);

create policy "insert: org owner/admin or course creator"
on public.file_library
for insert
to authenticated
with check (
  exists (
    select 1
    from public.courses c
    where c.id = file_library.course_id
      and (
        public.get_user_org_role(c.organization_id, (select auth.uid())) in ('owner', 'admin')
        or (
          public.get_user_org_role(c.organization_id, (select auth.uid())) = 'editor'
          and c.created_by = (select auth.uid())
        )
      )
  )
);

create policy "update: org owner/admin or course creator"
on public.file_library
for update
to authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = file_library.course_id
      and (
        public.get_user_org_role(c.organization_id, (select auth.uid())) in ('owner', 'admin')
        or (
          public.get_user_org_role(c.organization_id, (select auth.uid())) = 'editor'
          and c.created_by = (select auth.uid())
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.courses c
    where c.id = file_library.course_id
      and (
        public.get_user_org_role(c.organization_id, (select auth.uid())) in ('owner', 'admin')
        or (
          public.get_user_org_role(c.organization_id, (select auth.uid())) = 'editor'
          and c.created_by = (select auth.uid())
        )
      )
  )
);

create policy "delete: org owner/admin or course creator"
on public.file_library
for delete
to authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = file_library.course_id
      and (
        public.get_user_org_role(c.organization_id, (select auth.uid())) in ('owner', 'admin')
        or (
          public.get_user_org_role(c.organization_id, (select auth.uid())) = 'editor'
          and c.created_by = (select auth.uid())
        )
      )
  )
);



-- SELECT: Check if user has access to the file via file_library using path
create policy "select: org members can view files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'files'
  and exists (
    select 1 from public.file_library fl
    where fl.path = storage.objects.name
      and public.get_user_org_role(fl.organization_id, (select auth.uid())) is not null
  )
);

-- INSERT: Parse the path to extract organizationId and courseId, then check permissions
create policy "insert: org owner/admin or course creator with storage limit"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'files'
  and exists (
    select 1 from public.courses c
    where c.id = (split_part(storage.objects.name, '/', 2))::uuid
      and c.organization_id = (split_part(storage.objects.name, '/', 1))::uuid
      and (
        public.get_user_org_role(c.organization_id, (select auth.uid())) in ('owner', 'admin')
        or (
          public.get_user_org_role(c.organization_id, (select auth.uid())) = 'editor'
          and c.created_by = (select auth.uid())
        )
      )
      -- Check storage limit using the helper function
      and public.check_storage_limit(
        c.organization_id,
        coalesce((storage.objects.metadata->>'size')::bigint, 0)
      ) = true
  )
);

-- UPDATE: Same logic as SELECT - use path to match file_library
create policy "update: org owner/admin or course creator"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'files'
  and exists (
    select 1 from public.file_library fl
    join public.courses c on c.id = fl.course_id
    where fl.path = storage.objects.name
      and (
        public.get_user_org_role(c.organization_id, (select auth.uid())) in ('owner', 'admin')
        or (
          public.get_user_org_role(c.organization_id, (select auth.uid())) = 'editor'
          and c.created_by = (select auth.uid())
        )
      )
  )
)
with check (
  bucket_id = 'files'
  and exists (
    select 1 from public.file_library fl
    join public.courses c on c.id = fl.course_id
    where fl.path = storage.objects.name
      and (
        public.get_user_org_role(c.organization_id, (select auth.uid())) in ('owner', 'admin')
        or (
          public.get_user_org_role(c.organization_id, (select auth.uid())) = 'editor'
          and c.created_by = (select auth.uid())
        )
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
    join public.courses c on c.id = fl.course_id
    where fl.path = storage.objects.name
      and (
        public.get_user_org_role(c.organization_id, (select auth.uid())) in ('owner', 'admin')
        or (
          public.get_user_org_role(c.organization_id, (select auth.uid())) = 'editor'
          and c.created_by = (select auth.uid())
        )
      )
  )
);