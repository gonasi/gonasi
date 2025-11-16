-- ===========================================================
-- FUNCTION: public.get_org_tier
-- -----------------------------------------------------------
-- Purpose:
--   Returns the subscription tier of an organization based on
--   its active or non-renewing subscription.
--
-- Parameters:
--   p_org uuid – The ID of the organization.
--
-- Returns:
--   subscription_tier – The tier of the organization's active subscription.
--
-- Notes:
--   - Only considers active subscriptions.
--   - If the org has no active subscription, returns NULL.
-- ===========================================================
create or replace function public.get_org_tier(p_org uuid)
returns public.subscription_tier
language sql
security definer
stable
set search_path = ''
as $$
  select s.tier
  from public.organization_subscriptions s
  where s.organization_id = p_org
    and s.status in ('active', 'non-renewing')
  limit 1;
$$;