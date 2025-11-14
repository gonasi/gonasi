create or replace function public.get_org_tier(p_org uuid)
returns public.subscription_tier
language sql
security definer
set search_path = ''
stable
as $$
  select o.tier
  from public.organizations o
  where o.id = p_org
  limit 1;
$$;
