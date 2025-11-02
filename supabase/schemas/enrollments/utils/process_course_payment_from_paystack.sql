-- ============================================================================
-- FUNCTION: process_course_payment_from_paystack
-- ============================================================================
-- DESCRIPTION:
--   Handles PAID course purchases made via Paystack.
--
--   Flow:
--      External → Organization → Platform → Paystack Fee
-- 
--   NOTE:
--      Free-course handling has been removed.
--      Free enrollments must now be handled by a separate function.
-- ============================================================================
create or replace function public.process_course_payment_from_paystack(
  p_payment_reference text,
  p_paystack_transaction_id text,
  p_user_id uuid,
  p_published_course_id uuid,
  p_tier_id uuid,
  p_amount_paid numeric(19,4),
  p_currency_code text,
  p_payment_method text default 'card',
  p_paystack_fee numeric(19,4) default 0,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    -- Course & org info
    v_course_title text;
    v_organization_id uuid;
    v_org_tier public.subscription_tier;
    v_platform_fee_percent numeric(5,2);

    -- Tier info
    v_tier_name text;
    v_tier_description text;
    v_tier_price numeric(19,4);
    v_tier_promotional_price numeric(19,4);
    v_tier_frequency public.payment_frequency;
    v_tier_currency public.currency_code;

    -- Amount calculations
    v_gross_amount numeric(19,4);
    v_platform_fee_amount numeric(19,4);
    v_org_payout numeric(19,4);
    v_net_settlement numeric(19,4);
    v_platform_net_revenue numeric(19,4);

    -- Wallets
    v_org_wallet_id uuid;
    v_platform_wallet_id uuid;

    -- Ledger
    v_ledger_payment_inflow uuid;
    v_ledger_org_to_platform uuid;
    v_ledger_gateway_fee uuid;

    -- Enrollment
    v_enrollment_id uuid;
    v_access_start timestamptz := timezone('utc', now());
    v_activity_id uuid;

    -- Purchase history
    v_purchase_id uuid;
begin
    ---------------------------------------------------------------
    -- Idempotency
    ---------------------------------------------------------------
    perform 1
    from public.wallet_ledger_entries
    where payment_reference = p_payment_reference
    limit 1;

    if found then
        return jsonb_build_object(
            'success', false,
            'message', 'Payment already processed',
            'payment_reference', p_payment_reference
        );
    end if;

    ---------------------------------------------------------------
    -- Validate course & organization
    ---------------------------------------------------------------
    select pc.name, pc.organization_id
    into v_course_title, v_organization_id
    from public.published_courses pc
    where pc.id = p_published_course_id
      and pc.is_active = true;

    if not found then
        raise exception 'Published course not found or inactive: %', p_published_course_id;
    end if;

    select o.tier into v_org_tier
    from public.organizations o
    where o.id = v_organization_id;

    select tl.platform_fee_percentage
    into v_platform_fee_percent
    from public.tier_limits tl
    where tl.tier = v_org_tier;

    ---------------------------------------------------------------
    -- Get paid pricing tier
    ---------------------------------------------------------------
    select 
        pt.tier_name,
        pt.tier_description,
        pt.price,
        pt.promotional_price,
        pt.payment_frequency::public.payment_frequency,
        pt.currency_code::public.currency_code
    into
        v_tier_name,
        v_tier_description,
        v_tier_price,
        v_tier_promotional_price,
        v_tier_frequency,
        v_tier_currency
    from public.course_pricing_tiers pt
    where pt.course_id = p_published_course_id
      and pt.id = p_tier_id
      and pt.is_active = true
      and pt.is_free = false;

    if not found then
        raise exception 'Paid pricing tier not found: %', p_tier_id;
    end if;

    ---------------------------------------------------------------
    -- Determine actual price charged
    ---------------------------------------------------------------
    if v_tier_promotional_price is not null
       and v_tier_promotional_price < v_tier_price then
        v_gross_amount := v_tier_promotional_price;
    else
        v_gross_amount := v_tier_price;
    end if;

    if p_amount_paid != v_gross_amount then
        raise exception 'Amount mismatch. Expected %, received %',
            v_gross_amount, p_amount_paid;
    end if;

    ---------------------------------------------------------------
    -- Ensure wallets exist
    ---------------------------------------------------------------
    select ow.id
    into v_org_wallet_id
    from public.organization_wallets ow
    where ow.organization_id = v_organization_id
      and ow.currency_code = v_tier_currency;

    if not found then
        insert into public.organization_wallets (organization_id, currency_code)
        values (v_organization_id, v_tier_currency)
        returning id into v_org_wallet_id;
    end if;

    select gw.id
    into v_platform_wallet_id
    from public.gonasi_wallets gw
    where gw.currency_code = v_tier_currency;

    if not found then
        raise exception 'Platform wallet missing for currency: %', v_tier_currency;
    end if;

    ---------------------------------------------------------------
    -- Compute distribution
    ---------------------------------------------------------------
    v_net_settlement := v_gross_amount - p_paystack_fee;
    v_platform_fee_amount := round(v_gross_amount * (v_platform_fee_percent / 100), 4);
    v_org_payout := v_gross_amount - v_platform_fee_amount;
    v_platform_net_revenue := v_platform_fee_amount - p_paystack_fee;

    ---------------------------------------------------------------
    -- PAYMENT FLOW
    ---------------------------------------------------------------

    -- External → Organization
    update public.organization_wallets
    set balance_total = balance_total + v_gross_amount,
        updated_at = timezone('utc', now())
    where id = v_org_wallet_id;

    insert into public.wallet_ledger_entries(
        source_wallet_type, source_wallet_id,
        destination_wallet_type, destination_wallet_id,
        currency_code, amount, direction, type, status,
        related_entity_type, related_entity_id,
        payment_reference, metadata
    ) values (
        'external', null,
        'organization', v_org_wallet_id,
        v_tier_currency, v_gross_amount, 'credit', 'payment_inflow', 'completed',
        'course', p_published_course_id,
        p_payment_reference,
        jsonb_build_object(
            'description', 'External payment received via Paystack',
            'user_id', p_user_id,
            'course_title', v_course_title,
            'tier_name', v_tier_name,
            'payment_method', p_payment_method,
            'gross_amount', v_gross_amount
        )
    ) returning id into v_ledger_payment_inflow;

    -- Organization → Platform
    update public.organization_wallets
    set balance_total = balance_total - v_platform_fee_amount,
        updated_at = timezone('utc', now())
    where id = v_org_wallet_id;

    update public.gonasi_wallets
    set balance_total = balance_total + v_platform_fee_amount,
        updated_at = timezone('utc', now())
    where id = v_platform_wallet_id;

    insert into public.wallet_ledger_entries(
        source_wallet_type, source_wallet_id,
        destination_wallet_type, destination_wallet_id,
        currency_code, amount, direction, type, status,
        related_entity_type, related_entity_id,
        payment_reference, metadata
    ) values (
        'organization', v_org_wallet_id,
        'platform', v_platform_wallet_id,
        v_tier_currency, v_platform_fee_amount, 'debit', 'platform_revenue', 'completed',
        'course', p_published_course_id,
        p_payment_reference,
        jsonb_build_object(
            'description', 'Platform fee deducted from organization payout',
            'platform_fee_percent', v_platform_fee_percent,
            'platform_fee_amount', v_platform_fee_amount,
            'gross_amount', v_gross_amount,
            'org_net_payout', v_org_payout
        )
    ) returning id into v_ledger_org_to_platform;

    -- Platform → Paystack
    if p_paystack_fee > 0 then
        update public.gonasi_wallets
        set balance_total = balance_total - p_paystack_fee,
            updated_at = timezone('utc', now())
        where id = v_platform_wallet_id;

        insert into public.wallet_ledger_entries(
            source_wallet_type, source_wallet_id,
            destination_wallet_type, destination_wallet_id,
            currency_code, amount, direction, type, status,
            related_entity_type, related_entity_id,
            payment_reference, metadata
        ) values (
            'platform', v_platform_wallet_id,
            'external', null,
            v_tier_currency, p_paystack_fee, 'debit', 'payment_gateway_fee', 'completed',
            'course', p_published_course_id,
            p_payment_reference,
            jsonb_build_object(
                'description', 'Payment gateway fee paid to Paystack',
                'gateway', 'Paystack',
                'payment_method', p_payment_method,
                'platform_net_revenue', v_platform_net_revenue
            )
        ) returning id into v_ledger_gateway_fee;
    end if;

    ---------------------------------------------------------------
    -- Enrollment (PAID ONLY)
    ---------------------------------------------------------------
    select id
    into v_enrollment_id
    from public.course_enrollments
    where user_id = p_user_id
      and published_course_id = p_published_course_id
    for update;

    if found then
        update public.course_enrollments
        set expires_at = v_access_start + interval '1 month',
            is_active = true,
            updated_at = timezone('utc', now())
        where id = v_enrollment_id;
    else
        insert into public.course_enrollments(
            user_id, published_course_id, organization_id,
            enrolled_at, expires_at, is_active
        ) values (
            p_user_id, p_published_course_id, v_organization_id,
            v_access_start, v_access_start + interval '1 month', true
        ) returning id into v_enrollment_id;
    end if;

    insert into public.course_enrollment_activities(
        enrollment_id, tier_name, tier_description, payment_frequency,
        currency_code, is_free, price_paid, promotional_price, was_promotional,
        access_start, access_end, created_by
    ) values (
        v_enrollment_id, v_tier_name, v_tier_description, v_tier_frequency,
        v_tier_currency, false, v_gross_amount, v_tier_promotional_price,
        (v_tier_promotional_price is not null),
        v_access_start, v_access_start + interval '1 month', p_user_id
    ) returning id into v_activity_id;

    ---------------------------------------------------------------
    -- Purchase History
    ---------------------------------------------------------------
    insert into public.user_purchases (
        user_id, published_course_id, amount_paid, currency_code,
        payment_reference, transaction_type, purchased_at, metadata
    ) values (
        p_user_id, p_published_course_id, v_gross_amount, v_tier_currency,
        p_payment_reference, 'course_purchase', timezone('utc', now()),
        jsonb_build_object(
            'course_title', v_course_title,
            'tier_id', p_tier_id,
            'tier_name', v_tier_name,
            'tier_description', v_tier_description,
            'payment_frequency', v_tier_frequency,
            'original_price', v_tier_price,
            'promotional_price', v_tier_promotional_price,
            'was_promotional', (v_tier_promotional_price is not null and v_tier_promotional_price < v_tier_price),
            'payment_method', p_payment_method,
            'paystack_transaction_id', p_paystack_transaction_id,
            'gross_amount', v_gross_amount,
            'paystack_fee', p_paystack_fee,
            'platform_fee_percent', v_platform_fee_percent,
            'platform_fee_amount', v_platform_fee_amount,
            'organization_payout', v_org_payout,
            'organization_id', v_organization_id,
            'organization_tier', v_org_tier,
            'enrollment_id', v_enrollment_id,
            'activity_id', v_activity_id,
            'access_start', v_access_start,
            'access_end', v_access_start + interval '1 month',
            'user_metadata', p_metadata,
            'processed_at', timezone('utc', now())
        )
    ) returning id into v_purchase_id;

    ---------------------------------------------------------------
    -- Return summary
    ---------------------------------------------------------------
    return jsonb_build_object(
        'success', true,
        'message', 'Paid course purchase processed successfully',
        'enrollment', jsonb_build_object(
            'enrollment_id', v_enrollment_id,
            'activity_id', v_activity_id,
            'user_id', p_user_id,
            'course_title', v_course_title,
            'tier_name', v_tier_name,
            'access_start', v_access_start,
            'access_end', v_access_start + interval '1 month'
        ),
        'payment', jsonb_build_object(
            'reference', p_payment_reference,
            'transaction_id', p_paystack_transaction_id,
            'gross_amount', v_gross_amount,
            'currency', v_tier_currency,
            'payment_method', p_payment_method
        ),
        'distribution', jsonb_build_object(
            'gross_amount', v_gross_amount,
            'paystack_fee', p_paystack_fee,
            'net_settlement', v_net_settlement,
            'platform_fee_percent', v_platform_fee_percent,
            'platform_fee_amount', v_platform_fee_amount,
            'organization_payout', v_org_payout,
            'platform_net_revenue', v_platform_net_revenue
        ),
        'ledger_entries', jsonb_build_object(
            'payment_inflow', v_ledger_payment_inflow,
            'platform_revenue', v_ledger_org_to_platform,
            'gateway_fee', v_ledger_gateway_fee
        ),
        'purchase', jsonb_build_object('purchase_id', v_purchase_id)
    );

exception
    when others then
        raise exception 'Payment processing failed: %', sqlerrm;
end;
$$;
