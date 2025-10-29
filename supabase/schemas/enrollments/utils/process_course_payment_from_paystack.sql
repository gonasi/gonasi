-- ============================================================================
-- FUNCTION: process_course_payment_from_paystack
-- ============================================================================
-- DESCRIPTION:
--   Handles a complete course payment from Paystack:
--     1. Validates payment and course/tier details.
--     2. Determines correct price (promotional or standard).
--     3. Calculates distribution: organization payout, platform fee, Paystack fee.
--     4. Creates ledger entries (External → Platform → Organization/Paystack).
--     5. Updates course enrollment and always logs an enrollment activity.
--     6. Returns detailed summary of payment and ledger entries.
--
-- NOTES:
--   - This function is meant to be idempotent: duplicate paystack_reference are ignored.
--   - Platform fee % is read from tier_limits based on organization tier.
--   - Enrollment is updated if exists; otherwise, created.
--   - All wallet updates are handled via trigger (update_wallet_balance).
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
    v_final_amount numeric(19,4);
    v_platform_fee_amount numeric(19,4);
    v_org_net_amount numeric(19,4);
    v_platform_net_income numeric(19,4);

    -- Wallets
    v_platform_wallet_id uuid;
    v_org_wallet_id uuid;

    -- Ledger entries
    v_ledger_platform_receives_payment uuid;
    v_ledger_platform_pays_paystack uuid;
    v_ledger_platform_pays_org uuid;

    -- Enrollment
    v_enrollment_id uuid;
    v_access_start timestamptz := timezone('utc', now());
    v_access_end timestamptz;
    v_activity_id uuid;
begin
    raise notice '========================================';
    raise notice 'Processing payment from Paystack: %', p_paystack_reference;

    -- =============================================================
    -- 1. Idempotency check
    -- =============================================================
    perform 1 from public.wallet_ledger_entries
    where paystack_reference = p_paystack_reference
    limit 1;

    if found then
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
        raise exception 'Published course not found or inactive: %', p_published_course_id;
    end if;

    select o.tier
    into v_org_tier
    from public.organizations o
    where o.id = v_organization_id;

    select tl.platform_fee_percentage
    into v_platform_fee_percent
    from public.tier_limits tl
    where tl.tier = v_org_tier;

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
        raise exception 'Pricing tier not found or inactive - course: %, tier: %', p_published_course_id, p_tier_id;
    end if;

    -- =============================================================
    -- 4. Determine final price
    -- =============================================================
    if v_tier_promotional_price is not null and v_tier_promotional_price < v_tier_price then
        v_final_amount := v_tier_promotional_price;
    else
        v_final_amount := v_tier_price;
    end if;

    if p_amount_paid != v_final_amount then
        raise exception 'Payment amount (%) does not match expected tier price (%)', p_amount_paid, v_final_amount;
    end if;

    -- =============================================================
    -- 5. Get wallets
    -- =============================================================
    select gw.id
    into v_platform_wallet_id
    from public.gonasi_wallets gw
    where gw.currency_code = v_tier_currency;

    select ow.id
    into v_org_wallet_id
    from public.organization_wallets ow
    where ow.organization_id = v_organization_id
      and ow.currency_code = v_tier_currency;

    -- =============================================================
    -- 6. Calculate distribution
    -- =============================================================
    v_platform_fee_amount := round(v_final_amount * (v_platform_fee_percent / 100), 4);
    v_org_net_amount := v_final_amount - v_platform_fee_amount;
    v_platform_net_income := v_platform_fee_amount - p_paystack_fee;

    -- =============================================================
    -- 7. Ledger entries (wallet updates handled by trigger)
    -- =============================================================
    insert into public.wallet_ledger_entries(
        source_wallet_type, source_wallet_id,
        destination_wallet_type, destination_wallet_id,
        currency_code, amount, direction, type, status,
        related_entity_type, related_entity_id, paystack_reference,
        metadata
    ) values (
        'external', null,
        'platform', v_platform_wallet_id,
        v_tier_currency, v_final_amount, 'credit', 'course_sale', 'completed',
        'course', p_published_course_id, p_paystack_reference,
        jsonb_build_object(
            'paystack_transaction_id', p_paystack_transaction_id,
            'user_id', p_user_id,
            'organization_id', v_organization_id,
            'course_title', v_course_title,
            'tier_name', v_tier_name,
            'tier_id', p_tier_id,
            'payment_method', p_payment_method,
            'gross_amount', v_final_amount,
            'org_payout_amount', v_org_net_amount,
            'platform_fee_amount', v_platform_fee_amount,
            'platform_fee_percent', v_platform_fee_percent,
            'paystack_fee_amount', p_paystack_fee,
            'platform_net_income', v_platform_net_income,
            'paystack_metadata', p_metadata
        )
    ) returning id into v_ledger_platform_receives_payment;

    insert into public.wallet_ledger_entries(
        source_wallet_type, source_wallet_id,
        destination_wallet_type, destination_wallet_id,
        currency_code, amount, direction, type, status,
        related_entity_type, related_entity_id, paystack_reference,
        metadata
    ) values (
        'platform', v_platform_wallet_id,
        'external', null,
        v_tier_currency, p_paystack_fee, 'debit', 'paystack_fee', 'completed',
        'course', p_published_course_id, p_paystack_reference,
        jsonb_build_object(
            'source_ledger_entry', v_ledger_platform_receives_payment
        )
    ) returning id into v_ledger_platform_pays_paystack;

    insert into public.wallet_ledger_entries(
        source_wallet_type, source_wallet_id,
        destination_wallet_type, destination_wallet_id,
        currency_code, amount, direction, type, status,
        related_entity_type, related_entity_id, paystack_reference,
        metadata
    ) values (
        'platform', v_platform_wallet_id,
        'organization', v_org_wallet_id,
        v_tier_currency, v_org_net_amount, 'debit', 'course_sale_payout', 'completed',
        'course', p_published_course_id, p_paystack_reference,
        jsonb_build_object(
            'platform_fee_percent', v_platform_fee_percent,
            'course_sale_amount', v_final_amount,
            'organization_id', v_organization_id,
            'paystack_fee_paid', p_paystack_fee,
            'platform_net_income', v_platform_net_income,
            'source_ledger_entry', v_ledger_platform_receives_payment,
            'paystack_fee_ledger_entry', v_ledger_platform_pays_paystack
        )
    ) returning id into v_ledger_platform_pays_org;

    -- =============================================================
    -- 8. Enrollment: create or update
    -- =============================================================
    select id
    into v_enrollment_id
    from public.course_enrollments
    where user_id = p_user_id
      and published_course_id = p_published_course_id
    for update;

    if found then
        update public.course_enrollments
        set expires_at = v_access_start + interval '1 month',
            is_active = true
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

    -- Always log a new enrollment activity
    insert into public.course_enrollment_activities(
        enrollment_id, tier_name, tier_description, payment_frequency, currency_code,
        is_free, price_paid, promotional_price, was_promotional,
        access_start, access_end, created_by
    ) values (
        v_enrollment_id, v_tier_name, v_tier_description, v_tier_frequency, v_tier_currency,
        v_tier_is_free, v_final_amount, v_tier_promotional_price,
        (v_tier_promotional_price is not null),
        v_access_start, v_access_start + interval '1 month', p_user_id
    ) returning id into v_activity_id;

    -- =============================================================
    -- 9. Return detailed summary
    -- =============================================================
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
            'amount_paid', v_final_amount,
            'currency', v_tier_currency,
            'payment_method', p_payment_method
        ),
        'distribution', jsonb_build_object(
            'gross_amount', v_final_amount,
            'platform_fee_percent', v_platform_fee_percent,
            'platform_fee_amount', v_platform_fee_amount,
            'paystack_fee', p_paystack_fee,
            'platform_net_income', v_platform_net_income,
            'organization_payout', v_org_net_amount
        ),
        'ledger_entries', jsonb_build_object(
            'platform_receives_payment', v_ledger_platform_receives_payment,
            'platform_pays_paystack', v_ledger_platform_pays_paystack,
            'platform_pays_organization', v_ledger_platform_pays_org
        )
    );

exception
    when others then
        raise exception 'Course payment processing failed: %', sqlerrm;
end;
$$;