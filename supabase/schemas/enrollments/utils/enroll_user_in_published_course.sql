-- ============================================================================
-- FUNCTION: enroll_user_in_published_course
-- ============================================================================
-- DESCRIPTION:
--   This function handles user enrollment in a published course, supporting:
--     - Free and paid tiers
--     - Tier renewals and upgrades
--     - Access window calculations
--     - Payment logging and validation
--     - Platform fee calculation: org gets (user_payment - platform_fee%), gonasi absorbs transaction fees
--     - Wallet distribution for organizations
--     - Course enrollment statistics updates
--     - Returns a structured JSON summary of the operation
--
--   - Prevents abuse by restricting re-enrollment in free tiers before expiration
--   - Paid enrollments can be upgraded or renewed anytime
--   - Transaction fees are absorbed by Gonasi's platform fee, org gets clean percentage
--
-- PARAMETERS:
--   p_user_id               UUID - ID of the user enrolling
--   p_published_course_id   UUID - ID of the course to enroll in
--   p_tier_id               UUID - ID of the selected pricing tier
--   p_tier_name             TEXT - Human-readable tier name (e.g., "Basic", "Pro")
--   p_tier_description      TEXT - Description of what the tier offers
--   p_payment_frequency     TEXT - Payment frequency ("one_time", "monthly", "yearly")
--   p_currency_code         TEXT - ISO currency code ("USD", "KES", etc.)
--   p_is_free               BOOLEAN - Whether this is a free tier
--   p_effective_price       NUMERIC - Final price charged after promotions
--   p_organization_id       UUID - Org that owns the course (used for payout)
--   p_promotional_price     NUMERIC (optional) - If a discount was applied
--   p_is_promotional        BOOLEAN (optional) - Whether promotion was used
--   p_payment_processor_id  TEXT (optional) - e.g., Paystack transaction ID
--   p_payment_amount        NUMERIC (optional) - Actual payment amount received
--   p_payment_method        TEXT (optional) - Payment method ("card", "mpesa", etc.)
--   p_payment_processor_fee NUMERIC (optional) - Actual fee charged by payment processor
--   p_created_by            UUID (optional) - Who initiated the enrollment (for admin use)
--
-- RETURNS:
--   JSONB - A structured response with:
--     - success (bool)
--     - message (text)
--     - enrollment_id, activity_id, payment_id (UUIDs)
--     - access_granted (bool), is_free (bool)
--     - access window (expires_at)
--     - breakdown of payment including transaction fees
--     - any wallet processing response
-- ============================================================================
create or replace function public.enroll_user_in_published_course(
  p_user_id uuid,
  p_published_course_id uuid,
  p_tier_id uuid,
  p_tier_name text,
  p_tier_description text,
  p_payment_frequency text,
  p_currency_code text,
  p_is_free boolean,
  p_effective_price numeric(19,4),
  p_organization_id uuid,
  p_promotional_price numeric(19,4) default null,
  p_is_promotional boolean default false,
  p_payment_processor_id text default null,
  p_payment_amount numeric(19,4) default null,
  p_payment_method text default null,
  p_payment_processor_fee numeric(19,4) default null,
  p_created_by uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- Output IDs
  enrollment_id uuid;
  activity_id uuid;
  payment_id uuid;
  
  -- Other variables (same as before)
  existing_enrollment_record record;
  organization_tier_record record;
  access_start timestamptz := timezone('utc', now());
  access_end timestamptz;
  platform_fee_percent numeric(5,2);
  processor_fee numeric(19,4) := 0;
  net_payment numeric(19,4);
  platform_fee_from_gross numeric(19,4);
  org_payout numeric(19,4);
  gonasi_actual_income numeric(19,4);
  result jsonb;
  wallet_result jsonb;
begin
  -- Start explicit transaction
  begin
    -- All your existing validation and logic here...
    -- (keeping the same logic but wrapping in transaction)
    
    -- Sanity check: created_by must match user (or be null)
    if p_created_by is not null and p_created_by != p_user_id then
      raise exception 'Invalid created_by: must be null or match p_user_id';
    end if;

    -- Validate published course belongs to org and is published
    if not exists (
      select 1
      from public.published_courses pc
      where pc.id = p_published_course_id
        and pc.organization_id = p_organization_id
    ) then
      raise exception 'Invalid course or course does not belong to organization';
    end if;

    -- STEP 1: Check for active enrollment
    select * into existing_enrollment_record
    from public.course_enrollments
    where user_id = p_user_id 
      and published_course_id = p_published_course_id
      and is_active = true
      and (expires_at is null or expires_at > timezone('utc', now()));

    -- STEP 2: Get org's platform fee percentage
    select o.tier, tl.platform_fee_percentage
    into organization_tier_record
    from public.organizations o
    join public.tier_limits tl on tl.tier = o.tier
    where o.id = p_organization_id;

    if not found then
      raise exception 'Organization not found or tier limits not configured';
    end if;

    platform_fee_percent := organization_tier_record.platform_fee_percentage;

    -- STEP 3: Prevent repeated free enrollments
    if found and p_is_free then
      if exists (
        select 1 
        from public.course_enrollment_activities cea
        where cea.enrollment_id = existing_enrollment_record.id
          and cea.is_free = true
        limit 1
      ) then
        result := jsonb_build_object(
          'success', false,
          'message', 'You already have free access to this course. You can re-enroll when your current access expires.',
          'enrollment_id', null,
          'activity_id', null,
          'payment_id', null,
          'is_free', true,
          'access_granted', false,
          'expires_at', existing_enrollment_record.expires_at
        );
        return result;
      end if;
    end if;

    -- STEP 4: Calculate access window
    if found and not p_is_free then
      access_end := public.calculate_access_end_date(
        greatest(existing_enrollment_record.expires_at, timezone('utc', now())), 
        p_payment_frequency::public.payment_frequency
      );
    else
      access_end := public.calculate_access_end_date(
        access_start, 
        p_payment_frequency::public.payment_frequency
      );
    end if;

    -- STEP 5: Create or update enrollment
    insert into public.course_enrollments (
      user_id, published_course_id, organization_id,
      enrolled_at, expires_at, is_active
    ) values (
      p_user_id, p_published_course_id, p_organization_id,
      access_start, access_end, true
    )
    on conflict (user_id, published_course_id)
    do update set
      expires_at = excluded.expires_at,
      is_active = true,
      enrolled_at = case 
        when public.course_enrollments.is_active = false then excluded.enrolled_at
        else public.course_enrollments.enrolled_at
      end
    returning id into enrollment_id;

    -- STEP 6: Log enrollment activity
    insert into public.course_enrollment_activities (
      enrollment_id, tier_name, tier_description,
      payment_frequency, currency_code, is_free,
      price_paid, promotional_price, was_promotional,
      access_start, access_end, created_by
    ) values (
      enrollment_id, p_tier_name, p_tier_description,
      p_payment_frequency::public.payment_frequency, p_currency_code::public.currency_code, p_is_free,
      p_effective_price, p_promotional_price, p_is_promotional,
      access_start, access_end, coalesce(p_created_by, p_user_id)
    ) returning id into activity_id;

    -- STEP 7: Handle payment (if not free)
    if not p_is_free then
      if p_payment_processor_id is null or p_payment_amount is null then
        raise exception 'Payment information required for paid enrollment';
      end if;

      if p_payment_amount != p_effective_price then
        raise exception 'Payment amount does not match tier price';
      end if;

      processor_fee := coalesce(p_payment_processor_fee, 0);
      net_payment := p_payment_amount - processor_fee;
      platform_fee_from_gross := p_payment_amount * (platform_fee_percent / 100);
      org_payout := p_payment_amount - platform_fee_from_gross;
      gonasi_actual_income := platform_fee_from_gross - processor_fee;

      insert into public.course_payments (
        enrollment_id, enrollment_activity_id, amount_paid, currency_code,
        payment_method, payment_processor_id, payment_processor_fee,
        net_amount, platform_fee, platform_fee_percent,
        org_payout_amount, organization_id, created_by
      ) values (
        enrollment_id, activity_id, p_payment_amount, p_currency_code::public.currency_code,
        p_payment_method, p_payment_processor_id, processor_fee,
        net_payment, platform_fee_from_gross, platform_fee_percent,
        org_payout, p_organization_id, coalesce(p_created_by, p_user_id)
      ) returning id into payment_id;

      -- CRITICAL: Process wallets within the same transaction
      wallet_result := public.process_course_payment_to_wallets(
        payment_id, p_organization_id, p_published_course_id,
        p_user_id, p_tier_name, p_currency_code,
        p_payment_amount, processor_fee, platform_fee_from_gross, 
        org_payout, platform_fee_percent, p_created_by
      );
      
      -- If we get here, wallet processing succeeded
      result := result || jsonb_build_object('wallet_processing', wallet_result);
    end if;

    -- STEP 8: Update course stats
    update public.published_courses 
    set 
      total_enrollments = total_enrollments + 1,
      active_enrollments = (
        select count(*)
        from public.course_enrollments ce
        where ce.published_course_id = p_published_course_id
          and ce.is_active = true
          and (ce.expires_at is null or ce.expires_at > timezone('utc', now()))
      ),
      updated_at = timezone('utc', now())
    where id = p_published_course_id;

    -- STEP 9: Build final result
    result := jsonb_build_object(
      'success', true,
      'message', case 
        when p_is_free then 'Successfully enrolled in free course access.'
        else 'Successfully enrolled with paid access. Payment processed.'
      end,
      'enrollment_id', enrollment_id,
      'activity_id', activity_id,
      'payment_id', case when p_is_free then null else payment_id end,
      'is_free', p_is_free,
      'access_granted', true,
      'expires_at', access_end,
      'payment_breakdown', case 
        when p_is_free then null
        else jsonb_build_object(
          'gross_amount', p_payment_amount,
          'processor_fee', processor_fee,
          'net_amount', net_payment,
          'platform_fee_percent', platform_fee_percent,
          'platform_fee_from_gross', platform_fee_from_gross,
          'gonasi_actual_income', gonasi_actual_income,
          'org_payout', org_payout
        )
      end
    );

    -- If we reach here, commit the transaction
    return result;

  exception
    when others then
      -- This will automatically rollback the transaction
      raise exception 'Enrollment failed: %', SQLERRM;
  end;
end;
$$;