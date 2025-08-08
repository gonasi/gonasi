-- ============================================================================
-- SELECT POLICY: Allow users to view published course files if:
--   - The file is in the 'published_files' bucket, AND
--   - The user is actively enrolled in the associated published course, AND
--   - The enrollment is not expired.
-- ============================================================================

create policy "Select: Enrolled users or org members can view published files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'published_files'
  and (
    -- Option 1: Actively enrolled user
    exists (
      select 1
      from public.course_enrollments ce
      join public.published_courses pc on pc.id = ce.published_course_id
      join public.courses c on c.id = pc.id
      where c.id = (split_part(storage.objects.name, '/', 2))::uuid
        and c.organization_id = (split_part(storage.objects.name, '/', 1))::uuid
        and pc.is_active
        and ce.user_id = (select auth.uid())
        and ce.is_active = true
        and (ce.expires_at is null or ce.expires_at > now())
    )
    -- Option 2: Org member (any role)
    or (
      public.get_user_org_role((split_part(storage.objects.name, '/', 1))::uuid, (select auth.uid())) is not null
    )
  )
);



-- ============================================================================
-- INSERT POLICY: Allow uploading published files if:
--   - The user is an authenticated org member with role 'owner', 'admin', or 'editor'.
-- ============================================================================

create policy "Insert: Org members with elevated roles can upload published files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'published_files'
  and exists (
    select 1
    from public.courses c
    where c.id = (split_part(storage.objects.name, '/', 2))::uuid
      and c.organization_id = (split_part(storage.objects.name, '/', 1))::uuid
      and public.get_user_org_role(c.organization_id, auth.uid()) in ('owner', 'admin', 'editor')
  )
);

-- ============================================================================
-- UPDATE POLICY: Allow updates to published files if:
--   - The user is an org owner or admin, OR
--   - The user is an editor who owns the course.
-- ============================================================================

create policy "Update: Admins or owning editors can update published files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'published_files'
  and exists (
    select 1
    from public.courses c
    where c.id = (split_part(storage.objects.name, '/', 2))::uuid
      and c.organization_id = (split_part(storage.objects.name, '/', 1))::uuid
      and (
        public.get_user_org_role(c.organization_id, auth.uid()) in ('owner', 'admin')
        or (
          public.get_user_org_role(c.organization_id, auth.uid()) = 'editor'
          and c.owned_by = auth.uid()
        )
      )
  )
)
with check (
  bucket_id = 'published_files'
  and exists (
    select 1
    from public.courses c
    where c.id = (split_part(storage.objects.name, '/', 2))::uuid
      and c.organization_id = (split_part(storage.objects.name, '/', 1))::uuid
      and (
        public.get_user_org_role(c.organization_id, auth.uid()) in ('owner', 'admin')
        or (
          public.get_user_org_role(c.organization_id, auth.uid()) = 'editor'
          and c.owned_by = auth.uid()
        )
      )
  )
);

-- ============================================================================
-- DELETE POLICY: Allow deletion of published files if:
--   - The user is an org owner or admin, OR
--   - The user is an editor who owns the course.
-- ============================================================================

create policy "Delete: Admins or owning editors can delete published files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'published_files'
  and exists (
    select 1
    from public.courses c
    where c.id = (split_part(storage.objects.name, '/', 2))::uuid
      and c.organization_id = (split_part(storage.objects.name, '/', 1))::uuid
      and (
        public.get_user_org_role(c.organization_id, auth.uid()) in ('owner', 'admin')
        or (
          public.get_user_org_role(c.organization_id, auth.uid()) = 'editor'
          and c.owned_by = auth.uid()
        )
      )
  )
);
