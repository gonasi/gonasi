-- ============================================================================
-- Enable Row-Level Security on chapters table
-- ============================================================================
alter table public.chapters enable row level security;

-- ============================================================================
-- SELECT: Allow org members with any course role to view chapters
-- ============================================================================
create policy "select: org members or editors can view chapters"
on public.chapters
for select
to authenticated
using (
  public.can_user_edit_course(chapters.course_id)
);


-- ============================================================================
-- INSERT: Allow owner/admin to insert into any course; editors only if they own it
-- ============================================================================
create policy "insert: can_user_edit_course allows inserting chapters"
on public.chapters
for insert
to authenticated
with check (
  public.can_user_edit_course(chapters.course_id)
);

-- ============================================================================
-- UPDATE: Same rule as insert — allow if can_user_edit_course returns true
-- ============================================================================
create policy "update: can_user_edit_course allows updating chapters"
on public.chapters
for update
to authenticated
using (
  public.can_user_edit_course(chapters.course_id)
)
with check (
  public.can_user_edit_course(chapters.course_id)
);

-- ============================================================================
-- DELETE: Same rule — allow if can_user_edit_course returns true
-- ============================================================================
create policy "delete: can_user_edit_course allows deleting chapters"
on public.chapters
for delete
to authenticated
using (
  public.can_user_edit_course(chapters.course_id)
);
