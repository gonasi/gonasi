create or replace function public.can_publish_course(
  course_id uuid,
  org_id uuid,
  user_id uuid
)
returns boolean
language sql
stable
set search_path = '' 
as $$
  select 
    public.get_user_org_role(org_id, user_id) in ('owner', 'admin')
    or exists (
      select 1
      from public.course_editors ce
      where ce.course_id = course_id
        and ce.user_id = user_id
    );
$$;
