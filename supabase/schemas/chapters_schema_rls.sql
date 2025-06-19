-- ====================================================================================
-- row-level security (rls)
-- ====================================================================================

alter table public.chapters enable row level security;

-- select: allow users with course roles or ownership to view chapters
create policy "select: users with course roles or owners can view chapters"
on public.chapters
for select
to authenticated
using (
  exists (
    select 1 from public.courses c
    where c.id = chapters.course_id
      and (
        is_course_admin(c.id, (select auth.uid())) or
        is_course_editor(c.id, (select auth.uid())) or
        is_course_viewer(c.id, (select auth.uid())) or
        c.created_by = (select auth.uid())
      )
  )
);

-- insert: allow admins, editors, or owners to add chapters
create policy "insert: users with course roles or owners can add chapters"
on public.chapters
for insert
to authenticated
with check (
  exists (
    select 1 from public.courses c
    where c.id = chapters.course_id
      and (
        is_course_admin(c.id, (select auth.uid())) or
        is_course_editor(c.id, (select auth.uid())) or
        c.created_by = (select auth.uid())
      )
  )
);

-- update: allow admins, editors, or owners to modify chapters
create policy "update: users with admin/editor roles or owners can modify chapters"
on public.chapters
for update
to authenticated
using (
  exists (
    select 1 from public.courses c
    where c.id = chapters.course_id
      and (
        is_course_admin(c.id, (select auth.uid())) or
        is_course_editor(c.id, (select auth.uid())) or
        c.created_by = (select auth.uid())
      )
  )
)
with check (
  exists (
    select 1 from public.courses c
    where c.id = chapters.course_id
      and (
        is_course_admin(c.id, (select auth.uid())) or
        is_course_editor(c.id, (select auth.uid())) or
        c.created_by = (select auth.uid())
      )
  )
);

-- delete: allow admins, editors, or owners to remove chapters
create policy "delete: course admins, editors, and owners can remove chapters"
on public.chapters
for delete
to authenticated
using (
  exists (
    select 1 from public.courses c
    where c.id = chapters.course_id
      and (
        is_course_admin(c.id, (select auth.uid())) or
        is_course_editor(c.id, (select auth.uid())) or
        c.created_by = (select auth.uid())
      )
  )
);
