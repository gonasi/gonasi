-- ============================================================================
-- Enable Row-Level Security on course_pricing_tiers
-- ============================================================================
alter table public.course_pricing_tiers enable row level security;

-- ============================================================================
-- SELECT: Allow org members with any role to view course pricing tiers
-- ============================================================================
create policy "select: org members can view pricing tiers"
on public.course_pricing_tiers
for select
to authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = course_pricing_tiers.course_id
      and public.get_user_org_role(c.organization_id, (select auth.uid())) is not null
  )
);

-- ============================================================================
-- INSERT: Allow inserting if can_user_edit_course(course_id) is true
-- ============================================================================
create policy "insert: can_user_edit_course allows adding pricing tiers"
on public.course_pricing_tiers
for insert
to authenticated
with check (
  public.can_user_edit_course(course_pricing_tiers.course_id)
);

-- ============================================================================
-- UPDATE: Same rule — can_user_edit_course must return true
-- ============================================================================
create policy "update: can_user_edit_course allows updating pricing tiers"
on public.course_pricing_tiers
for update
to authenticated
using (
  public.can_user_edit_course(course_pricing_tiers.course_id)
)
with check (
  public.can_user_edit_course(course_pricing_tiers.course_id)
);

-- ============================================================================
-- DELETE: Same rule — can_user_edit_course must return true
-- ============================================================================
create policy "delete: can_user_edit_course allows deleting pricing tiers"
on public.course_pricing_tiers
for delete
to authenticated
using (
  public.can_user_edit_course(course_pricing_tiers.course_id)
);
