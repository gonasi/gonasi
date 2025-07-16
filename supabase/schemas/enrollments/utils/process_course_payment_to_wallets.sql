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
--     - Creates/updates Gonasi wallet balance (adds net platform fee after transaction fees)
--     - Records wallet transaction for organization (payout credit)
--     - Records wallet transaction for Gonasi (platform fee credit)
--     - Returns detailed operation summary including transaction fee breakdown
--
--   Note: Transaction fees (Paystack, etc.) are absorbed by Gonasi's platform fee,
--         not deducted from the organization's payout.
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
  p_platform_fee_from_net_amount numeric(19,4),
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
  platform_fee_calculated := net_payment * (p_platform_fee_percent / 100);

  -- STEP 2: Validate internal consistency
  if abs((p_platform_fee_from_net_amount + p_org_payout) - net_payment) > 0.01 then
    raise exception 'Amount validation failed: net_payment (%) != platform_fee_from_net_amount (%) + org_payout (%)', 
      net_payment, p_platform_fee_from_net_amount, p_org_payout;
  end if;

  if p_platform_fee_from_net_amount > platform_fee_calculated then
    raise exception 'Platform fee validation failed: declared platform fee (%) cannot exceed calculated fee (%)',
      p_platform_fee_from_net_amount, platform_fee_calculated;
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

  -- STEP 5: Update Gonasi Wallet
  insert into public.gonasi_wallets (
    currency_code,
    available_balance
  ) values (
    p_currency_code::public.currency_code,
    p_platform_fee_from_net_amount
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
      'platform_fee_from_net', p_platform_fee_from_net_amount,
      'fee_percentage', p_platform_fee_percent,
      'wallet_existed_before', org_wallet_existed,
      'note', 'Organization payout - transaction fees absorbed by platform'
    ),
    coalesce(p_created_by, p_user_id)
  ) returning id into org_transaction_id;

  -- STEP 7: Log Gonasi Wallet Transaction
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
    p_platform_fee_from_net_amount,
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
      'platform_fee_from_net', p_platform_fee_from_net_amount,
      'org_payout', p_org_payout,
      'wallet_existed_before', gonasi_wallet_existed,
      'note', 'Platform fee after absorbing transaction fees'
    )
  ) returning id into gonasi_transaction_id;

  -- STEP 8: Return summary
  return jsonb_build_object(
    'success', true,
    'message', 'Wallet balances updated successfully with transaction fees absorbed by platform',
    'payment_id', p_payment_id,
    'wallets_updated', jsonb_build_object(
      'organization', jsonb_build_object(
        'wallet_id', org_wallet_id,
        'amount_added', p_org_payout,
        'currency', p_currency_code,
        'existed_before', org_wallet_existed,
        'note', 'Full payout - no transaction fees deducted'
      ),
      'gonasi', jsonb_build_object(
        'wallet_id', gonasi_wallet_id,
        'amount_added', p_platform_fee_from_net_amount,
        'currency', p_currency_code,
        'existed_before', gonasi_wallet_existed,
        'note', 'Platform fee after absorbing transaction fees'
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
      'platform_fee_calculated', platform_fee_calculated,
      'platform_fee_from_net', p_platform_fee_from_net_amount,
      'platform_fee_percent', p_platform_fee_percent,
      'org_payout', p_org_payout,
      'transaction_fees_absorbed_by', 'gonasi_platform_fee'
    )
  );

exception
  when others then
    raise exception 'Failed to process payment to wallets for payment_id %: %', 
      p_payment_id, SQLERRM;
end;
$$;
