-- ============================================================================
-- FUNCTION: process_course_payment_from_paystack (CORRECTED VERSION)
-- ============================================================================
-- PROPER DOUBLE-ENTRY ACCOUNTING WITH CORRECT WALLET FLOW
--
-- EXAMPLE: 100 KES course, 20% platform fee, 1.5 KES Paystack fee
--
-- LEDGER ENTRIES (4 entries for complete audit trail):
--   1. External → Platform: +98.50 KES (net settlement from Paystack)
--      - Type: 'payment_inflow'
--      - Description: Net payment received after Paystack deducted their fee
--
--   2. Platform → Organization: -80 KES (organization's share)
--      - Type: 'org_payout'
--      - Description: Course sale payout to organization
--
--   3. Platform → Platform: +18.50 KES (platform revenue recognition)
--      - Type: 'platform_revenue'
--      - Description: Platform's net income from transaction
--
--   4. Platform → Expense: -1.50 KES (Paystack fee expense)
--      - Type: 'payment_gateway_fee'
--      - Description: Payment gateway transaction fee (absorbed by platform)
--
-- WALLET BALANCE CHANGES:
--   - Platform: +98.50 - 80 = +18.50 KES ✓
--   - Organization: +80 KES ✓
--   - Total tracked: 100 KES ✓
-- ============================================================================

create or replace function public.process_course_payment_from_paystack(
    p_paystack_reference text,
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
    v_tier_is_free boolean;
    v_tier_currency public.currency_code;

    -- Amount calculations
    v_gross_amount numeric(19,4);
    v_net_settlement numeric(19,4);  -- What platform actually receives from Paystack
    v_platform_fee_amount numeric(19,4);
    v_org_payout numeric(19,4);
    v_platform_net_revenue numeric(19,4);

    -- Wallets
    v_platform_wallet_id uuid;
    v_org_wallet_id uuid;

    -- Ledger entries
    v_ledger_payment_inflow uuid;
    v_ledger_org_payout uuid;
    v_ledger_platform_revenue uuid;
    v_ledger_gateway_fee uuid;

    -- Enrollment
    v_enrollment_id uuid;
    v_access_start timestamptz := timezone('utc', now());
    v_activity_id uuid;
begin
    raise notice '========================================';
    raise notice '[PAYMENT] Processing Paystack payment: %', p_paystack_reference;

    -- =============================================================
    -- 1. Idempotency check
    -- =============================================================
    perform 1 from public.wallet_ledger_entries
    where paystack_reference = p_paystack_reference
    limit 1;

    if found then
        raise notice '[PAYMENT] ⚠️  Payment already processed: %', p_paystack_reference;
        return jsonb_build_object(
            'success', false,
            'message', 'Payment already processed',
            'paystack_reference', p_paystack_reference
        );
    end if;

    -- =============================================================
    -- 2. Validate course & organization
    -- =============================================================
    select pc.name, pc.organization_id
    into v_course_title, v_organization_id
    from public.published_courses pc
    where pc.id = p_published_course_id
      and pc.is_active = true;

    if not found then
        raise exception '[PAYMENT] Published course not found or inactive: %', p_published_course_id;
    end if;

    select o.tier into v_org_tier
    from public.organizations o
    where o.id = v_organization_id;

    select tl.platform_fee_percentage into v_platform_fee_percent
    from public.tier_limits tl
    where tl.tier = v_org_tier;

    raise notice '[PAYMENT] Organization: % (tier: %, platform fee: % %%)', 
        v_organization_id, v_org_tier, v_platform_fee_percent;

    -- =============================================================
    -- 3. Get pricing tier
    -- =============================================================
    select 
        pt.tier_name,
        pt.tier_description,
        pt.price,
        pt.promotional_price,
        pt.payment_frequency::public.payment_frequency,
        pt.is_free,
        pt.currency_code::public.currency_code
    into
        v_tier_name,
        v_tier_description,
        v_tier_price,
        v_tier_promotional_price,
        v_tier_frequency,
        v_tier_is_free,
        v_tier_currency
    from public.course_pricing_tiers pt
    where pt.course_id = p_published_course_id
      and pt.id = p_tier_id
      and pt.is_active = true;

    if not found then
        raise exception '[PAYMENT] Pricing tier not found - course: %, tier: %', 
            p_published_course_id, p_tier_id;
    end if;

    -- =============================================================
    -- 4. Determine final price
    -- =============================================================
    if v_tier_promotional_price is not null and v_tier_promotional_price < v_tier_price then
        v_gross_amount := v_tier_promotional_price;
    else
        v_gross_amount := v_tier_price;
    end if;

    if p_amount_paid != v_gross_amount then
        raise exception '[PAYMENT] Amount mismatch - expected: %, received: %', 
            v_gross_amount, p_amount_paid;
    end if;

    -- =============================================================
    -- 5. Get or create wallets
    -- =============================================================
    select gw.id into v_platform_wallet_id
    from public.gonasi_wallets gw
    where gw.currency_code = v_tier_currency;

    if not found then
        raise exception '[PAYMENT] Platform wallet not found for currency: %', v_tier_currency;
    end if;

    select ow.id into v_org_wallet_id
    from public.organization_wallets ow
    where ow.organization_id = v_organization_id
      and ow.currency_code = v_tier_currency;

    if not found then
        insert into public.organization_wallets (organization_id, currency_code)
        values (v_organization_id, v_tier_currency)
        returning id into v_org_wallet_id;
        
        raise notice '[PAYMENT] Created organization wallet: %', v_org_wallet_id;
    end if;

    -- =============================================================
    -- 6. Calculate distribution
    -- =============================================================
    v_platform_fee_amount := round(v_gross_amount * (v_platform_fee_percent / 100), 4);
    v_org_payout := v_gross_amount - v_platform_fee_amount;
    v_net_settlement := v_gross_amount - p_paystack_fee;
    v_platform_net_revenue := v_platform_fee_amount - p_paystack_fee;

    raise notice '[PAYMENT] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    raise notice '[PAYMENT] 💰 PAYMENT BREAKDOWN:';
    raise notice '[PAYMENT] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    raise notice '[PAYMENT]   Gross amount:          % %', v_gross_amount, v_tier_currency;
    raise notice '[PAYMENT]   Paystack fee:          -% %', p_paystack_fee, v_tier_currency;
    raise notice '[PAYMENT]   Net settlement:        % % (received by platform)', 
        v_net_settlement, v_tier_currency;
    raise notice '[PAYMENT] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    raise notice '[PAYMENT]   Platform fee (% %%):   % %', 
        v_platform_fee_percent, v_platform_fee_amount, v_tier_currency;
    raise notice '[PAYMENT]   Organization payout:   % %', v_org_payout, v_tier_currency;
    raise notice '[PAYMENT]   Platform net revenue:  % %', v_platform_net_revenue, v_tier_currency;
    raise notice '[PAYMENT] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

    -- Validation: Platform balance change should equal net revenue
    if (v_net_settlement - v_org_payout) != v_platform_net_revenue then
        raise exception '[PAYMENT] Balance calculation error: % - % != %',
            v_net_settlement, v_org_payout, v_platform_net_revenue;
    end if;

    -- =============================================================
    -- 7. Create ledger entries (4 entries for complete audit)
    -- =============================================================
    
    -- ENTRY 1: External → Platform (net settlement after Paystack fee)
    raise notice '[PAYMENT] 📝 Creating ledger entry 1/4: Payment inflow';
    insert into public.wallet_ledger_entries(
        source_wallet_type, source_wallet_id,
        destination_wallet_type, destination_wallet_id,
        currency_code, amount, direction, type, status,
        related_entity_type, related_entity_id, paystack_reference,
        metadata
    ) values (
        'external', null,
        'platform', v_platform_wallet_id,
        v_tier_currency, v_net_settlement, 'credit', 'payment_inflow', 'completed',
        'course', p_published_course_id, p_paystack_reference,
        jsonb_build_object(
            'description', 'Net payment received from Paystack (after gateway fee deduction)',
            'gross_amount', v_gross_amount,
            'paystack_fee_deducted', p_paystack_fee,
            'net_settlement', v_net_settlement,
            'paystack_transaction_id', p_paystack_transaction_id,
            'user_id', p_user_id,
            'organization_id', v_organization_id,
            'course_title', v_course_title,
            'tier_name', v_tier_name,
            'tier_id', p_tier_id,
            'payment_method', p_payment_method,
            'webhook_metadata', p_metadata
        )
    ) returning id into v_ledger_payment_inflow;

    -- ENTRY 2: Platform → Organization (org's share of sale)
    raise notice '[PAYMENT] 📝 Creating ledger entry 2/4: Organization payout';
    insert into public.wallet_ledger_entries(
        source_wallet_type, source_wallet_id,
        destination_wallet_type, destination_wallet_id,
        currency_code, amount, direction, type, status,
        related_entity_type, related_entity_id, paystack_reference,
        metadata
    ) values (
        'platform', v_platform_wallet_id,
        'organization', v_org_wallet_id,
        v_tier_currency, v_org_payout, 'debit', 'org_payout', 'completed',
        'course', p_published_course_id, p_paystack_reference,
        jsonb_build_object(
            'description', 'Course sale payout to organization',
            'organization_id', v_organization_id,
            'course_title', v_course_title,
            'tier_name', v_tier_name,
            'gross_sale_amount', v_gross_amount,
            'platform_fee_percent', v_platform_fee_percent,
            'platform_fee_deducted', v_platform_fee_amount,
            'payout_amount', v_org_payout,
            'source_ledger_entry', v_ledger_payment_inflow
        )
    ) returning id into v_ledger_org_payout;

    -- ENTRY 3: Platform → Platform (revenue recognition)
    raise notice '[PAYMENT] 📝 Creating ledger entry 3/4: Platform revenue';
    insert into public.wallet_ledger_entries(
        source_wallet_type, source_wallet_id,
        destination_wallet_type, destination_wallet_id,
        currency_code, amount, direction, type, status,
        related_entity_type, related_entity_id, paystack_reference,
        metadata
    ) values (
        'platform', v_platform_wallet_id,
        'platform', v_platform_wallet_id,
        v_tier_currency, v_platform_net_revenue, 'credit', 'platform_revenue', 'completed',
        'course', p_published_course_id, p_paystack_reference,
        jsonb_build_object(
            'description', 'Platform net revenue from course sale',
            'gross_amount', v_gross_amount,
            'platform_fee_amount', v_platform_fee_amount,
            'paystack_fee_amount', p_paystack_fee,
            'net_revenue', v_platform_net_revenue,
            'source_ledger_entry', v_ledger_payment_inflow
        )
    ) returning id into v_ledger_platform_revenue;

    -- ENTRY 4: Platform → Expense (Paystack fee expense tracking)
    raise notice '[PAYMENT] 📝 Creating ledger entry 4/4: Payment gateway fee';
    insert into public.wallet_ledger_entries(
        source_wallet_type, source_wallet_id,
        destination_wallet_type, destination_wallet_id,
        currency_code, amount, direction, type, status,
        related_entity_type, related_entity_id, paystack_reference,
        metadata
    ) values (
        'platform', v_platform_wallet_id,
        'external', null,
        v_tier_currency, p_paystack_fee, 'debit', 'payment_gateway_fee', 'completed',
        'course', p_published_course_id, p_paystack_reference,
        jsonb_build_object(
            'description', 'Payment gateway transaction fee (Paystack)',
            'paystack_transaction_id', p_paystack_transaction_id,
            'gateway', 'Paystack',
            'payment_method', p_payment_method,
            'source_ledger_entry', v_ledger_payment_inflow
        )
    ) returning id into v_ledger_gateway_fee;

    raise notice '[PAYMENT] ✅ All ledger entries created successfully';

    -- =============================================================
    -- 8. Enrollment: create or update
    -- =============================================================
    raise notice '[PAYMENT] 📚 Processing enrollment...';
    
    select id into v_enrollment_id
    from public.course_enrollments
    where user_id = p_user_id
      and published_course_id = p_published_course_id
    for update;

    if found then
        raise notice '[PAYMENT] Updating existing enrollment: %', v_enrollment_id;
        update public.course_enrollments
        set expires_at = v_access_start + interval '1 month',
            is_active = true,
            updated_at = timezone('utc', now())
        where id = v_enrollment_id;
    else
        raise notice '[PAYMENT] Creating new enrollment';
        insert into public.course_enrollments(
            user_id, published_course_id, organization_id,
            enrolled_at, expires_at, is_active
        ) values (
            p_user_id, p_published_course_id, v_organization_id,
            v_access_start, v_access_start + interval '1 month', true
        ) returning id into v_enrollment_id;
    end if;

    -- Log enrollment activity
    insert into public.course_enrollment_activities(
        enrollment_id, tier_name, tier_description, payment_frequency, currency_code,
        is_free, price_paid, promotional_price, was_promotional,
        access_start, access_end, created_by
    ) values (
        v_enrollment_id, v_tier_name, v_tier_description, v_tier_frequency, v_tier_currency,
        v_tier_is_free, v_gross_amount, v_tier_promotional_price,
        (v_tier_promotional_price is not null),
        v_access_start, v_access_start + interval '1 month', p_user_id
    ) returning id into v_activity_id;

    raise notice '[PAYMENT] ✅ Enrollment completed: %', v_enrollment_id;

    -- =============================================================
    -- 9. Return detailed summary
    -- =============================================================
    raise notice '[PAYMENT] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    raise notice '[PAYMENT] ✅ PAYMENT PROCESSING COMPLETE';
    raise notice '[PAYMENT] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    
    return jsonb_build_object(
        'success', true,
        'message', 'Course payment processed successfully',
        'enrollment', jsonb_build_object(
            'enrollment_id', v_enrollment_id,
            'enrollment_activity_id', v_activity_id,
            'user_id', p_user_id,
            'course_id', p_published_course_id,
            'course_title', v_course_title,
            'tier_name', v_tier_name,
            'access_start', v_access_start,
            'access_end', v_access_start + interval '1 month'
        ),
        'payment', jsonb_build_object(
            'paystack_reference', p_paystack_reference,
            'paystack_transaction_id', p_paystack_transaction_id,
            'gross_amount', v_gross_amount,
            'net_settlement', v_net_settlement,
            'currency', v_tier_currency,
            'payment_method', p_payment_method
        ),
        'distribution', jsonb_build_object(
            'gross_amount', v_gross_amount,
            'platform_fee_percent', v_platform_fee_percent,
            'platform_fee_amount', v_platform_fee_amount,
            'paystack_fee', p_paystack_fee,
            'net_settlement', v_net_settlement,
            'organization_payout', v_org_payout,
            'platform_net_revenue', v_platform_net_revenue
        ),
        'ledger_entries', jsonb_build_object(
            'payment_inflow', v_ledger_payment_inflow,
            'org_payout', v_ledger_org_payout,
            'platform_revenue', v_ledger_platform_revenue,
            'gateway_fee', v_ledger_gateway_fee
        )
    );

exception
    when others then
        raise exception '[PAYMENT] ❌ Payment processing failed: %', sqlerrm;
end;
$$;