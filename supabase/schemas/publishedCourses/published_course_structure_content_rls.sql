-- ================================================================================
-- rls: public.published_course_structure_content
-- ================================================================================
alter table public.published_course_structure_content enable row level security;

-- ================================================================================
-- select: allow only actively enrolled users
-- ================================================================================
create policy select_enrolled_users
on public.published_course_structure_content
for select
to authenticated
using (
  exists (
    select 1
    from public.course_enrollments as ce
    where ce.published_course_id = published_course_structure_content.id
      and ce.user_id = (select auth.uid())
      and ce.is_active = true
      and (ce.expires_at is null or ce.expires_at > now())
  )
);

-- ================================================================================
-- insert: allow org members to publish
-- ================================================================================
create policy insert_org_members
on public.published_course_structure_content
for insert
to authenticated
with check (
  exists (
    select 1
    from public.courses as c
    where c.id = published_course_structure_content.id
      and public.get_user_org_role(c.organization_id, (select auth.uid())) is not null
  )
);

-- ================================================================================
-- update: allow org owners/admins or original editor
-- ================================================================================
create policy update_org_admins_or_editor
on public.published_course_structure_content
for update
to authenticated
using (
  exists (
    select 1
    from public.courses as c
    where c.id = published_course_structure_content.id
      and (
        public.get_user_org_role(c.organization_id, (select auth.uid())) in ('owner', 'admin')
        or (
          public.get_user_org_role(c.organization_id, (select auth.uid())) = 'editor'
          and c.owned_by = (select auth.uid())
        )
      )
  )
);

-- ================================================================================
-- delete: same as update
-- ================================================================================
create policy delete_org_admins_or_editor
on public.published_course_structure_content
for delete
to authenticated
using (
  exists (
    select 1
    from public.courses as c
    where c.id = published_course_structure_content.id
      and (
        public.get_user_org_role(c.organization_id, (select auth.uid())) in ('owner', 'admin')
        or (
          public.get_user_org_role(c.organization_id, (select auth.uid())) = 'editor'
          and c.owned_by = (select auth.uid())
        )
      )
  )
);
