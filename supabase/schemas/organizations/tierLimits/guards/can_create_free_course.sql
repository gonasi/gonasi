create or replace function public.can_create_free_course(p_org uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  free_count int;
  max_free int;
  limits public.tier_limits;
begin
  select (public.org_usage_counts(p_org) ->> 'free_courses')::int
    into free_count;

  select * into limits
  from public.tier_limits
  where tier = public.get_org_tier(p_org);

  max_free := limits.max_free_courses_per_org;

  if max_free is null then
    return true;
  end if;

  return free_count < max_free;
end;
$$;
