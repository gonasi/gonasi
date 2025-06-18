
-- ====================================================================================
-- row-level security (rls)
-- ====================================================================================
alter table public.lesson_blocks enable row level security;

-- select policy: allow course admins, editors, viewers, or owners to view blocks
create policy "select: users with course roles (admin/editor/viewer) or owners can view lesson blocks"
on public.lesson_blocks
for select
to authenticated
using (
  exists (
    select 1 from public.courses c
    join public.lessons l on l.course_id = c.id
    where l.id = lesson_blocks.lesson_id
      and (
        is_course_admin(c.id, (select auth.uid())) or
        is_course_editor(c.id, (select auth.uid())) or
        is_course_viewer(c.id, (select auth.uid())) or
        c.created_by = (select auth.uid())
      )
  )
);

-- insert policy: allow course admins, editors, or owners to add blocks
create policy "insert: users with course roles (admin/editor) or owners can add lesson blocks"
on public.lesson_blocks
for insert
to authenticated
with check (
  exists (
    select 1 from public.courses c
    join public.lessons l on l.course_id = c.id
    where l.id = lesson_blocks.lesson_id
      and (
        is_course_admin(c.id, (select auth.uid())) or
        is_course_editor(c.id, (select auth.uid())) or
        c.created_by = (select auth.uid())
      )
  )
);

-- update policy: allow course admins, editors, or owners to update blocks
create policy "update: users with admin/editor roles or owners can modify lesson blocks"
on public.lesson_blocks
for update
to authenticated
using (
  exists (
    select 1 from public.courses c
    join public.lessons l on l.course_id = c.id
    where l.id = lesson_blocks.lesson_id
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
    join public.lessons l on l.course_id = c.id
    where l.id = lesson_blocks.lesson_id
      and (
        is_course_admin(c.id, (select auth.uid())) or
        is_course_editor(c.id, (select auth.uid())) or
        c.created_by = (select auth.uid())
      )
  )
);

-- delete policy: allow course admins, editors, or owners to delete blocks
create policy "delete: course admins, editors, and owners can remove lesson blocks"
on public.lesson_blocks
for delete
to authenticated
using (
  exists (
    select 1 from public.courses c
    join public.lessons l on l.course_id = c.id
    where l.id = lesson_blocks.lesson_id
      and (
        is_course_admin(c.id, (select auth.uid())) or
        is_course_editor(c.id, (select auth.uid())) or
        c.created_by = (select auth.uid())
      )
  )
);