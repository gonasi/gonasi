create or replace function public.get_tier_limits(p_org uuid)
returns public.tier_limits
language sql
security definer
set search_path = ''
stable
as $$
  select *
  from public.tier_limits tl
  where tl.tier = (
    select o.tier
    from public.organizations o
    where o.id = p_org
  );
$$;
