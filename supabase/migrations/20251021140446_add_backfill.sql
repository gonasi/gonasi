

-- ============================================================
-- Backfill organizations_ai_credits for existing orgs
-- ============================================================

insert into public.organizations_ai_credits (
  org_id,
  base_credits_total,
  base_credits_remaining,
  purchased_credits_total,
  purchased_credits_remaining,
  last_reset_at,
  next_reset_at,
  updated_at
)
select
  o.id as org_id,
  coalesce(t.ai_usage_limit_monthly, 100) as base_credits_total,
  coalesce(t.ai_usage_limit_monthly, 100) as base_credits_remaining,
  0 as purchased_credits_total,
  0 as purchased_credits_remaining,
  now() as last_reset_at,
  now() + interval '1 month' as next_reset_at,
  now() as updated_at
from public.organizations o
left join public.tier_limits t
  on o.tier = t.tier
where not exists (
  select 1
  from public.organizations_ai_credits c
  where c.org_id = o.id
);
