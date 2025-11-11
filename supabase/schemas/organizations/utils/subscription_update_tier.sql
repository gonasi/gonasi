-- ==========================================================================
-- FUNCTION: subscription_update_tier
-- ==========================================================================
-- PURPOSE:
--   Updates only the tier of an existing organization subscription.
--   Does NOT modify status, dates, or cancel flags.
--
-- SECURITY:
--   - SECURITY DEFINER
--   - search_path = ''
-- ==========================================================================
create or replace function public.subscription_update_tier(
  org_id uuid,
  new_tier text
)
returns public.organization_subscriptions
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.organization_subscriptions;
begin
  update public.organization_subscriptions
  set
    tier = new_tier::public.subscription_tier,
    updated_at = now()
  where organization_id = org_id
  returning * into result;

  if not found then
    raise exception 'No subscription found for organization_id: %', org_id
      using errcode = 'P0002'; -- no_data_found
  end if;

  return result;
end;
$$;
