-- ==========================================================================
-- FUNCTION: process_subscription_payment
-- ==========================================================================
-- PURPOSE:
--   Processes organization subscription payments from Paystack webhooks.
--   Inserts ledger entries for audit trail.
--   Wallet balances are updated automatically by trg_wallet_balance_update.
--
-- SECURITY:
--   - security definer
--   - set search_path = '' (fully-qualified references required)
--
-- LEDGER DESIGN:
--   1. subscription_payment → gross payment credited to platform
--   2. payment_gateway_fee → fee debited from platform
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
  -- STEP 2: Validate organization subscription
  -- =====================================================
  select id
  into v_subscription_id
  from public.organization_subscriptions
  where organization_id = p_organization_id
    and status in ('active','attention')
  limit 1;

  if v_subscription_id is null then
    raise exception 'No active subscription found for organization: %', p_organization_id;
  end if;

  -- =====================================================
  -- STEP 3: Ensure platform wallet exists
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
  -- STEP 4: Create Ledger Entries
  -- =====================================================

  -- Subscription payment (gross inflow)
  insert into public.wallet_ledger_entries(
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
  ) values (
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
    'organization_subscription',
    v_subscription_id,
    jsonb_build_object(
      'source', 'paystack',
      'organization_id', p_organization_id,
      'subscription_id', v_subscription_id,
      'gross_amount', p_amount_paid,
      'webhook_metadata', p_metadata
    )
  );

  -- Paystack fee deduction (debit)
  if p_paystack_fee > 0 then
    insert into public.wallet_ledger_entries(
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
    ) values (
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
      'organization_subscription',
      v_subscription_id,
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
  -- STEP 5: Update subscription period (monthly)
  -- =====================================================
  update public.organization_subscriptions
  set
    status = 'active',
    current_period_start = coalesce(current_period_end, now()),
    current_period_end = coalesce(current_period_end, now()) + interval '1 month',
    updated_at = now()
  where id = v_subscription_id;

  -- =====================================================
  -- STEP 6: Return Success Response
  -- =====================================================
  return jsonb_build_object(
    'success', true,
    'message', 'Subscription payment processed successfully',
    'subscription_id', v_subscription_id,
    'organization_id', p_organization_id,
    'payment_reference', p_payment_reference,
    'gross_amount', p_amount_paid,
    'paystack_fee', p_paystack_fee,
    'net_platform_revenue', v_net,
    'currency_code', p_currency_code,
    'ledger_entries_created', 1 + (case when p_paystack_fee>0 then 1 else 0 end),
    'platform_wallet', v_platform_wallet_id
  );

exception
  when others then
    raise exception 'Error processing subscription payment: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
end;
$$;

-- ==========================================================================
-- GRANT EXECUTE PERMISSION
-- ==========================================================================
grant execute on function public.process_subscription_payment to service_role;

comment on function public.process_subscription_payment is
  'Processes subscription payments from Paystack. '
  'Inserts ledger entries: subscription_payment (gross inflow) and payment_gateway_fee (debit). '
  'Wallet balances are updated automatically by trg_wallet_balance_update. '
  'Security definer with empty search_path for safe execution.';
