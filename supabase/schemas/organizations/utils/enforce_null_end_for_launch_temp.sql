-- ======================================================================
-- FUNCTION: enforce_null_end_for_launch_temp
-- ======================================================================
-- Purpose:
--   Ensure that for 'launch' or 'temp' subscriptions, current_period_end is always NULL.
--   Updates any insert or update that violates this rule.
-- ======================================================================
create or replace function public.enforce_null_end_for_launch_temp()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.tier in ('launch', 'temp') then
    -- Force current_period_end to NULL for these tiers
    new.current_period_end := NULL;
    new.next_tier := NULL;
    new.next_plan_code := NULL;
    new.downgrade_requested_at := NULL;
    new.downgrade_effective_at := NULL;
    new.downgrade_executed_at := NULL;
    new.downgrade_requested_by := NULL;
    new.status := 'active';
    new.next_payment_date := NULL;
    new.initial_next_payment_date := NULL;
  end if;

  return new;
end;
$$;

-- ======================================================================
-- TRIGGER: trg_enforce_null_end_for_launch_temp
-- ======================================================================
create trigger trg_enforce_null_end_for_launch_temp
before insert or update on public.organization_subscriptions
for each row
execute function public.enforce_null_end_for_launch_temp();
