-- ============================================================================
-- FUNCTION: enroll_user_in_published_course
-- ============================================================================
-- Description:
--   Enrolls a user in a published course with a specified pricing tier.
--   Handles both free and paid enrollments.
--   Automatically:
--     - Creates/updates enrollment record
--     - Logs enrollment activity
--     - Validates and records payments (for paid enrollments)
--     - Updates course-level enrollment statistics
--     - Returns a detailed JSON summary of the operation
--
-- Security:
--   search_path is set to an empty string for security isolation.
--
-- Parameters:
--   p_user_id               : UUID of the user being enrolled.
--   p_published_course_id   : UUID of the published course.
--   p_tier_id               : Text ID of the pricing tier.
--   p_payment_processor_id  : (optional) Reference ID from payment processor.
--   p_payment_amount        : (optional) Amount paid by the user.
--   p_payment_method        : (optional) Method of payment (e.g., 'card', 'mobile_money').
--   p_created_by            : (optional) Actor performing the enrollment (can differ from user).
--
-- Returns:
--   A JSONB object with:
--     - enrollment_id
--     - activity_id
--     - payment_id (null for free enrollments)
--     - is_free (true/false)
--     - access_granted (always true if successful)
-- ============================================================================

create or replace function public.enroll_user_in_published_course(
  p_user_id uuid,
  p_published_course_id uuid,
  p_tier_id text,
  p_payment_processor_id text default null,
  p_payment_amount numeric(19,4) default null,
  p_payment_method text default null,
  p_created_by uuid default null
) returns jsonb
as $$
declare
  -- IDs to be returned
  enrollment_id uuid;
  activity_id uuid;
  payment_id uuid;

  -- Data holders
  published_course_record record;
  tier_record record;
  pricing_info record;

  -- Access window
  access_start timestamptz := timezone('utc', now()); -- Start now in UTC
  access_end timestamptz;

  -- Final output
  result jsonb;
begin
  -- =========================================================================
  -- STEP 1: Validate that the published course exists and is active
  -- =========================================================================
  select * into published_course_record
  from public.published_courses 
  where id = p_published_course_id and is_active = true;

  if not found then
    raise exception 'Published course not found or inactive';
  end if;

  -- =========================================================================
  -- STEP 2: Fetch the tier record (price, frequency, name, etc)
  -- =========================================================================
  select * into tier_record
  from public.get_published_course_pricing_tier(p_published_course_id, p_tier_id)
  limit 1;

  -- =========================================================================
  -- STEP 3: Determine the effective pricing (promotion-aware)
  -- =========================================================================
  select * into pricing_info
  from public.get_effective_pricing_for_published_tier(p_published_course_id, p_tier_id)
  limit 1;

  -- =========================================================================
  -- STEP 4: Compute the access expiration date based on frequency
  -- =========================================================================
  access_end := public.calculate_access_end_date(access_start, tier_record.payment_frequency);

  -- =========================================================================
  -- STEP 5: Create or update the course enrollment
  -- =========================================================================
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
    published_course_record.organization_id,
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

  -- =========================================================================
  -- STEP 6: Log the enrollment activity
  -- =========================================================================
  insert into public.course_enrollment_activities (
    enrollment_id,
    pricing_tier_id,
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
    p_tier_id::uuid,
    tier_record.tier_name,
    tier_record.tier_description,
    tier_record.payment_frequency,
    tier_record.currency_code::public.currency_code,
    tier_record.is_free,
    pricing_info.effective_price,
    pricing_info.promotional_price,
    pricing_info.is_promotional,
    access_start,
    access_end,
    coalesce(p_created_by, p_user_id)
  ) returning id into activity_id;

  -- =========================================================================
  -- STEP 7: If paid tier, validate payment and record transaction
  -- =========================================================================
  if not tier_record.is_free then
    -- Ensure payment metadata is present
    if p_payment_processor_id is null or p_payment_amount is null then
      raise exception 'Payment information required for paid enrollment';
    end if;

    -- Validate that payment matches expected price
    if p_payment_amount != pricing_info.effective_price then
      raise exception 'Payment amount does not match tier price';
    end if;

    -- Log payment
    insert into public.course_payments (
      enrollment_id,
      enrollment_activity_id,
      amount_paid,
      currency_code,
      payment_method,
      payment_processor_id,
      net_amount,
      payment_status,
      organization_id,
      created_by
    ) values (
      enrollment_id,
      activity_id,
      p_payment_amount,
      tier_record.currency_code::currency_code,
      p_payment_method,
      p_payment_processor_id,
      p_payment_amount, -- TODO: apply payment processor fee subtraction
      'completed',
      published_course_record.organization_id,
      coalesce(p_created_by, p_user_id)
    ) returning id into payment_id;
  end if;

  -- =========================================================================
  -- STEP 8: Update overall stats on the published course
  -- =========================================================================
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

  -- =========================================================================
  -- STEP 9: Return a structured result
  -- =========================================================================
  result := jsonb_build_object(
    'enrollment_id', enrollment_id,
    'activity_id', activity_id,
    'payment_id', case when tier_record.is_free then null else payment_id end,
    'is_free', tier_record.is_free,
    'access_granted', true
  );

  return result;
end;
$$ language plpgsql
set search_path = '';
