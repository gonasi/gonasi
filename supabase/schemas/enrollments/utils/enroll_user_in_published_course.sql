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
--
-- Parameters:
--   p_user_id                 : UUID of the user being enrolled
--   p_published_course_id     : UUID of the published course
--   p_tier_id                 : UUID of the pricing tier
--   p_tier_name               : Name of the pricing tier (for historical logs)
--   p_tier_description        : Description of the tier
--   p_payment_frequency       : Payment frequency (e.g., 'once', 'monthly')
--   p_currency_code           : ISO 4217 currency code (e.g., 'USD', 'KES')
--   p_is_free                 : Whether this tier is free
--   p_effective_price         : Final price after promotions (or 0 for free)
--   p_promotional_price       : Original promotional price (nullable)
--   p_is_promotional          : Whether a promotion was applied
--   p_organization_id         : UUID of the organization owning the course
--   p_payment_processor_id    : (optional) Reference ID from payment provider
--   p_payment_amount          : (optional) Amount paid by the user
--   p_payment_method          : (optional) Payment method (e.g., 'card', 'mpesa')
--   p_created_by              : (optional) Actor performing the action (defaults to user)
--
-- Returns:
--   A JSONB object with:
--     - success         : boolean (true if enrollment was successful)
--     - message         : human-friendly message
--     - enrollment_id   : UUID of the enrollment record (null if blocked)
--     - activity_id     : UUID of the activity log (null if blocked)
--     - payment_id      : UUID of payment record (null for free enrollments)
--     - is_free         : whether the enrollment was free
--     - access_granted  : boolean indicating if access was granted
--     - expires_at      : timestamp of access expiration (if granted or pending)
--
-- Raises:
--   - 'Payment information required...' if required payment inputs are missing
--   - 'Payment amount does not match tier price' if tampering is detected
--
-- Security:
--   - `search_path` is cleared to prevent SQL injection via schema manipulation.
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
  p_promotional_price numeric(19,4) default null,
  p_is_promotional boolean default false,
  p_organization_id uuid,
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
  existing_enrollment_record record; -- User's current enrollment (if any)
  organization_tier_record record;   -- Organization's subscription tier info

  -- Access period calculation
  access_start timestamptz := timezone('utc', now()); -- When access begins (now in UTC)
  access_end timestamptz;                             -- When access expires

  -- Payment calculation variables
  platform_fee_percent numeric(5,2);                 -- Platform fee percentage
  payment_processor_fee numeric(19,4) := 0;          -- Processor fee (TODO: calculate based on processor)
  net_amount numeric(19,4);                          -- Amount after processor fees
  platform_fee numeric(19,4);                        -- Platform's commission
  org_payout_amount numeric(19,4);                   -- Final payout to organization

  -- Final JSON result to return
  result jsonb;
begin
  -- =======================================================================
  -- STEP 1: CHECK FOR EXISTING ACTIVE ENROLLMENT
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
  -- STEP 2: GET ORGANIZATION TIER INFO FOR PLATFORM FEE CALCULATION
  -- =======================================================================
  -- We need to know the organization's subscription tier to determine
  -- the platform fee percentage that applies to this payment.
  
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

  -- =======================================================================
  -- STEP 3: APPLY RE-ENROLLMENT BUSINESS RULES
  -- =======================================================================
  -- Different rules apply based on whether the user is enrolling in a free
  -- or paid tier, and whether they already have access.
  
  if found and p_is_free then
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
  -- STEP 4: CALCULATE ACCESS EXPIRATION DATE
  -- =======================================================================
  -- The expiration date depends on whether this is a new enrollment or
  -- an extension of existing access.
  
  if found and not p_is_free then
    -- PAID TIER RE-ENROLLMENT: Extend from current expiration date
    -- This gives users the full value of their purchase by adding days
    -- rather than replacing their current access period.
    
    -- Use the later of: current expiration date OR now (in case access expired)
    access_end := public.calculate_access_end_date(
      greatest(existing_enrollment_record.expires_at, timezone('utc', now())), 
      p_payment_frequency
    );
  else
    -- NEW ENROLLMENT OR FREE TIER: Start access period from now
    access_end := public.calculate_access_end_date(access_start, p_payment_frequency);
  end if;

  -- =======================================================================
  -- STEP 5: CREATE OR UPDATE ENROLLMENT RECORD
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
    p_organization_id,
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
  -- STEP 6: LOG ENROLLMENT ACTIVITY
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
    p_tier_name,
    p_tier_description,
    p_payment_frequency,
    p_currency_code::public.currency_code,
    p_is_free,
    p_effective_price,
    p_promotional_price,
    p_is_promotional,
    access_start,
    access_end,
    coalesce(p_created_by, p_user_id)  -- Default to the user if no creator specified
  ) returning id into activity_id;

  -- =======================================================================
  -- STEP 7: HANDLE PAYMENT PROCESSING (PAID TIERS ONLY)
  -- =======================================================================
  -- For paid enrollments, we need to validate payment information and
  -- record the transaction details with proper fee calculations.
  
  if not p_is_free then
    -- VALIDATION: Ensure all required payment information is provided
    if p_payment_processor_id is null or p_payment_amount is null then
      raise exception 'Payment information required for paid enrollment';
    end if;

    -- VALIDATION: Ensure the payment amount matches the expected price
    -- This prevents price manipulation attacks
    if p_payment_amount != p_effective_price then
      raise exception 'Payment amount does not match tier price';
    end if;

    -- =======================================================================
    -- CALCULATE PAYMENT BREAKDOWN
    -- =======================================================================
    -- Calculate the various fees and payouts from the gross payment amount
    
    -- TODO: Implement proper payment processor fee calculation
    -- For now, we'll use a placeholder. In production, this should be
    -- calculated based on the actual processor and payment method.
    payment_processor_fee := 0;  -- This should be calculated based on processor
    
    -- Net amount after processor fees
    net_amount := p_payment_amount - payment_processor_fee;
    
    -- Platform fee (our commission) calculated from net amount
    platform_fee := net_amount * (platform_fee_percent / 100);
    
    -- Organization payout (what they receive after all fees)
    org_payout_amount := net_amount - platform_fee;

    -- RECORD PAYMENT: Create a comprehensive payment record
    insert into public.course_payments (
      enrollment_id,              -- Links to enrollment
      enrollment_activity_id,     -- Links to this specific enrollment activity
      amount_paid,                -- Gross amount paid by user
      currency_code,              -- Currency of payment
      payment_method,             -- How they paid (card, mobile money, etc.)
      payment_processor_id,       -- Reference ID from payment processor
      payment_processor_fee,      -- Fee charged by processor
      net_amount,                 -- Amount after processor fees
      platform_fee,               -- Platform's commission
      platform_fee_percent,       -- Commission rate used
      org_payout_amount,          -- Final payout to organization
      organization_id,            -- Organization receiving the payment
      created_by                  -- Who processed the payment
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

  -- =======================================================================
  -- STEP 8: UPDATE COURSE ENROLLMENT STATISTICS
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
  -- STEP 9: RETURN STRUCTURED RESULT FOR SUCCESSFUL ENROLLMENT
  -- =======================================================================
  -- Create a JSON response with all the important information about the
  -- enrollment that was just created.
  
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