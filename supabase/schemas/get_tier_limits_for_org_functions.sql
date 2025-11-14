-- ===========================================================
-- FUNCTION: public.get_tier_limits_for_org
-- -----------------------------------------------------------
-- Purpose:
--   Returns the full tier limits for an organization as JSON,
--   based on its **active subscription tier**.
--
-- Notes:
--   - Only considers active subscriptions.
--   - SECURITY DEFINER can be added if needed.
--   - search_path is cleared to avoid schema conflicts.
--
-- Parameters:
--   org_id uuid – The ID of the organization.
--
-- Returns:
--   json – JSON object representing the row from tier_limits for the org’s active tier.
--
-- Example Usage:
--   select public.get_tier_limits_for_org('df423f7b-e0d3-4ab9-8b54-2e823fdd25f7');
-- ===========================================================
create or replace function public.get_tier_limits_for_org(org_id uuid)
returns json
language sql
stable
set search_path = ''
as $$
  select row_to_json(tl)
  from public.organization_subscriptions s
  join public.tier_limits tl on tl.tier = s.tier
  where s.organization_id = org_id
    and s.status = 'active'
  limit 1;
$$;
