create or replace function public.subscription_upsert_webhook(
  org_id uuid,
  new_tier text,
  new_status text,
  start_ts timestamptz,
  period_start timestamptz,
  period_end timestamptz,
  cancel_at_period_end boolean default false,
  initial_next_payment_date timestamptz default null,
  paystack_customer_code text default null,
  paystack_subscription_code text default null
)
returns public.organization_subscriptions
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.organization_subscriptions;
begin
  insert into public.organization_subscriptions (
    organization_id,
    tier,
    status,
    start_date,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    initial_next_payment_date,
    paystack_customer_code,
    paystack_subscription_code
  )
  values (
    org_id,
    new_tier::public.subscription_tier,
    new_status::public.subscription_status,
    start_ts,
    period_start,
    period_end,
    cancel_at_period_end,
    coalesce(initial_next_payment_date, period_end),
    paystack_customer_code,
    paystack_subscription_code
  )
  on conflict (organization_id)
  do update set
    tier                  = excluded.tier,
    status                = excluded.status,
    start_date            = excluded.start_date,
    current_period_start  = excluded.current_period_start,
    current_period_end    = excluded.current_period_end,
    cancel_at_period_end  = excluded.cancel_at_period_end,
    paystack_customer_code= excluded.paystack_customer_code,
    paystack_subscription_code= excluded.paystack_subscription_code
  returning * into result;

  return result;
end;
$$;
