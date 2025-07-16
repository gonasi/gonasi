-- ============================================================================
-- FUNCTION: process_course_payment_to_wallets
-- ============================================================================
-- Description:
--   Processes a successful course payment by updating organization and Gonasi wallets
--   and recording the corresponding wallet transactions. This function should be called
--   immediately after a course payment is recorded in the course_payments table.
--
--   Updated calculation model:
--     - Organization gets: user_payment - (user_payment * platform_fee%)
--     - Gonasi gets: (user_payment * platform_fee%) - transaction_fees
--     - Transaction fees are absorbed by Gonasi, not deducted from org payout
--
--   This function:
--     - Creates/updates organization wallet balance (adds org payout)
--     - Creates/updates Gonasi wallet balance (adds platform fee minus transaction fees)
--     - Records wallet transaction for organization (payout credit)
--     - Records wallet transaction for Gonasi (platform fee credit minus transaction fees)
--     - Returns detailed operation summary including transaction fee breakdown
-- ============================================================================
create or replace function public.process_course_payment_to_wallets(
  p_payment_id uuid,
  p_organization_id uuid,
  p_published_course_id uuid,
  p_user_id uuid,
  p_tier_name text,
  p_currency_code text,
  p_gross_amount numeric(19,4),
  p_payment_processor_fee numeric(19,4),
  p_platform_fee_from_gross numeric(19,4),
  p_org_payout numeric(19,4),
  p_platform_fee_percent numeric(5,2),
  p_created_by uuid default null
) 
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  org_wallet_id uuid;
  gonasi_wallet_id uuid;
  org_transaction_id uuid;
  gonasi_transaction_id uuid;
  org_wallet_existed boolean := false;
  gonasi_wallet_existed boolean := false;
  net_payment numeric(19,4);
  gonasi_actual_income numeric(19,4);
  platform_fee_calculated numeric(19,4);
begin
  -- STEP 0: Validate that the payment exists
  if not exists (
    select 1 from public.course_payments 
    where id = p_payment_id
  ) then
    raise exception 'Payment ID % not found', p_payment_id;
  end if;

  -- STEP 1: Derive key amounts
  net_payment := p_gross_amount - p_payment_processor_fee;
  platform_fee_calculated := p_gross_amount * (p_platform_fee_percent / 100);
  gonasi_actual_income := p_platform_fee_from_gross - p_payment_processor_fee;

  -- STEP 2: Validate internal consistency
  if abs((p_platform_fee_from_gross + p_org_payout) - p_gross_amount) > 0.01 then
    raise exception 'Amount validation failed: gross_amount (%) != platform_fee_from_gross (%) + org_payout (%)', 
      p_gross_amount, p_platform_fee_from_gross, p_org_payout;
  end if;

  if abs(p_platform_fee_from_gross - platform_fee_calculated) > 0.01 then
    raise exception 'Platform fee validation failed: declared platform fee (%) != calculated fee (%)',
      p_platform_fee_from_gross, platform_fee_calculated;
  end if;

  -- STEP 3: Fetch or create wallets
  select id into org_wallet_id
  from public.organization_wallets
  where organization_id = p_organization_id 
    and currency_code = p_currency_code::public.currency_code;

  if found then
    org_wallet_existed := true;
  end if;

  select id into gonasi_wallet_id
  from public.gonasi_wallets
  where currency_code = p_currency_code::public.currency_code;

  if found then
    gonasi_wallet_existed := true;
  end if;

  -- STEP 4: Update Organization Wallet
  insert into public.organization_wallets (
    organization_id,
    currency_code,
    available_balance
  ) values (
    p_organization_id,
    p_currency_code::public.currency_code,
    p_org_payout
  )
  on conflict (organization_id, currency_code)
  do update set
    available_balance = public.organization_wallets.available_balance + excluded.available_balance,
    updated_at = timezone('utc', now())
  returning id into org_wallet_id;

  -- STEP 5: Update Gonasi Wallet (with actual income after transaction fees)
  insert into public.gonasi_wallets (
    currency_code,
    available_balance
  ) values (
    p_currency_code::public.currency_code,
    gonasi_actual_income
  )
  on conflict (currency_code)
  do update set
    available_balance = public.gonasi_wallets.available_balance + excluded.available_balance,
    updated_at = timezone('utc', now())
  returning id into gonasi_wallet_id;

  -- STEP 6: Log Organization Wallet Transaction
  insert into public.wallet_transactions (
    wallet_id,
    type,
    amount,
    direction,
    course_payment_id,
    metadata,
    created_by
  ) values (
    org_wallet_id,
    'payout',
    p_org_payout,
    'credit',
    p_payment_id,
    jsonb_build_object(
      'course_id', p_published_course_id,
      'user_id', p_user_id,
      'tier_name', p_tier_name,
      'gross_payment', p_gross_amount,
      'processor_fee', p_payment_processor_fee,
      'net_payment', net_payment,
      'platform_fee_calculated', platform_fee_calculated,
      'platform_fee_from_gross', p_platform_fee_from_gross,
      'fee_percentage', p_platform_fee_percent,
      'gonasi_actual_income', gonasi_actual_income,
      'wallet_existed_before', org_wallet_existed,
      'note', 'Organization payout = gross_payment - platform_fee% (transaction fees absorbed by Gonasi)'
    ),
    coalesce(p_created_by, p_user_id)
  ) returning id into org_transaction_id;

  -- STEP 7: Log Gonasi Wallet Transaction (actual income after transaction fees)
  insert into public.gonasi_wallet_transactions (
    wallet_id,
    type,
    direction,
    amount,
    course_payment_id,
    metadata
  ) values (
    gonasi_wallet_id,
    'platform_fee',
    'credit',
    gonasi_actual_income,
    p_payment_id,
    jsonb_build_object(
      'organization_id', p_organization_id,
      'course_id', p_published_course_id,
      'user_id', p_user_id,
      'tier_name', p_tier_name,
      'fee_percentage', p_platform_fee_percent,
      'gross_payment', p_gross_amount,
      'processor_fee', p_payment_processor_fee,
      'net_payment', net_payment,
      'platform_fee_calculated', platform_fee_calculated,
      'platform_fee_from_gross', p_platform_fee_from_gross,
      'gonasi_actual_income', gonasi_actual_income,
      'org_payout', p_org_payout,
      'wallet_existed_before', gonasi_wallet_existed,
      'note', 'Platform fee after absorbing transaction fees = platform_fee_from_gross - processor_fee'
    )
  ) returning id into gonasi_transaction_id;

  -- STEP 8: Return summary
  return jsonb_build_object(
    'success', true,
    'message', 'Wallet balances updated successfully with new calculation model',
    'payment_id', p_payment_id,
    'wallets_updated', jsonb_build_object(
      'organization', jsonb_build_object(
        'wallet_id', org_wallet_id,
        'amount_added', p_org_payout,
        'currency', p_currency_code,
        'existed_before', org_wallet_existed,
        'calculation', format('gross_payment - platform_fee%% = %s - %s = %s', 
          p_gross_amount, p_platform_fee_from_gross, p_org_payout)
      ),
      'gonasi', jsonb_build_object(
        'wallet_id', gonasi_wallet_id,
        'amount_added', gonasi_actual_income,
        'currency', p_currency_code,
        'existed_before', gonasi_wallet_existed,
        'calculation', format('platform_fee - processor_fee = %s - %s = %s', 
          p_platform_fee_from_gross, p_payment_processor_fee, gonasi_actual_income)
      )
    ),
    'transactions_created', jsonb_build_object(
      'organization_transaction_id', org_transaction_id,
      'gonasi_transaction_id', gonasi_transaction_id
    ),
    'fee_breakdown', jsonb_build_object(
      'gross_amount', p_gross_amount,
      'processor_fee', p_payment_processor_fee,
      'net_payment', net_payment,
      'platform_fee_percent', p_platform_fee_percent,
      'platform_fee_from_gross', p_platform_fee_from_gross,
      'org_payout', p_org_payout,
      'gonasi_actual_income', gonasi_actual_income,
      'calculation_model', 'org_payout = gross - platform_fee%, gonasi = platform_fee% - processor_fee'
    )
  );

exception
  when others then
    raise exception 'Failed to process payment to wallets for payment_id %: %', 
      p_payment_id, SQLERRM;
end;
$$;