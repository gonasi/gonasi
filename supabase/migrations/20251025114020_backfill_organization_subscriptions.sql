-- ==========================================
-- BACKFILL EXISTING ORGANIZATIONS
-- ==========================================

insert into public.organization_subscriptions (
  organization_id,
  tier,
  status,
  start_date,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  created_at,
  updated_at
)
select
  o.id as organization_id,
  o.tier as tier,
  'active'::subscription_status as status,
  timezone('utc', now()) as start_date,
  timezone('utc', now()) as current_period_start,
  null as current_period_end,
  false as cancel_at_period_end,
  timezone('utc', now()) as created_at,
  timezone('utc', now()) as updated_at
from public.organizations o
left join public.organization_subscriptions s
  on s.organization_id = o.id
where s.organization_id is null;
