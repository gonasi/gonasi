-- =====================================================================
-- row-level security (rls) policies for public.course_files
-- ---------------------------------------------------------------------
-- purpose:
--   control access to course file records based on organization roles
--   and course ownership. relies on `get_user_org_role()` helper.
-- =====================================================================

alter table public.course_files enable row level security;

-- ---------------------------------------------------------------------
-- select: allow all organization members to view files
-- ---------------------------------------------------------------------
create policy select_org_members
on public.course_files
for select
to authenticated
using (
  public.get_user_org_role(course_files.organization_id, (select auth.uid())) is not null
);

-- ---------------------------------------------------------------------
-- insert: allow organization owner/admin or course creator/editor
-- ---------------------------------------------------------------------
create policy insert_by_org_admin_or_course_editor
on public.course_files
for insert
to authenticated
with check (
  exists (
    select 1
    from public.courses c
    where c.id = course_files.course_id
      and (
        public.get_user_org_role(c.organization_id, (select auth.uid())) in ('owner', 'admin')
        or (
          public.get_user_org_role(c.organization_id, (select auth.uid())) = 'editor'
          and c.created_by = (select auth.uid())
        )
      )
  )
);

-- ---------------------------------------------------------------------
-- update: allow organization owner/admin or course creator/editor
-- ---------------------------------------------------------------------
create policy update_by_org_admin_or_course_editor
on public.course_files
for update
to authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = course_files.course_id
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
    where c.id = course_files.course_id
      and (
        public.get_user_org_role(c.organization_id, (select auth.uid())) in ('owner', 'admin')
        or (
          public.get_user_org_role(c.organization_id, (select auth.uid())) = 'editor'
          and c.created_by = (select auth.uid())
        )
      )
  )
);

-- ---------------------------------------------------------------------
-- delete: allow organization owner/admin or course creator/editor
-- ---------------------------------------------------------------------
create policy delete_by_org_admin_or_course_editor
on public.course_files
for delete
to authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = course_files.course_id
      and (
        public.get_user_org_role(c.organization_id, (select auth.uid())) in ('owner', 'admin')
        or (
          public.get_user_org_role(c.organization_id, (select auth.uid())) = 'editor'
          and c.created_by = (select auth.uid())
        )
      )
  )
);
