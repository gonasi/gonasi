-- ====================================================================================
-- Enable Row-Level Security on lesson_blocks table
-- ====================================================================================
alter table public.lesson_blocks enable row level security;

-- ====================================================================================
-- SELECT: Allow org members with any role in the course's org to view lesson blocks
-- ====================================================================================
create policy "select: org members can view lesson blocks"
on public.lesson_blocks
for select
to authenticated
using (
  exists (
    select 1
    from public.courses c
    join public.lessons l on l.course_id = c.id
    where l.id = lesson_blocks.lesson_id
      and public.get_user_org_role(c.organization_id, (select auth.uid())) is not null
  )
);

-- ====================================================================================
-- INSERT: Allow owner/admin to insert; editor only if they own the course
-- ====================================================================================
create policy "insert: can_user_edit_course allows adding lesson blocks"
on public.lesson_blocks
for insert
to authenticated
with check (
  exists (
    select 1
    from public.lessons l
    where l.id = lesson_blocks.lesson_id
      and public.can_user_edit_course(l.course_id)
  )
);

-- ====================================================================================
-- UPDATE: Same as insert — can_user_edit_course must return true
-- ====================================================================================
create policy "update: can_user_edit_course allows modifying lesson blocks"
on public.lesson_blocks
for update
to authenticated
using (
  exists (
    select 1
    from public.lessons l
    where l.id = lesson_blocks.lesson_id
      and public.can_user_edit_course(l.course_id)
  )
)
with check (
  exists (
    select 1
    from public.lessons l
    where l.id = lesson_blocks.lesson_id
      and public.can_user_edit_course(l.course_id)
  )
);

-- ====================================================================================
-- DELETE: Same as update — use can_user_edit_course
-- ====================================================================================
create policy "delete: can_user_edit_course allows deleting lesson blocks"
on public.lesson_blocks
for delete
to authenticated
using (
  exists (
    select 1
    from public.lessons l
    where l.id = lesson_blocks.lesson_id
      and public.can_user_edit_course(l.course_id)
  )
);
