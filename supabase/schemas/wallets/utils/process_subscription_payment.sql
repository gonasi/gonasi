-- ==========================================================================
-- FUNCTION: process_subscription_payment
-- ==========================================================================
-- PURPOSE:
--   Processes Paystack subscription payments.
--   Creates wallet ledger entries for audit trail and financial reporting.
--   ❌ Does NOT touch organization_subscriptions (handled by subscription.create webhook)
--
-- SECURITY:
--   - SECURITY DEFINER
--   - search_path = ''
-- ==========================================================================

create or replace function public.process_subscription_payment(
  p_payment_reference text,
  p_organization_id uuid,
  p_amount_paid numeric(19,4),
  p_currency_code public.currency_code,
  p_paystack_fee numeric(19,4),
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_subscription_id uuid;
  v_platform_wallet_id uuid;
  v_net numeric := p_amount_paid - p_paystack_fee;
begin
  -- =====================================================
  -- STEP 1: Idempotency check
  -- =====================================================
  if exists (
    select 1
    from public.wallet_ledger_entries
    where payment_reference = p_payment_reference
      and type = 'subscription_payment'
  ) then
    return jsonb_build_object(
      'success', true,
      'message', 'Payment already processed (idempotent)',
      'payment_reference', p_payment_reference,
      'duplicate', true
    );
  end if;

  -- =====================================================
  -- STEP 2: Ensure platform wallet exists
  -- =====================================================
  insert into public.gonasi_wallets(currency_code)
  values (p_currency_code)
  on conflict (currency_code) do nothing;

  select id
  into v_platform_wallet_id
  from public.gonasi_wallets
  where currency_code = p_currency_code;

  if v_platform_wallet_id is null then
    raise exception 'Platform wallet not found for currency: %', p_currency_code;
  end if;

  -- =====================================================
  -- STEP 3: Ledger entry: subscription_payment (credit)
  -- =====================================================
  insert into public.wallet_ledger_entries (
    source_wallet_type,
    source_wallet_id,
    destination_wallet_type,
    destination_wallet_id,
    currency_code,
    amount,
    direction,
    payment_reference,
    type,
    status,
    related_entity_type,
    related_entity_id,
    metadata
  )
  values (
    'external',
    null,
    'platform',
    v_platform_wallet_id,
    p_currency_code,
    p_amount_paid,
    'credit',
    p_payment_reference,
    'subscription_payment',
    'completed',
    'organization',
    p_organization_id,
    jsonb_build_object(
      'source', 'paystack',
      'organization_id', p_organization_id,
      'gross_amount', p_amount_paid,
      'webhook_metadata', p_metadata
    )
  );

  -- =====================================================
  -- STEP 4: Ledger entry: payment_gateway_fee (debit)
  -- =====================================================
  if p_paystack_fee > 0 then
    insert into public.wallet_ledger_entries (
      source_wallet_type,
      source_wallet_id,
      destination_wallet_type,
      destination_wallet_id,
      currency_code,
      amount,
      direction,
      payment_reference,
      type,
      status,
      related_entity_type,
      related_entity_id,
      metadata
    )
    values (
      'platform',
      v_platform_wallet_id,
      'external',
      null,
      p_currency_code,
      p_paystack_fee,
      'debit',
      p_payment_reference,
      'payment_gateway_fee',
      'completed',
      'organization',
      p_organization_id,
      jsonb_build_object(
        'destination', 'paystack',
        'fee_type', 'subscription_payment',
        'organization_id', p_organization_id,
        'gross_amount', p_amount_paid,
        'net_revenue', v_net,
        'webhook_metadata', p_metadata
      )
    );
  end if;

  -- =====================================================
  -- STEP 5: Return response
  -- =====================================================
  return jsonb_build_object(
    'success', true,
    'message', 'Subscription payment recorded',
    'payment_reference', p_payment_reference,
    'organization_id', p_organization_id,
    'gross_amount', p_amount_paid,
    'paystack_fee', p_paystack_fee,
    'net_platform_revenue', v_net,
    'currency_code', p_currency_code
  );

exception
  when others then
    raise exception 'Error processing subscription payment: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
end;
$$;

comment on function public.process_subscription_payment is
  'Handles Paystack subscription payments: creates ledger entries only. '
  'Does not update organization_subscriptions — handled by subscription.create webhook.';
