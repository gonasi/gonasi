-- ===========================================================
-- FUNCTION: public.get_tier_limits
-- -----------------------------------------------------------
-- Purpose:
--   Returns the tier limits record for an organization's active tier.
--
-- Parameters:
--   p_org uuid – The ID of the organization.
--
-- Returns:
--   tier_limits – The row from public.tier_limits corresponding
--                 to the organization's active subscription tier.
--
-- Notes:
--   - If the organization has no active subscription, returns NULL.
-- ===========================================================
create or replace function public.get_tier_limits(p_org uuid)
returns public.tier_limits
language sql
security definer
stable
set search_path = ''
as $$
  select tl.*
  from public.tier_limits tl
  join public.organization_subscriptions s
    on s.tier = tl.tier
  where s.organization_id = p_org
    and s.status = 'active'
  limit 1;
$$;
