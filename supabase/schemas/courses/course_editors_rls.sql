
-- ====================================================================================
-- ENABLE RLS
-- ====================================================================================
alter table public.course_editors enable row level security;

-- ====================================================================================
-- RLS POLICIES USING has_org_role
-- ====================================================================================

-- Add course editor: only org admins (or higher) can add, target user must be editor
create policy "add-course-editor"
on public.course_editors
for insert with check (
    has_org_role(
        (select c.organization_id from public.courses c where c.id = course_id),
        'admin',
        (select auth.uid())
    )
    AND
    exists (
        select 1
        from public.organization_members m
        join public.courses c on c.organization_id = m.organization_id
        where c.id = course_id
          and m.user_id = user_id   -- target editor
          and m.role = 'editor'
    )
);

-- Remove course editor: only org admins (or higher)
create policy "remove-course-editor"
on public.course_editors 
for delete using (
    has_org_role(
        (select c.organization_id from public.courses c where c.id = course_id),
        'admin',
        (select auth.uid())
    )
);

-- Update/Delete course: org admins or explicitly assigned editors
create policy "course-update-delete"
on public.courses
for update using (
    has_org_role(organization_id, 'admin', (select auth.uid()))
    OR
    exists (
        select 1
        from public.course_editors ce
        where ce.course_id = courses.id
          and ce.user_id = (select auth.uid())
    )
);