-- ============================================================================
-- LEDGER VERIFICATION QUERY
-- ============================================================================
-- Purpose: Verify double-entry accounting for course payment transactions
-- Usage: Run this after processing a payment to verify all entries are correct
-- ============================================================================

-- Replace with your actual paystack_reference
with payment_reference as (
  select '7f7ecc49-05ce-4a53-9f6a-72b65980bfd1'::text as ref
)

select
  wle.id as ledger_entry_id,
  wle.type as transaction_type,
  wle.direction,
  
  -- Source wallet
  case 
    when wle.source_wallet_type = 'external' then 'External (Paystack)'
    when wle.source_wallet_type = 'platform' then 'Platform (Gonasi)'
    when wle.source_wallet_type = 'organization' then concat('Organization (', o.name, ')')
    when wle.source_wallet_type = 'user' then 'User'
  end as source_wallet,
  
  -- Destination wallet
  case 
    when wle.destination_wallet_type = 'external' then 'External (Paystack/Expense)'
    when wle.destination_wallet_type = 'platform' then 'Platform (Gonasi)'
    when wle.destination_wallet_type = 'organization' then concat('Organization (', o.name, ')')
    when wle.destination_wallet_type = 'user' then 'User'
  end as destination_wallet,
  
  wle.amount,
  wle.currency_code,
  wle.status,
  
  -- Metadata insights
  wle.metadata->>'description' as description,
  wle.metadata->>'gross_amount' as gross_amount,
  wle.metadata->>'paystack_fee_deducted' as paystack_fee,
  wle.metadata->>'platform_fee_amount' as platform_fee,
  wle.metadata->>'payout_amount' as org_payout,
  wle.metadata->>'net_revenue' as platform_revenue,
  
  wle.created_at,
  wle.paystack_reference

from public.wallet_ledger_entries wle
left join public.organization_wallets ow on 
  (wle.source_wallet_id = ow.id and wle.source_wallet_type = 'organization')
  or (wle.destination_wallet_id = ow.id and wle.destination_wallet_type = 'organization')
left join public.organizations o on ow.organization_id = o.id
cross join payment_reference pr

where wle.paystack_reference = pr.ref

order by wle.created_at;


-- ============================================================================
-- WALLET BALANCE VERIFICATION
-- ============================================================================
-- Verify that wallet balances are correctly updated
-- ============================================================================

with payment_reference as (
  select '7f7ecc49-05ce-4a53-9f6a-72b65980bfd1'::text as ref
),
payment_details as (
  select
    metadata->>'organization_id' as org_id,
    currency_code
  from public.wallet_ledger_entries
  cross join payment_reference pr
  where paystack_reference = pr.ref
  limit 1
)

select
  'Platform Wallet' as wallet_name,
  gw.currency_code,
  gw.balance_total,
  gw.balance_reserved,
  gw.updated_at
from public.gonasi_wallets gw
cross join payment_details pd
where gw.currency_code = pd.currency_code

union all

select
  concat('Organization Wallet (', o.name, ')') as wallet_name,
  ow.currency_code,
  ow.balance_total,
  ow.balance_reserved,
  ow.updated_at
from public.organization_wallets ow
inner join public.organizations o on ow.organization_id = o.id
cross join payment_details pd
where ow.organization_id::text = pd.org_id
  and ow.currency_code = pd.currency_code;


-- ============================================================================
-- FINANCIAL SUMMARY
-- ============================================================================
-- Summary of money flow for a specific payment
-- ============================================================================

with payment_reference as (
  select '7f7ecc49-05ce-4a53-9f6a-72b65980bfd1'::text as ref
)

select
  paystack_reference,
  currency_code,
  
  -- Total amounts by transaction type
  sum(case when type = 'payment_inflow' then amount else 0 end) as net_settlement_received,
  sum(case when type = 'org_payout' then amount else 0 end) as organization_payout,
  sum(case when type = 'platform_revenue' then amount else 0 end) as platform_revenue,
  sum(case when type = 'payment_gateway_fee' then amount else 0 end) as gateway_fee,
  
  -- Validation: Platform net change should equal platform_revenue
  sum(case 
    when destination_wallet_type = 'platform' then amount 
    when source_wallet_type = 'platform' then -amount 
    else 0 
  end) as platform_balance_change,
  
  -- Should be zero (double-entry validation)
  sum(case when direction = 'credit' then amount else -amount end) as total_balance_check

from public.wallet_ledger_entries
cross join payment_reference pr
where paystack_reference = pr.ref
group by paystack_reference, currency_code;