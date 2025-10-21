-- ============================================================
-- Function: Reset Org AI Base Credits When Due (Tier-Aware)
-- Runs daily; resets only orgs whose next_reset_at <= now()
-- ============================================================
create or replace function public.reset_org_ai_base_credits_when_due()
returns void
set search_path = ''  -- ✅ safest, isolates from role search_path manipulation
as $$
begin
  update public.organizations_ai_credits as oac
  set
    base_credits_total = coalesce(t.ai_usage_limit_monthly, 100),
    base_credits_remaining = coalesce(t.ai_usage_limit_monthly, 100),
    last_reset_at = now(),
    next_reset_at = now() + interval '1 month',
    updated_at = now()
  from public.organizations as org
  left join public.tier_limits as t
    on org.tier = t.tier
  where
    oac.org_id = org.id
    and oac.next_reset_at <= now();
end;
$$ language plpgsql security definer;
