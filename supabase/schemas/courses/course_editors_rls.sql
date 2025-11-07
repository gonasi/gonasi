-- ====================================================================================
-- ENABLE RLS
-- ====================================================================================
alter table public.course_editors enable row level security;

-- ====================================================================================
-- SELECT: Any organization member can see course editors
-- ====================================================================================
create policy "course-editors-select-org-members"
on public.course_editors 
for select
to authenticated
using (
    -- User must be a member of the course's organization
    has_org_role(
        (select c.organization_id
          from public.courses c
          where c.id = course_editors.course_id),
        'editor',               -- 'editor' or higher
        (select auth.uid())
    )
);

-- ====================================================================================
-- INSERT: Only org admins (or higher) may add editors
-- Target user must be an org member (any role) — not strictly 'editor'
-- ====================================================================================
create policy "course-editors-insert-admins"
on public.course_editors
for insert
with check (
    -- Only admins or owners may add course editors
    has_org_role(
        (select c.organization_id
         from public.courses c
         where c.id = course_id),
        'admin',
        (select auth.uid())
    )

    AND

    -- Target user must belong to the same organization
    exists (
        select 1
        from public.organization_members m
        join public.courses c on c.organization_id = m.organization_id
        where c.id = course_id
          and m.user_id = user_id
    )
);

-- ====================================================================================
-- DELETE: Only org admins (or higher) may remove editors
-- ====================================================================================
create policy "course-editors-delete-admins"
on public.course_editors
for delete
using (
    has_org_role(
        (select c.organization_id
         from public.courses c
         where c.id = course_editors.course_id),
        'admin',
        (select auth.uid())
    )
);
