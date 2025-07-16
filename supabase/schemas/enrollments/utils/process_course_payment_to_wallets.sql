-- ============================================================================
-- FUNCTION: process_course_payment_to_wallets
-- ============================================================================
-- Description:
--   Processes a successful course payment by updating organization and Gonasi wallets
--   and recording the corresponding wallet transactions. This function should be called
--   immediately after a course payment is recorded in the course_payments table.
--
--   This function:
--     - Creates/updates organization wallet balance (adds org payout)
--     - Creates/updates Gonasi wallet balance (adds platform fee)
--     - Records wallet transaction for organization (payout credit)
--     - Records wallet transaction for Gonasi (platform fee credit)
--     - Returns detailed operation summary for debugging
-- ============================================================================
create or replace function public.process_course_payment_to_wallets(
  p_payment_id uuid,
  p_organization_id uuid,
  p_published_course_id uuid,
  p_user_id uuid,
  p_tier_name text,
  p_currency_code text,
  p_gross_amount numeric(19,4),
  p_platform_fee numeric(19,4),
  p_org_payout numeric(19,4),
  p_platform_fee_percent numeric(5,2),
  p_created_by uuid default null
) returns jsonb
as $$
declare
  org_wallet_id uuid;
  gonasi_wallet_id uuid;
  org_transaction_id uuid;
  gonasi_transaction_id uuid;
  org_wallet_existed boolean := false;
  gonasi_wallet_existed boolean := false;
begin
  -- Validate that the payment exists
  if not exists (
    select 1 from public.course_payments 
    where id = p_payment_id
  ) then
    raise exception 'Payment ID % not found', p_payment_id;
  end if;

  -- Validate amounts
  if p_gross_amount != (p_platform_fee + p_org_payout) then
    raise exception 'Amount validation failed: gross (%) != platform_fee (%) + org_payout (%)', 
      p_gross_amount, p_platform_fee, p_org_payout;
  end if;

  -- Check if organization wallet already exists
  select id into org_wallet_id
  from public.organization_wallets
  where organization_id = p_organization_id 
    and currency_code = p_currency_code::public.currency_code;
  
  if found then
    org_wallet_existed := true;
  end if;

  -- Check if Gonasi wallet already exists
  select id into gonasi_wallet_id
  from public.gonasi_wallets
  where currency_code = p_currency_code::public.currency_code;
  
  if found then
    gonasi_wallet_existed := true;
  end if;

  -- STEP 1: Create/Update Organization Wallet
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
    available_balance = organization_wallets.available_balance + excluded.available_balance,
    updated_at = timezone('utc', now())
  returning id into org_wallet_id;

  -- STEP 2: Create/Update Gonasi Wallet
  insert into public.gonasi_wallets (
    currency_code,
    available_balance
  ) values (
    p_currency_code::public.currency_code,
    p_platform_fee
  )
  on conflict (currency_code)
  do update set
    available_balance = gonasi_wallets.available_balance + excluded.available_balance,
    updated_at = timezone('utc', now())
  returning id into gonasi_wallet_id;

  -- STEP 3: Record Organization Wallet Transaction
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
      'platform_fee_deducted', p_platform_fee,
      'fee_percentage', p_platform_fee_percent,
      'wallet_existed_before', org_wallet_existed
    ),
    coalesce(p_created_by, p_user_id)
  ) returning id into org_transaction_id;

  -- STEP 4: Record Gonasi Wallet Transaction
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
    p_platform_fee,
    p_payment_id,
    jsonb_build_object(
      'organization_id', p_organization_id,
      'course_id', p_published_course_id,
      'user_id', p_user_id,
      'tier_name', p_tier_name,
      'fee_percentage', p_platform_fee_percent,
      'gross_payment', p_gross_amount,
      'org_payout', p_org_payout,
      'wallet_existed_before', gonasi_wallet_existed
    )
  ) returning id into gonasi_transaction_id;

  -- STEP 5: Return detailed operation summary
  return jsonb_build_object(
    'success', true,
    'message', 'Wallet balances updated successfully',
    'payment_id', p_payment_id,
    'wallets_updated', jsonb_build_object(
      'organization', jsonb_build_object(
        'wallet_id', org_wallet_id,
        'amount_added', p_org_payout,
        'currency', p_currency_code,
        'existed_before', org_wallet_existed
      ),
      'gonasi', jsonb_build_object(
        'wallet_id', gonasi_wallet_id,
        'amount_added', p_platform_fee,
        'currency', p_currency_code,
        'existed_before', gonasi_wallet_existed
      )
    ),
    'transactions_created', jsonb_build_object(
      'organization_transaction_id', org_transaction_id,
      'gonasi_transaction_id', gonasi_transaction_id
    ),
    'breakdown', jsonb_build_object(
      'gross_amount', p_gross_amount,
      'platform_fee', p_platform_fee,
      'platform_fee_percent', p_platform_fee_percent,
      'org_payout', p_org_payout
    )
  );

exception
  when others then
    -- Log the error and re-raise with context
    raise exception 'Failed to process payment to wallets for payment_id %: %', 
      p_payment_id, SQLERRM;
end;
$$ language plpgsql
set search_path = '';

