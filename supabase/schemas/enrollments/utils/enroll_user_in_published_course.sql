-- ============================================================================
-- FUNCTION: enroll_user_in_published_course
-- ============================================================================
-- Description:
--   Enrolls a user in a published course with a specified pricing tier.
--   Supports both free and paid enrollments, tier upgrades, and renewals.
--
--   FREE ENROLLMENTS:
--     - Users cannot re-enroll in free tiers until current access expires
--     - Prevents abuse of free tier re-enrollment loops
--
--   PAID ENROLLMENTS:
--     - Users can upgrade or renew at any time
--     - Paid enrollments extend current access (if still valid), or start fresh
--     - Validates payment inputs and prevents tampering
--
--   This function:
--     - Creates or updates the main enrollment record (`course_enrollments`)
--     - Logs pricing, tier, and access metadata in `course_enrollment_activities`
--     - Validates and records payment info in `course_payments` (for paid tiers)
--     - Updates course-level enrollment stats (`published_courses`)
--     - Returns a detailed JSON object summarizing the operation
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
  p_created_by uuid default null
) returns jsonb
as $$
declare
  enrollment_id uuid;
  activity_id uuid;
  payment_id uuid;
  existing_enrollment_record record;
  organization_tier_record record;
  access_start timestamptz := timezone('utc', now());
  access_end timestamptz;
  platform_fee_percent numeric(5,2);
  payment_processor_fee numeric(19,4) := 0;
  net_amount numeric(19,4);
  platform_fee numeric(19,4);
  org_payout_amount numeric(19,4);
  result jsonb;
begin
  -- STEP 1: Check for existing active enrollment
  select * into existing_enrollment_record
  from public.course_enrollments
  where user_id = p_user_id 
    and published_course_id = p_published_course_id
    and is_active = true
    and (expires_at is null or expires_at > timezone('utc', now()));

  -- STEP 2: Get org tier info
  select 
    o.tier,
    tl.platform_fee_percentage
  into organization_tier_record
  from public.organizations o
  join public.tier_limits tl on tl.tier = o.tier
  where o.id = p_organization_id;

  if not found then
    raise exception 'Organization not found or tier limits not configured';
  end if;

  platform_fee_percent := organization_tier_record.platform_fee_percentage;

  -- STEP 3: Free tier re-enrollment rules
  if found and p_is_free then
    if exists (
      select 1 
      from public.course_enrollment_activities cea
      where cea.enrollment_id = existing_enrollment_record.id
        and cea.is_free = true
      order by cea.created_at desc
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

  -- STEP 4: Calculate expiration
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

  -- STEP 5: Insert or update enrollment
  insert into public.course_enrollments (
    user_id,
    published_course_id,
    organization_id,
    enrolled_at,
    expires_at,
    is_active
  ) values (
    p_user_id,
    p_published_course_id,
    p_organization_id,
    access_start,
    access_end,
    true
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
    enrollment_id,
    tier_name,
    tier_description,
    payment_frequency,
    currency_code,
    is_free,
    price_paid,
    promotional_price,
    was_promotional,
    access_start,
    access_end,
    created_by
  ) values (
    enrollment_id,
    p_tier_name,
    p_tier_description,
    p_payment_frequency::public.payment_frequency,
    p_currency_code::public.currency_code,
    p_is_free,
    p_effective_price,
    p_promotional_price,
    p_is_promotional,
    access_start,
    access_end,
    coalesce(p_created_by, p_user_id)
  ) returning id into activity_id;

  -- STEP 7: Payment handling for paid tiers
  if not p_is_free then
    if p_payment_processor_id is null or p_payment_amount is null then
      raise exception 'Payment information required for paid enrollment';
    end if;

    if p_payment_amount != p_effective_price then
      raise exception 'Payment amount does not match tier price';
    end if;

    payment_processor_fee := 0;
    net_amount := p_payment_amount - payment_processor_fee;
    platform_fee := net_amount * (platform_fee_percent / 100);
    org_payout_amount := net_amount - platform_fee;

    insert into public.course_payments (
      enrollment_id,
      enrollment_activity_id,
      amount_paid,
      currency_code,
      payment_method,
      payment_processor_id,
      payment_processor_fee,
      net_amount,
      platform_fee,
      platform_fee_percent,
      org_payout_amount,
      organization_id,
      created_by
    ) values (
      enrollment_id,
      activity_id,
      p_payment_amount,
      p_currency_code::public.currency_code,
      p_payment_method,
      p_payment_processor_id,
      payment_processor_fee,
      net_amount,
      platform_fee,
      platform_fee_percent,
      org_payout_amount,
      p_organization_id,
      coalesce(p_created_by, p_user_id)
    ) returning id into payment_id;
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

  -- STEP 9: Return result
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
        'processor_fee', payment_processor_fee,
        'net_amount', net_amount,
        'platform_fee', platform_fee,
        'platform_fee_percent', platform_fee_percent,
        'org_payout', org_payout_amount
      )
    end
  );

  return result;
end;
$$ language plpgsql
set search_path = '';
