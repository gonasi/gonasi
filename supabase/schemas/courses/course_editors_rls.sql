-- ====================================================================================
-- ENABLE RLS
-- ====================================================================================
alter table public.course_editors enable row level security;

-- SELECT: Any organization member can see course editors
create policy "course-editors-select-org-members"
on public.course_editors 
for select
to authenticated
using (
    has_org_role(
        organization_id,  -- No subquery needed!
        'editor',
        (select auth.uid())
    )
);

-- INSERT: Only org admins (or higher) may add editors
create policy "course-editors-insert-admins"
on public.course_editors
for insert
with check (
    -- Only admins or owners may add course editors
    has_org_role(
        organization_id,  -- No subquery needed!
        'admin',
        (select auth.uid())
    )
    AND
    -- Target user must belong to the same organization
    exists (
        select 1
        from public.organization_members m
        where m.organization_id = course_editors.organization_id
          and m.user_id = course_editors.user_id
    )
);

-- DELETE: Only org admins (or higher) may remove editors
create policy "course-editors-delete-admins"
on public.course_editors
for delete 
using (
    has_org_role(
        organization_id,  -- No subquery needed!
        'admin',
        (select auth.uid())
    )
);