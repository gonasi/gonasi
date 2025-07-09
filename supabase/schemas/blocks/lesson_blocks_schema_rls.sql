-- ====================================================================================
-- table: lesson_blocks
-- updated RLS 
-- ====================================================================================

alter table public.lesson_blocks enable row level security;

-- ============================================================================
-- SELECT: Allow org members with any role to view lesson blocks
-- ============================================================================
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

-- ============================================================================
-- INSERT: Allow org members (owner, admin, editor) to add lesson blocks
-- ============================================================================
create policy "insert: org members (owner, admin, editor) can add lesson blocks"
on public.lesson_blocks
for insert
to authenticated
with check (
  exists (
    select 1
    from public.courses c
    join public.lessons l on l.course_id = c.id
    where l.id = lesson_blocks.lesson_id
      and public.get_user_org_role(c.organization_id, (select auth.uid())) in ('owner', 'admin', 'editor')
  )
);

-- ============================================================================
-- UPDATE: Allow only admins or owning editors to update lesson blocks
-- ============================================================================
create policy "update: admins or owning editors can modify lesson blocks"
on public.lesson_blocks
for update
to authenticated
using (
  exists (
    select 1
    from public.courses c
    join public.lessons l on l.course_id = c.id
    where l.id = lesson_blocks.lesson_id
      and (
        public.get_user_org_role(c.organization_id, (select auth.uid())) in ('owner', 'admin')
        or (
          public.get_user_org_role(c.organization_id, (select auth.uid())) = 'editor'
          and c.owned_by = auth.uid()
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.courses c
    join public.lessons l on l.course_id = c.id
    where l.id = lesson_blocks.lesson_id
      and (
        public.get_user_org_role(c.organization_id, (select auth.uid())) in ('owner', 'admin')
        or (
          public.get_user_org_role(c.organization_id, (select auth.uid())) = 'editor'
          and c.owned_by = auth.uid()
        )
      )
  )
);

-- ============================================================================
-- DELETE: Same as update — allow admins or owning editors
-- ============================================================================
create policy "delete: admins or owning editors can delete lesson blocks"
on public.lesson_blocks
for delete
to authenticated
using (
  exists (
    select 1
    from public.courses c
    join public.lessons l on l.course_id = c.id
    where l.id = lesson_blocks.lesson_id
      and (
        public.get_user_org_role(c.organization_id, (select auth.uid())) in ('owner', 'admin')
        or (
          public.get_user_org_role(c.organization_id, (select auth.uid())) = 'editor'
          and c.owned_by = auth.uid()
        )
      )
  )
);
