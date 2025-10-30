-- ========================================================================
-- FUNCTION: public.get_organization_earnings_summary
-- ========================================================================
-- PURPOSE:
--   Returns a row per organization wallet (currency), including lifetime
--   totals, month-over-month comparisons, and current balances.
--
-- CALL EXAMPLE:
--   select * from public.get_organization_earnings_summary('org-uuid');
--
-- SUPABASE RPC EXAMPLE:
--   supabase.rpc('get_organization_earnings_summary', { p_org_id: 'org-uuid' })
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
  total_earnings numeric(19,4),
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
  earnings as (
    select
      w.w_id,
      w.w_currency,
      date_trunc('month', e.created_at) as month,
      sum(e.amount) as total
    from wallets w
    inner join public.wallet_ledger_entries e
      on e.destination_wallet_id = w.w_id
      and e.destination_wallet_type = 'organization'
      and e.status = 'completed'
      and e.type in ('org_payout', 'reward_payout', 'funds_release', 'withdrawal_failed')
    group by w.w_id, w.w_currency, date_trunc('month', e.created_at)
  ),
  this_month as (
    select w_id, sum(total) as total
    from earnings
    where month = date_trunc('month', now())
    group by w_id
  ),
  last_month as (
    select w_id, sum(total) as total
    from earnings
    where month = date_trunc('month', now() - interval '1 month')
    group by w_id
  ),
  lifetime as (
    select w_id, sum(total) as total
    from earnings
    group by w_id
  )
  select
    p_org_id,
    w.w_id,
    w.w_currency,
    w.w_balance_total,
    w.w_balance_reserved,
    w.w_balance_total - w.w_balance_reserved as balance_available,
    coalesce(l.total, 0),
    coalesce(tm.total, 0),
    coalesce(lm.total, 0),
    coalesce(tm.total, 0) - coalesce(lm.total, 0),
    case
      when coalesce(lm.total, 0) = 0 then
        case when coalesce(tm.total, 0) > 0 then 100.0 else 0.0 end
      else round(((coalesce(tm.total, 0) - coalesce(lm.total, 0)) / lm.total) * 100.0, 2)
    end,
    case
      when coalesce(tm.total, 0) > coalesce(lm.total, 0) then 'increased'
      when coalesce(tm.total, 0) < coalesce(lm.total, 0) then 'decreased'
      else 'no_change'
    end
  from wallets w
  left join lifetime l on l.w_id = w.w_id
  left join this_month tm on tm.w_id = w.w_id
  left join last_month lm on lm.w_id = w.w_id;
end;
$$;