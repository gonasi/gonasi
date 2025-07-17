alter table public.course_enrollments enable row level security;

create policy "select: allowed org roles or enrollment owner"
on public.course_enrollments
for select
to authenticated
using (
  exists (
    select 1
    from public.courses pc
    where pc.id = course_enrollments.published_course_id
      and (
        -- org owners/admins can view all enrollments
        public.get_user_org_role(pc.organization_id, (select auth.uid())) in ('owner', 'admin')

        -- editors can view if they own the course
        or (
          public.get_user_org_role(pc.organization_id, (select auth.uid())) = 'editor'
          and pc.owned_by = (select auth.uid())
        )

        -- the user is viewing their own enrollment
        or course_enrollments.user_id = (select auth.uid())
      )
  )
);
