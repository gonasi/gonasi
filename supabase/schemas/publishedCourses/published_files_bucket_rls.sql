-- ============================================================================
-- SELECT POLICY
-- Allow viewing of files in the 'published_files' bucket by:
--   - Users who are actively enrolled in the course (regardless of visibility),
--   - Must be currently active and not expired.
-- ============================================================================

create policy "select_published_files_if_actively_enrolled"
on storage.objects
for select
to public
using (
  bucket_id = 'published_files'
  and exists (
    select 1
    from public.course_enrollments ce
    join public.published_courses pc on pc.id = ce.published_course_id
    where pc.id = (split_part(storage.objects.name, '/', 1))::uuid
      and pc.is_active
      and ce.user_id = auth.uid())
      and ce.is_active = true
      and (ce.expires_at is null or ce.expires_at > now())
  )
);


-- ============================================================================
-- INSERT POLICY
-- Allow uploads to the 'published_files' bucket by:
--   - Org members with role 'owner', 'admin', or 'editor'.
-- ============================================================================

create policy "insert_published_files_if_org_member"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'published_files'
  and exists (
    select 1
    from public.courses c
    where c.id = (split_part(storage.objects.name, '/', 1))::uuid
      and public.get_user_org_role(c.organization_id, auth.uid())) in ('owner', 'admin', 'editor')
  )
);

-- ============================================================================
-- UPDATE POLICY
-- Allow updates to the 'published_files' bucket by:
--   - Org owners or admins,
--   - Editors who personally own the course.
-- ============================================================================

create policy "update_published_files_if_admin_or_owning_editor"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'published_files'
  and exists (
    select 1
    from public.courses c
    where c.id = (split_part(storage.objects.name, '/', 1))::uuid
      and (
        public.get_user_org_role(c.organization_id, auth.uid())) in ('owner', 'admin')
        or (
          public.get_user_org_role(c.organization_id, auth.uid())) = 'editor'
          and c.owned_by = auth.uid())
        )
      )
  )
)
with check (
  bucket_id = 'published_files'
  and exists (
    select 1
    from public.courses c
    where c.id = (split_part(storage.objects.name, '/', 1))::uuid
      and (
        public.get_user_org_role(c.organization_id, auth.uid())) in ('owner', 'admin')
        or (
          public.get_user_org_role(c.organization_id, auth.uid())) = 'editor'
          and c.owned_by = auth.uid())
        )
      )
  )
);

-- ============================================================================
-- DELETE POLICY
-- Allow deletions from the 'published_files' bucket by:
--   - Org owners or admins,
--   - Editors who personally own the course.
-- ============================================================================

create policy "delete_published_files_if_admin_or_owning_editor"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'published_files'
  and exists (
    select 1
    from public.courses c
    where c.id = (split_part(storage.objects.name, '/', 1))::uuid
      and (
        public.get_user_org_role(c.organization_id, auth.uid())) in ('owner', 'admin')
        or (
          public.get_user_org_role(c.organization_id, auth.uid())) = 'editor'
          and c.owned_by = auth.uid())
        )
      )
  )
);
