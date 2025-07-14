-- ============================================================================
-- FUNCTION: enroll_user_in_published_course
-- ============================================================================
-- Description:
--   Enrolls a user in a published course with a specified pricing tier.
--   Handles both free and paid enrollments with different business rules:
--   
--   FREE ENROLLMENTS:
--     - Users cannot re-enroll in free tiers until their current access expires
--     - Prevents abuse of free access by repeatedly enrolling
--   
--   PAID ENROLLMENTS:
--     - Users can upgrade/renew at any time
--     - Access time is extended from current expiration date (adds more days)
--     - Supports upgrades from free to paid, or paid to paid
--
--   The function automatically:
--     - Creates/updates enrollment record in course_enrollments table
--     - Logs enrollment activity with pricing and access details
--     - Validates and records payments for paid enrollments
--     - Updates course-level enrollment statistics
--     - Returns a detailed JSON summary of the operation
--
-- Security:
--   search_path is set to an empty string for security isolation to prevent
--   SQL injection attacks through schema manipulation.
--
-- Parameters:
--   p_user_id               : UUID of the user being enrolled
--   p_published_course_id   : UUID of the published course
--   p_tier_id               : UUID of the pricing tier (changed from text to uuid)
--   p_payment_processor_id  : (optional) Reference ID from payment processor (Stripe, PayPal, etc.)
--   p_payment_amount        : (optional) Amount paid by the user in the course currency
--   p_payment_method        : (optional) Method of payment (e.g., 'card', 'mobile_money')
--   p_created_by            : (optional) Actor performing the enrollment (can differ from user)
--
-- Returns:
--   A JSONB object with:
--     - success: boolean indicating if enrollment was successful
--     - message: human-readable message describing the result
--     - enrollment_id: UUID of the enrollment record (null if enrollment blocked)
--     - activity_id: UUID of the enrollment activity log entry (null if enrollment blocked)
--     - payment_id: UUID of payment record (null for free enrollments or if blocked)
--     - is_free: boolean indicating if this was a free enrollment
--     - access_granted: boolean indicating if access was granted
--     - expires_at: timestamp when access expires (for blocked free re-enrollments)
--
-- Exceptions:
--   - 'Published course not found or inactive': Course doesn't exist or is disabled
--   - 'Payment information required...': Missing payment data for paid tier
--   - 'Payment amount does not match tier price': Payment validation failed
-- ============================================================================
create or replace function public.enroll_user_in_published_course(
  p_user_id uuid,
  p_published_course_id uuid,
  p_tier_id uuid,
  p_payment_processor_id text default null,
  p_payment_amount numeric(19,4) default null,
  p_payment_method text default null,
  p_created_by uuid default null
) returns jsonb
as $$
declare
  -- =======================================================================
  -- VARIABLE DECLARATIONS
  -- =======================================================================
  
  -- Primary keys that will be returned to the caller
  enrollment_id uuid;           -- ID of the enrollment record
  activity_id uuid;             -- ID of the enrollment activity log
  payment_id uuid;              -- ID of the payment record (null for free)

  -- Records to hold data from related tables
  published_course_record record;    -- Course details from published_courses
  tier_record record;               -- Pricing tier details
  pricing_info record;              -- Effective pricing (with promotions)
  existing_enrollment_record record; -- User's current enrollment (if any)

  -- Access period calculation
  access_start timestamptz := timezone('utc', now()); -- When access begins (now in UTC)
  access_end timestamptz;                             -- When access expires

  -- Final JSON result to return
  result jsonb;
begin
  -- =======================================================================
  -- STEP 1: VALIDATE PUBLISHED COURSE
  -- =======================================================================
  -- First, we need to ensure the course exists and is currently active.
  -- Inactive courses cannot be enrolled in.
  
  select * into published_course_record
  from public.published_courses 
  where id = p_published_course_id 
    and is_active = true;

  -- If no record found, the course either doesn't exist or is inactive
  if not found then
    raise exception 'Published course not found or inactive';
  end if;

  -- =======================================================================
  -- STEP 2: FETCH PRICING TIER DETAILS
  -- =======================================================================
  -- Get the pricing tier information including price, frequency, and metadata.
  -- This function should return details like tier_name, price, currency, etc.
  
  select * into tier_record
  from public.get_published_course_pricing_tier(p_published_course_id, p_tier_id);

  -- =======================================================================
  -- STEP 3: CALCULATE EFFECTIVE PRICING
  -- =======================================================================
  -- This accounts for any active promotions or discounts.
  -- The effective price might be different from the base tier price.
  
  select * into pricing_info
  from public.get_effective_pricing_for_published_tier(p_published_course_id, p_tier_id);

  -- =======================================================================
  -- STEP 4: CHECK FOR EXISTING ACTIVE ENROLLMENT
  -- =======================================================================
  -- We need to know if the user already has access to this course.
  -- This affects our business logic for re-enrollment.
  
  select * into existing_enrollment_record
  from public.course_enrollments
  where user_id = p_user_id 
    and published_course_id = p_published_course_id
    and is_active = true
    and (expires_at is null or expires_at > timezone('utc', now()));

  -- =======================================================================
  -- STEP 5: APPLY RE-ENROLLMENT BUSINESS RULES
  -- =======================================================================
  -- Different rules apply based on whether the user is enrolling in a free
  -- or paid tier, and whether they already have access.
  
  if found and tier_record.is_free then
    -- BUSINESS RULE: Users cannot re-enroll in free tiers until access expires
    -- This prevents abuse where users repeatedly enroll in free tiers
    
    -- Check if their last enrollment activity was also free
    if exists (
      select 1 
      from public.course_enrollment_activities cea
      where cea.enrollment_id = existing_enrollment_record.id
        and cea.is_free = true
      order by cea.created_at desc
      limit 1
    ) then
      -- Instead of throwing an exception, return a user-friendly message
      -- This provides a better user experience on the frontend
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

  -- NOTE: For paid tiers, we allow re-enrollment at any time (upgrades/renewals)

  -- =======================================================================
  -- STEP 6: CALCULATE ACCESS EXPIRATION DATE
  -- =======================================================================
  -- The expiration date depends on whether this is a new enrollment or
  -- an extension of existing access.
  
  if found and not tier_record.is_free then
    -- PAID TIER RE-ENROLLMENT: Extend from current expiration date
    -- This gives users the full value of their purchase by adding days
    -- rather than replacing their current access period.
    
    -- Use the later of: current expiration date OR now (in case access expired)
    access_end := public.calculate_access_end_date(
      greatest(existing_enrollment_record.expires_at, timezone('utc', now())), 
      tier_record.payment_frequency
    );
  else
    -- NEW ENROLLMENT OR FREE TIER: Start access period from now
    access_end := public.calculate_access_end_date(access_start, tier_record.payment_frequency);
  end if;

  -- =======================================================================
  -- STEP 7: CREATE OR UPDATE ENROLLMENT RECORD
  -- =======================================================================
  -- This is the main enrollment record that tracks the user's access to the course.
  -- We use INSERT...ON CONFLICT to handle both new enrollments and updates.
  
  insert into public.course_enrollments (
    user_id,                    -- Who is enrolled
    published_course_id,        -- Which course
    organization_id,            -- Which organization owns the course
    enrolled_at,                -- When enrollment started
    expires_at,                 -- When access expires
    is_active                   -- Whether enrollment is currently active
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
    -- Update expiration date to the new calculated date
    expires_at = excluded.expires_at,
    -- Ensure enrollment is marked as active
    is_active = true,
    -- Only update enrolled_at if the enrollment was previously inactive
    -- (this preserves the original enrollment date for active enrollments)
    enrolled_at = case 
      when public.course_enrollments.is_active = false then excluded.enrolled_at
      else public.course_enrollments.enrolled_at
    end
  returning id into enrollment_id;

  -- =======================================================================
  -- STEP 8: LOG ENROLLMENT ACTIVITY
  -- =======================================================================
  -- Create a detailed log entry for this enrollment action.
  -- This provides an audit trail and stores pricing information at the time
  -- of enrollment (important for historical reporting).
  
  insert into public.course_enrollment_activities (
    enrollment_id,              -- Links to the enrollment record
    tier_name,                  -- Name of the tier (stored for historical purposes)
    tier_description,           -- Description of the tier
    payment_frequency,          -- How often payment is required
    currency_code,              -- Currency of the payment
    is_free,                    -- Whether this was a free enrollment
    price_paid,                 -- Actual price paid (after promotions)
    promotional_price,          -- Promotional price if applicable
    was_promotional,            -- Whether a promotion was applied
    access_start,               -- When access begins
    access_end,                 -- When access expires
    created_by                  -- Who performed the enrollment
  ) values (
    enrollment_id,
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
    coalesce(p_created_by, p_user_id)  -- Default to the user if no creator specified
  ) returning id into activity_id;

  -- =======================================================================
  -- STEP 9: HANDLE PAYMENT PROCESSING (PAID TIERS ONLY)
  -- =======================================================================
  -- For paid enrollments, we need to validate payment information and
  -- record the transaction details.
  
  if not tier_record.is_free then
    -- VALIDATION: Ensure all required payment information is provided
    if p_payment_processor_id is null or p_payment_amount is null then
      raise exception 'Payment information required for paid enrollment';
    end if;

    -- VALIDATION: Ensure the payment amount matches the expected price
    -- This prevents price manipulation attacks
    if p_payment_amount != pricing_info.effective_price then
      raise exception 'Payment amount does not match tier price';
    end if;

    -- RECORD PAYMENT: Create a payment record for accounting and auditing
    insert into public.course_payments (
      enrollment_id,              -- Links to enrollment
      enrollment_activity_id,     -- Links to this specific enrollment activity
      amount_paid,                -- Amount paid by user
      currency_code,              -- Currency of payment
      payment_method,             -- How they paid (card, mobile money, etc.)
      payment_processor_id,       -- Reference ID from payment processor
      net_amount,                 -- Amount after fees (TODO: implement fee calculation)
      payment_status,             -- Status of the payment
      organization_id,            -- Organization receiving the payment
      created_by                  -- Who processed the payment
    ) values (
      enrollment_id,
      activity_id,
      p_payment_amount,
      tier_record.currency_code::public.currency_code,
      p_payment_method,
      p_payment_processor_id,
      p_payment_amount,           -- TODO: Subtract payment processor fees
      'completed',                -- Assuming payment is already completed
      published_course_record.organization_id,
      coalesce(p_created_by, p_user_id)
    ) returning id into payment_id;
  end if;

  -- =======================================================================
  -- STEP 10: UPDATE COURSE ENROLLMENT STATISTICS
  -- =======================================================================
  -- Update the published course record with current enrollment counts.
  -- This provides quick access to enrollment metrics without complex queries.
  
  update public.published_courses 
  set 
    -- Increment total enrollment count
    total_enrollments = total_enrollments + 1,
    
    -- Recalculate active enrollments by counting current active enrollments
    active_enrollments = (
      select count(*)
      from public.course_enrollments ce
      where ce.published_course_id = p_published_course_id
        and ce.is_active = true
        and (ce.expires_at is null or ce.expires_at > timezone('utc', now()))
    ),
    
    -- Update the last modified timestamp
    updated_at = timezone('utc', now())
  where id = p_published_course_id;

  -- =======================================================================
  -- STEP 11: RETURN STRUCTURED RESULT FOR SUCCESSFUL ENROLLMENT
  -- =======================================================================
  -- Create a JSON response with all the important information about the
  -- enrollment that was just created.
  
  result := jsonb_build_object(
    'success', true,
    'message', case 
      when tier_record.is_free then 'Successfully enrolled in free course access.'
      else 'Successfully enrolled with paid access. Payment processed.'
    end,
    'enrollment_id', enrollment_id,
    'activity_id', activity_id,
    'payment_id', case when tier_record.is_free then null else payment_id end,
    'is_free', tier_record.is_free,
    'access_granted', true,
    'expires_at', access_end
  );

  return result;
end;
$$ language plpgsql
set search_path = '';  -- Security: Prevent search path attacks