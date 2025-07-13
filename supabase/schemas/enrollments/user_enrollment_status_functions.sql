-- ==========================================================================
-- ENROLLMENT STATUS FUNCTIONS
-- ==========================================================================

-- Function to check if user has active access to a published course
create or replace function user_has_active_access(
  p_user_id uuid,
  p_published_course_id uuid
) returns boolean as $$
declare
  enrollment_record record;
  now_utc timestamptz := timezone('utc', now());
begin
  select * into enrollment_record
  from course_enrollments
  where user_id = p_user_id 
    and published_course_id = p_published_course_id
    and is_active = true;
  
  if not found then
    return false;
  end if;
  
  -- Check if enrollment is still within access period
  return enrollment_record.expires_at is null or enrollment_record.expires_at > now_utc;
end;
$$ language plpgsql;

-- Function to get enrollment status with details
create or replace function get_enrollment_status(
  p_user_id uuid,
  p_published_course_id uuid
) returns table (
  enrollment_id uuid,
  is_enrolled boolean,
  is_active boolean,
  expires_at timestamptz,
  days_remaining integer,
  latest_activity_id uuid
) as $$
declare
  enrollment_record record;
  latest_activity_record record;
  now_utc timestamptz := timezone('utc', now());
begin
  select * into enrollment_record
  from course_enrollments
  where user_id = p_user_id 
    and published_course_id = p_published_course_id
    and is_active = true;
  
  if not found then
    return query select 
      null::uuid,
      false,
      false,
      null::timestamptz,
      null::integer,
      null::uuid;
    return;
  end if;
  
  -- Get latest activity
  select * into latest_activity_record
  from course_enrollment_activities
  where enrollment_id = enrollment_record.id
  order by created_at desc
  limit 1;
  
  return query select 
    enrollment_record.id,
    true,
    enrollment_record.expires_at is null or enrollment_record.expires_at > now_utc,
    enrollment_record.expires_at,
    case 
      when enrollment_record.expires_at is null then null
      else extract(days from enrollment_record.expires_at - now_utc)::integer
    end,
    latest_activity_record.id;
end;
$$ language plpgsql;

-- Function to get available pricing tiers for a published course
create or replace function get_published_course_pricing_tiers(
  p_published_course_id uuid
) returns table (
  tier_id text,
  payment_frequency payment_frequency,
  is_free boolean,
  price numeric(19,4),
  currency_code text,
  promotional_price numeric(19,4),
  promotion_start_date timestamptz,
  promotion_end_date timestamptz,
  tier_name text,
  tier_description text,
  position integer,
  is_popular boolean,
  is_recommended boolean,
  effective_price numeric(19,4),
  is_promotional boolean
) as $$
declare
  tier_data jsonb;
  pricing_info record;
  now_utc timestamptz := timezone('utc', now());
begin
  for tier_data in
    select tier
    from published_courses pc,
         jsonb_array_elements(pc.pricing_tiers) as tier
    where pc.id = p_published_course_id
      and pc.is_active = true
      and (tier->>'is_active')::boolean = true
    order by (tier->>'position')::integer
  loop
    -- Get effective pricing for this tier
    select * into pricing_info 
    from get_effective_pricing_for_published_tier(p_published_course_id, tier_data->>'id');
    
    return query select
      tier_data->>'id',
      (tier_data->>'payment_frequency')::payment_frequency,
      (tier_data->>'is_free')::boolean,
      (tier_data->>'price')::numeric(19,4),
      tier_data->>'currency_code',
      case when tier_data->>'promotional_price' = 'null' then null 
           else (tier_data->>'promotional_price')::numeric(19,4) end,
      case when tier_data->>'promotion_start_date' = 'null' then null
           else (tier_data->>'promotion_start_date')::timestamptz end,
      case when tier_data->>'promotion_end_date' = 'null' then null
           else (tier_data->>'promotion_end_date')::timestamptz end,
      tier_data->>'tier_name',
      tier_data->>'tier_description',
      (tier_data->>'position')::integer,
      (tier_data->>'is_popular')::boolean,
      (tier_data->>'is_recommended')::boolean,
      pricing_info.effective_price,
      pricing_info.is_promotional;
  end loop;
end;
$$ language plpgsql;