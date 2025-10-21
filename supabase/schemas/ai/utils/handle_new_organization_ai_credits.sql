-- ============================================================
-- Trigger Function: Create Initial AI Credits for New Org (Tier-Aware)
-- ============================================================
create or replace function public.handle_new_organization_ai_credits()
returns trigger
set search_path = ''  -- ✅ safest: isolates from role search_path manipulation
as $$
declare
  monthly_limit int;
begin
  -- Get monthly AI credit limit based on tier
  select public.tier_limits.ai_usage_limit_monthly
  into monthly_limit
  from public.tier_limits
  where public.tier_limits.tier = new.tier;

  -- Fallback to 100 if tier not found or has null limit
  if monthly_limit is null then
    monthly_limit := 100;
  end if;

  -- Insert the org’s initial AI credit record
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
  values (
    new.id,
    monthly_limit,
    monthly_limit,
    0,
    0,
    now(),
    now() + interval '1 month',
    now()
  )
  on conflict (org_id) do nothing;  -- Prevent duplicates

  return new;
end;
$$ language plpgsql security definer;


-- ============================================================
-- Trigger: Create AI Credits on Org Insert
-- ============================================================
drop trigger if exists trg_create_org_ai_credits on public.organizations;

create trigger trg_create_org_ai_credits
after insert on public.organizations
for each row
execute function public.handle_new_organization_ai_credits();

