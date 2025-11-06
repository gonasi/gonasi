alter table public.courses enable row level security;

-- ============================================================================
-- SELECT: Any member of the organization can view courses
-- ============================================================================
create policy "courses_select_org_members"
on public.courses
for select
to authenticated
using (
  public.get_user_org_role(organization_id, (select auth.uid())) is not null
);

-- ============================================================================
-- INSERT: Any organization member (owner/admin/editor) may create a course
-- ============================================================================
create policy "courses_insert_org_members"
on public.courses
for insert
to authenticated
with check (
  public.get_user_org_role(organization_id, (select auth.uid())) is not null
);

-- ============================================================================
-- UPDATE: Allowed if:
--   1. User is org owner/admin  OR
--   2. User is in course_editors for this course
-- ============================================================================
create policy "courses_update_admins_or_editors"
on public.courses
for update
to authenticated
using (
  public.has_org_role(organization_id, 'admin', (select auth.uid()))
  OR exists (
    select 1 from public.course_editors ce
    where ce.course_id = courses.id
      and ce.user_id = (select auth.uid())
  )
);

-- ============================================================================
-- DELETE: Same permissions as UPDATE
-- ============================================================================
create policy "courses_delete_admins_or_editors"
on public.courses
for delete
to authenticated
using (
  public.has_org_role(organization_id, 'admin', (select auth.uid()))
  OR exists (
    select 1 from public.course_editors ce
    where ce.course_id = courses.id
      and ce.user_id = (select auth.uid())
  )
);


-- Ensure RLS is enabled on the bucket
alter table storage.objects enable row level security;

-- ============================================================================
-- Helper: Extract course_id from path
-- ============================================================================
-- name = 'course_id/whatever-file'
-- split_part(name, '/', 1) → course_id
-- ============================================================================

-- ============================================================================
-- SELECT: Any org member may read thumbnails of courses in their org
-- ============================================================================
create policy "thumbnails_select_org_members"
on storage.objects
for select to authenticated
using (
  bucket_id = 'thumbnails'
  AND exists (
    select 1
    from public.courses c
    where c.id = (split_part(storage.objects.name, '/', 1))::uuid
      and public.get_user_org_role(c.organization_id, (select auth.uid())) is not null
  )
);

-- ============================================================================
-- INSERT: Any org member (owner/admin/editor) may upload thumbnails
-- ============================================================================
create policy "thumbnails_insert_org_members"
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'thumbnails'
  AND exists (
    select 1
    from public.courses c
    where c.id = (split_part(storage.objects.name, '/', 1))::uuid
      and public.get_user_org_role(c.organization_id, (select auth.uid())) is not null
  )
);

-- ============================================================================
-- UPDATE: Allowed if:
--   1. User is org owner/admin   OR
--   2. User is in course_editors for the course
-- ============================================================================
create policy "thumbnails_update_admins_or_editors"
on storage.objects
for update to authenticated
using (
  bucket_id = 'thumbnails'
  AND exists (
    select 1
    from public.courses c
    where c.id = (split_part(storage.objects.name, '/', 1))::uuid
      and (
        public.has_org_role(c.organization_id, 'admin', (select auth.uid()))
        OR exists (
          select 1 from public.course_editors ce
          where ce.course_id = c.id
            and ce.user_id = (select auth.uid())
        )
      )
  )
)
with check (
  bucket_id = 'thumbnails'
  AND exists (
    select 1
    from public.courses c
    where c.id = (split_part(storage.objects.name, '/', 1))::uuid
      and (
        public.has_org_role(c.organization_id, 'admin', (select auth.uid()))
        OR exists (
          select 1 from public.course_editors ce
          where ce.course_id = c.id
            and ce.user_id = (select auth.uid())
        )
      )
  )
);

-- ============================================================================
-- DELETE: Same as UPDATE
-- ============================================================================
create policy "thumbnails_delete_admins_or_editors"
on storage.objects
for delete to authenticated
using (
  bucket_id = 'thumbnails'
  AND exists (
    select 1
    from public.courses c
    where c.id = (split_part(storage.objects.name, '/', 1))::uuid
      and (
        public.has_org_role(c.organization_id, 'admin', (select auth.uid()))
        OR exists (
          select 1 from public.course_editors ce
          where ce.course_id = c.id
            and ce.user_id = (select auth.uid())
        )
      )
  )
);
