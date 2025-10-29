-- ============================================================================
-- FUNCTION: public.get_organization_earnings_summary()
-- ============================================================================
-- PURPOSE:
--   Returns a detailed earnings summary for an organization in a specific
--   currency. Includes totals, monthly comparisons, and percentage changes.
--
--   Metrics returned:
--     - total_earnings: lifetime total credited to this organization wallet
--     - current_month_earnings: total earned this month
--     - previous_month_earnings: total earned last month
--     - month_over_month_change: absolute numeric change (current - previous)
--     - month_over_month_percentage_change: relative percentage change
--     - trend: simple direction indicator ("increased", "decreased", "no_change")
--
-- BUSINESS RULES:
--   - Only transactions where:
--       destination_wallet_type = 'organization'
--       direction = 'credit'
--       status = 'completed'
--     are counted as earnings.
--   - Calculations are done per currency (organizations can have multi-currency wallets).
--
-- EXAMPLE:
--   select *
--   from public.get_organization_earnings_summary(
--     '8a4dcb89-8e34-4e1d-b1a4-cc8d27a9b5e4',
--     'KES'
--   );
--
-- RETURN STRUCTURE:
--   TABLE (
--     organization_id uuid,
--     currency_code public.currency_code,
--     total_earnings numeric(19,4),
--     current_month_earnings numeric(19,4),
--     previous_month_earnings numeric(19,4),
--     month_over_month_change numeric(19,4),
--     month_over_month_percentage_change numeric(19,4),
--     trend text
--   )
--
-- MAINTAINERS:
--   - Finance & Data Engineering Team
--   - Authored by: Dalin Oluoch
--   - Last Updated: 2025-10-29
-- ============================================================================

create or replace function public.get_organization_earnings_summary(
  p_org_id uuid,
  p_currency public.currency_code
)
returns table (
  organization_id uuid,
  currency_code public.currency_code,
  total_earnings numeric(19,4),
  current_month_earnings numeric(19,4),
  previous_month_earnings numeric(19,4),
  month_over_month_change numeric(19,4),
  month_over_month_percentage_change numeric(19,4),
  trend text
)
language plpgsql
as $$
declare
  v_wallet_id uuid;  -- Organization’s wallet ID for the given currency
  v_this_month numeric(19,4);
  v_last_month numeric(19,4);
begin
  -- ==========================================================================
  -- STEP 1: Get organization wallet for the specified currency
  -- ==========================================================================
  select id into v_wallet_id
  from public.organization_wallets
  where organization_id = p_org_id
    and currency_code = p_currency
  limit 1;

  if v_wallet_id is null then
    raise exception 'Wallet not found for organization % and currency %',
      p_org_id, p_currency;
  end if;

  -- ==========================================================================
  -- STEP 2: Compute monthly earnings aggregates
  -- ==========================================================================
  with earnings as (
    select
      date_trunc('month', created_at) as month,
      sum(amount) as total
    from public.wallet_ledger_entries
    where destination_wallet_id = v_wallet_id
      and destination_wallet_type = 'organization'
      and direction = 'credit'
      and status = 'completed'
      and currency_code = p_currency
    group by 1
  ),
  this_month as (
    select coalesce(sum(total), 0) as total
    from earnings
    where month = date_trunc('month', now())
  ),
  last_month as (
    select coalesce(sum(total), 0) as total
    from earnings
    where month = date_trunc('month', now() - interval '1 month')
  )
  select
    coalesce((select total from this_month), 0),
    coalesce((select total from last_month), 0)
  into v_this_month, v_last_month;

  -- ==========================================================================
  -- STEP 3: Return final computed summary
  -- ==========================================================================
  return query
  select
    p_org_id as organization_id,
    p_currency as currency_code,

    -- Lifetime total earnings across all months
    coalesce((
      select sum(amount)
      from public.wallet_ledger_entries
      where destination_wallet_id = v_wallet_id
        and destination_wallet_type = 'organization'
        and direction = 'credit'
        and status = 'completed'
        and currency_code = p_currency
    ), 0) as total_earnings,

    -- Monthly aggregates
    v_this_month as current_month_earnings,
    v_last_month as previous_month_earnings,

    -- Absolute change
    (v_this_month - v_last_month) as month_over_month_change,

    -- Percentage change (handles division-by-zero safely)
    case
      when v_last_month = 0 then
        case when v_this_month > 0 then 100.0 else 0.0 end
      else round(((v_this_month - v_last_month) / v_last_month) * 100.0, 2)
    end as month_over_month_percentage_change,

    -- Trend direction label
    case
      when v_this_month > v_last_month then 'increased'
      when v_this_month < v_last_month then 'decreased'
      else 'no_change'
    end as trend;
end;
$$;
