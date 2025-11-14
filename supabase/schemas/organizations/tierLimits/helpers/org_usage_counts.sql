create or replace function public.org_usage_counts(p_org uuid)
returns jsonb
language sql
security definer
set search_path = ''
stable
as $$
  with members as (
    select count(*) as total_members
    from public.organization_members m
    where m.organization_id = p_org
  ),
  free as (
    select count(*) as free_courses
    from public.published_courses pc
    where pc.organization_id = p_org
      and pc.has_free_tier = true
  )
  select jsonb_build_object(
    'total_members', (select total_members from members),
    'free_courses', (select free_courses from free)
  );
$$;
  