-- ============================================================================
-- SELECT POLICY
-- Allow viewing of images in the 'published_thumbnails' bucket by:
--   - Any member of the organization that owns the course,
--   - Any user enrolled in the course (even if it's private),
--   - Anyone if the course is published and publicly visible.
-- ============================================================================

create policy "Select: Org members, enrolled users, or public can view published_thumbnails"
on storage.objects
for select
to public
using (
  bucket_id = 'published_thumbnails'
  and (
    -- 1. Org members can view
    exists (
      select 1
      from public.courses c
      where c.id = (split_part(storage.objects.name, '/', 1))::uuid
        and public.get_user_org_role(c.organization_id, auth.uid()) is not null
    )

    -- 2. Public users can view public, published courses
    or exists (
      select 1
      from public.published_courses pc
      where pc.id = (split_part(storage.objects.name, '/', 1))::uuid
        and pc.is_active
        and pc.visibility = 'public'
    )

    -- 3. Enrolled users can view the course (regardless of visibility)
    or exists (
      select 1
      from public.course_enrollments ce
      join public.published_courses pc on pc.id = ce.published_course_id
      where pc.id = (split_part(storage.objects.name, '/', 1))::uuid
        and pc.is_active
        and ce.user_id = auth.uid()
        and ce.is_active = true
        and (ce.expires_at is null or ce.expires_at > now())
    )
  )
);

-- ============================================================================
-- INSERT POLICY
-- Allow uploading to 'published_thumbnails' only by:
--   - Organization members with the role 'owner', 'admin', or 'editor'
-- ============================================================================

create policy "Insert: Org members can upload published_thumbnails"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'published_thumbnails'
  and exists (
    select 1
    from public.courses c
    where c.id = (split_part(storage.objects.name, '/', 1))::uuid
      and public.get_user_org_role(c.organization_id, auth.uid()) in ('owner', 'admin', 'editor')
  )
);

-- ============================================================================
-- UPDATE POLICY
-- Allow updating 'published_thumbnails' only by:
--   - Organization owners or admins,
--   - Editors who also personally own the course
-- ============================================================================

create policy "Update: Admins or owning editors can update published_thumbnails"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'published_thumbnails'
  and exists (
    select 1
    from public.courses c
    where c.id = (split_part(storage.objects.name, '/', 1))::uuid
      and (
        public.get_user_org_role(c.organization_id, auth.uid()) in ('owner', 'admin')
        or exists (select 1 from public.course_editors where course_id = c.id and user_id = auth.uid())
      )
  )
)
with check (
  bucket_id = 'published_thumbnails'
  and exists (
    select 1
    from public.courses c
    where c.id = (split_part(storage.objects.name, '/', 1))::uuid
      and (
        public.get_user_org_role(c.organization_id, auth.uid()) in ('owner', 'admin')
        or exists (select 1 from public.course_editors where course_id = c.id and user_id = auth.uid())
      )
  )
);

-- ============================================================================
-- DELETE POLICY
-- Same access as UPDATE:
--   - Organization owners or admins,
--   - Editors who also personally own the course
-- ============================================================================

create policy "Delete: Admins or owning editors can delete published_thumbnails"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'published_thumbnails'
  and exists (
    select 1
    from public.courses c
    where c.id = (split_part(storage.objects.name, '/', 1))::uuid
      and (
        public.get_user_org_role(c.organization_id, auth.uid()) in ('owner', 'admin')
        or exists (select 1 from public.course_editors where course_id = c.id and user_id = auth.uid())
      )
  )
);
