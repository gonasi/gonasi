-- ============================================================================
-- enable row-level security
-- ============================================================================
alter table public.published_file_library
  enable row level security;

-- ============================================================================
-- select policy:
-- allow if user is an org member (any role) OR actively enrolled in course
-- ============================================================================
create policy select_if_org_member_or_enrolled_user
on public.published_file_library
for select
to authenticated
using (
  public.get_user_org_role(published_file_library.organization_id, (select auth.uid())) is not null
  or exists (
    select 1
    from public.course_enrollments as ce
    where ce.published_course_id = published_file_library.course_id
      and ce.user_id = (select auth.uid())
      and ce.is_active = true
      and (ce.expires_at is null or ce.expires_at > now())
  )
);

-- ============================================================================
-- insert policy:
-- allow if user is owner/admin of org or course creator (editor)
-- ============================================================================
create policy insert_if_owner_admin_or_course_creator
on public.published_file_library
for insert
to authenticated
with check (
  exists (
    select 1
    from public.courses c
    where c.id = published_file_library.course_id
      and (
        public.get_user_org_role(c.organization_id, (select auth.uid())) in ('owner', 'admin')
        or (
          public.get_user_org_role(c.organization_id, (select auth.uid())) = 'editor'
          and c.created_by = (select auth.uid())
        )
      )
  )
);

-- ============================================================================
-- update policy:
-- same conditions as insert
-- ============================================================================
create policy update_if_owner_admin_or_course_creator
on public.published_file_library
for update
to authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = published_file_library.course_id
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
    where c.id = published_file_library.course_id
      and (
        public.get_user_org_role(c.organization_id, (select auth.uid())) in ('owner', 'admin')
        or (
          public.get_user_org_role(c.organization_id, (select auth.uid())) = 'editor'
          and c.created_by = (select auth.uid())
        )
      )
  )
);

-- ============================================================================
-- delete policy:
-- same conditions as insert/update
-- ============================================================================
create policy delete_if_owner_admin_or_course_creator
on public.published_file_library
for delete
to authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = published_file_library.course_id
      and (
        public.get_user_org_role(c.organization_id, (select auth.uid())) in ('owner', 'admin')
        or (
          public.get_user_org_role(c.organization_id, (select auth.uid())) = 'editor'
          and c.created_by = (select auth.uid())
        )
      )
  )
);
