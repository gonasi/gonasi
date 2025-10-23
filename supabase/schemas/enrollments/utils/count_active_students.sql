create or replace function count_active_students(org_id uuid)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select count(distinct user_id)
  from public.course_enrollments
  where organization_id = org_id
    and is_active = true;
$$;