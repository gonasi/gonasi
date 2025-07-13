-- Function to renew an existing enrollment
create or replace function renew_enrollment(
  p_enrollment_id uuid,
  p_tier_id text,
  p_renewed_by uuid
) returns uuid as $$
declare
  enrollment_record record;
  tier_record record;
  pricing_info record;
  new_access_start timestamptz;
  new_access_end timestamptz;
  activity_id uuid;
begin
  -- Get current enrollment
  select * into enrollment_record
  from course_enrollments 
  where id = p_enrollment_id and is_active = true;
  
  if not found then
    raise exception 'Enrollment not found or inactive';
  end if;
  
  -- Get pricing tier from published course
  select * into tier_record
  from public.get_published_course_pricing_tier(p_published_course_id, p_tier_id);

  
  -- Get effective pricing
  select * into pricing_info 
  from public.get_effective_pricing_for_published_tier(enrollment_record.published_course_id, p_tier_id);
  
  -- Calculate new access dates (extend from current expiry or now, whichever is later)
  new_access_start := greatest(enrollment_record.expires_at, timezone('utc', now()));
  new_access_end := calculate_access_end_date(new_access_start, tier_record.payment_frequency);
  
  -- Update enrollment expiry
  update course_enrollments 
  set expires_at = new_access_end
  where id = p_enrollment_id;
  
  -- Record the renewal activity
  insert into course_enrollment_activities (
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
    p_enrollment_id,
    p_tier_id::uuid,
    tier_record.tier_name,
    tier_record.tier_description,
    tier_record.payment_frequency,
    tier_record.currency_code::currency_code,
    tier_record.is_free,
    pricing_info.effective_price,
    pricing_info.promotional_price,
    pricing_info.is_promotional,
    new_access_start,
    new_access_end,
    p_renewed_by
  ) returning id into activity_id;
  
  -- Update published course active enrollment stats
  update published_courses 
  set 
    active_enrollments = (
      select count(*)
      from course_enrollments ce
      where ce.published_course_id = enrollment_record.published_course_id
        and ce.is_active = true
        and (ce.expires_at is null or ce.expires_at > timezone('utc', now()))
    ),
    updated_at = timezone('utc', now())
  where id = enrollment_record.published_course_id;
  
  return activity_id;
end;
$$ language plpgsql;