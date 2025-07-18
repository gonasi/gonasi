alter table public.course_enrollments enable row level security;

create policy "select: org roles or own enrollment"
on public.course_enrollments
for select
to authenticated
using (
  -- the user is viewing their own enrollment
  course_enrollments.user_id = (select auth.uid())

  -- OR org admins/owners can view all enrollments
  or exists (
    select 1
    from public.courses pc
    where pc.id = course_enrollments.published_course_id
      and public.get_user_org_role(pc.organization_id, (select auth.uid())) in ('owner', 'admin')
  )

  -- OR editors who own the course
  or exists (
    select 1
    from public.courses pc
    where pc.id = course_enrollments.published_course_id
      and public.get_user_org_role(pc.organization_id, (select auth.uid())) = 'editor'
      and pc.owned_by = (select auth.uid())
  )
);
