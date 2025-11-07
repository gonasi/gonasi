-- ========================================================================
-- FUNCTION: public.get_organization_earnings_summary
-- ========================================================================
-- PURPOSE:
--   Returns a row per organization wallet (currency), including lifetime
--   totals, month-over-month comparisons, and current balances.
--   Only accessible to organization admins and owners.
-- ========================================================================
create or replace function public.get_organization_earnings_summary(
  p_org_id uuid
)
returns table (
  organization_id uuid,
  wallet_id uuid,
  currency_code public.currency_code,
  balance_total numeric(19,4),
  balance_reserved numeric(19,4),
  balance_available numeric(19,4),
  gross_earnings numeric(19,4),
  total_fees numeric(19,4),
  net_earnings numeric(19,4),
  current_month_earnings numeric(19,4),
  previous_month_earnings numeric(19,4),
  month_over_month_change numeric(19,4),
  month_over_month_percentage_change numeric(19,4),
  trend text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- ============================================================
  -- ✅ Permission check: allow only admin or owner
  -- ============================================================
  if not public.has_org_role(p_org_id, 'admin', auth.uid()) then
    raise exception 'You do not have permission to view organization earnings.';
  end if;

  return query
  with wallets as (
    select 
      ow.id as w_id, 
      ow.currency_code as w_currency,
      ow.balance_total as w_balance_total,
      ow.balance_reserved as w_balance_reserved
    from public.organization_wallets ow
    where ow.organization_id = p_org_id
  ),

  inflows as (
    select
      e.destination_wallet_id as w_id,
      date_trunc('month', e.created_at) as month,
      sum(e.amount) as amount
    from public.wallet_ledger_entries e
    where e.status = 'completed'
      and e.direction = 'credit'
      and e.type in (
        'course_purchase',
        'payment_inflow',
        'funds_release',
        'reward_payout',
        'org_payout',
        'sponsorship_payment'
      )
    group by e.destination_wallet_id, date_trunc('month', e.created_at)
  ),

  deductions as (
    select
      e.source_wallet_id as w_id,
      date_trunc('month', e.created_at) as month,
      sum(e.amount) as amount
    from public.wallet_ledger_entries e
    where e.status = 'completed'
      and e.direction = 'debit'
      and e.type in (
        'platform_revenue',
        'payment_gateway_fee',
        'refund',
        'chargeback',
        'tax_withholding',
        'tax_remittance'
      )
    group by e.source_wallet_id, date_trunc('month', e.created_at)
  ),

  monthly as (
    select
      w.w_id,
      w.w_currency,
      coalesce(i.month, d.month) as month,
      coalesce(i.amount, 0) as gross,
      coalesce(d.amount, 0) as fees,
      coalesce(i.amount, 0) - coalesce(d.amount, 0) as net
    from wallets w
    left join inflows i on i.w_id = w.w_id
    full join deductions d on d.w_id = w.w_id and d.month = i.month
  ),

  this_month as (
    select w_id, sum(net) as total
    from monthly
    where month = date_trunc('month', now())
    group by w_id
  ),

  last_month as (
    select w_id, sum(net) as total
    from monthly
    where month = date_trunc('month', now() - interval '1 month')
    group by w_id
  ),

  lifetime as (
    select w_id, sum(gross) as gross, sum(fees) as fees, sum(net) as net
    from monthly
    group by w_id
  )

  select
    p_org_id as organization_id,
    w.w_id as wallet_id,
    w.w_currency as currency_code,
    w.w_balance_total as balance_total,
    w.w_balance_reserved as balance_reserved,
    (w.w_balance_total - w.w_balance_reserved) as balance_available,
    coalesce(l.gross, 0) as gross_earnings,
    coalesce(l.fees, 0) as total_fees,
    coalesce(l.net, 0) as net_earnings,
    coalesce(tm.total, 0) as current_month_earnings,
    coalesce(lm.total, 0) as previous_month_earnings,
    coalesce(tm.total, 0) - coalesce(lm.total, 0) as month_over_month_change,
    case
      when coalesce(lm.total, 0) = 0 then
        case when coalesce(tm.total, 0) > 0 then 100.0 else 0.0 end
      else round(((coalesce(tm.total, 0) - coalesce(lm.total, 0)) / lm.total) * 100.0, 2)
    end as month_over_month_percentage_change,
    case
      when coalesce(tm.total, 0) > coalesce(lm.total, 0) then 'increased'
      when coalesce(tm.total, 0) < coalesce(lm.total, 0) then 'decreased'
      else 'no_change'
    end as trend
  from wallets w
  left join lifetime l on l.w_id = w.w_id
  left join this_month tm on tm.w_id = w.w_id
  left join last_month lm on lm.w_id = w.w_id;
end;
$$;
