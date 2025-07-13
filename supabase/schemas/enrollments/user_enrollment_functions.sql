-- ==========================================================================
-- MAIN ENROLLMENT FUNCTION (SECURE, FIXED SEARCH_PATH)
-- ==========================================================================

create or replace function public.enroll_user_in_published_course(
  p_user_id uuid,                 -- The user enrolling in the course
  p_published_course_id uuid,    -- The published course the user is enrolling into
  p_tier_id text,                -- The pricing tier ID (stored as text in the input)
  p_created_by uuid default null -- Optionally, the actor performing the enrollment
) 
returns uuid
as $$
declare
  enrollment_id uuid;                 -- ID of the enrollment (to be returned)
  published_course_record record;    -- Holds the course data
  tier_record record;                -- Holds pricing tier info
  pricing_info record;               -- Effective pricing data (price or promo)
  access_start timestamptz := timezone('utc', now()); -- When access begins
  access_end timestamptz;            -- When access ends (based on frequency)
  activity_id uuid;                  -- ID of the associated activity log
begin
  -- 1. Fetch the published course details, ensuring it's active
  select * into published_course_record
  from public.published_courses 
  where id = p_published_course_id and is_active = true;

  if not found then
    raise exception 'Published course not found or inactive';
  end if;

  -- 2. Fetch the pricing tier details for this published course
  select * into tier_record
  from public.get_published_course_pricing_tier(p_published_course_id, p_tier_id);

  -- 3. Fetch the effective pricing (accounts for promotions)
  select * into pricing_info 
  from public.get_effective_pricing_for_published_tier(p_published_course_id, p_tier_id);

  -- 4. Determine access end date using the tier's payment frequency
  access_end := public.calculate_access_end_date(access_start, tier_record.payment_frequency);

  -- 5. Insert or update the enrollment record
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

  -- 6. Log the enrollment activity
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

  -- 7. Update enrollment stats on the published course
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

  return enrollment_id;
end;
$$ language plpgsql
set search_path = '';  
