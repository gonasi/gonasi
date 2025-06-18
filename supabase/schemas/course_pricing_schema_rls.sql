-- ============================================================================
-- row-level security (rls) policies for course_pricing_tiers table
-- defines fine-grained access based on user roles and course ownership
-- ============================================================================

-- allow read access to pricing tiers for users who:
-- - are course admins, editors, viewers, or the course creator
create policy "select: users with course roles or owners can view pricing tiers"
on public.course_pricing_tiers
for select
to authenticated
using (
  exists (
    select 1 from public.courses c
    where c.id = course_pricing_tiers.course_id
      and (
        is_course_admin(c.id, (select auth.uid())) or
        is_course_editor(c.id, (select auth.uid())) or
        is_course_viewer(c.id, (select auth.uid())) or
        c.created_by = (select auth.uid())
      )
  )
);

-- allow insert access only to users who:
-- - are course admins, editors, or the course creator
-- viewers are explicitly excluded
create policy "insert: users with course roles or owners can add pricing tiers"
on public.course_pricing_tiers
for insert
to authenticated
with check (
  exists (
    select 1 from public.courses c
    where c.id = course_pricing_tiers.course_id
      and (
        is_course_admin(c.id, (select auth.uid())) or
        is_course_editor(c.id, (select auth.uid())) or
        c.created_by = (select auth.uid())
      )
  )
);

-- allow update access under the same conditions as insert:
-- - course admins, editors, or the course creator
-- both using and with check are used to ensure safe updates
create policy "update: users with admin/editor roles or owners can modify pricing tiers"
on public.course_pricing_tiers
for update
to authenticated
using (
  exists (
    select 1 from public.courses c
    where c.id = course_pricing_tiers.course_id
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
    where c.id = course_pricing_tiers.course_id
      and (
        is_course_admin(c.id, (select auth.uid())) or
        is_course_editor(c.id, (select auth.uid())) or
        c.created_by = (select auth.uid())
      )
  )
);

-- allow deletion of pricing tiers only for:
-- - course admins, editors, or the course creator
-- restricts monetization-impacting actions to trusted roles
create policy "delete: course admins, editors, and owners can remove pricing tiers"
on public.course_pricing_tiers
for delete
to authenticated
using (
  exists (
    select 1 from public.courses c
    where c.id = course_pricing_tiers.course_id
      and (
        is_course_admin(c.id, (select auth.uid())) or
        is_course_editor(c.id, (select auth.uid())) or
        c.created_by = (select auth.uid())
      )
  )
);
