-- ===================================================
-- Function: public.get_tier_limits_for_org
-- Description: Returns full tier limits JSON for an organization
-- ===================================================
create or replace function public.get_tier_limits_for_org(org_id uuid)
returns json
language sql
stable
set search_path = ''
as $$
  select row_to_json(tl)
  from public.organizations o
  join public.tier_limits tl on tl.tier = o.tier
  where o.id = org_id
$$;
