-- Function: calculate_access_end_date
-- Purpose: Calculates when access should end based on a start date and payment frequency.
-- Returns: A timestamp with time zone representing the end date.

create or replace function calculate_access_end_date(
  start_date timestamptz,                  -- The start date of the access period
  frequency payment_frequency              -- Enum: 'monthly', 'bi_monthly', 'quarterly', etc.
) 
returns timestamptz
language plpgsql
immutable
set search_path = ''
as $$
begin
  -- Return the corresponding interval added to the start_date
  return case frequency
    when 'monthly' then       start_date + interval '1 month'
    when 'bi_monthly' then    start_date + interval '2 months'
    when 'quarterly' then     start_date + interval '3 months'
    when 'semi_annual' then   start_date + interval '6 months'
    when 'annual' then        start_date + interval '12 months'
  end;
end;
$$;



-- Function: get_published_course_pricing_tier
-- Purpose: Extracts and returns a specific pricing tier from a published course's `pricing_tiers` JSONB.
-- Returns: A table with detailed tier metadata.

create or replace function get_published_course_pricing_tier(
  p_published_course_id uuid,   -- The ID of the published course
  p_tier_id text                -- The ID of the pricing tier (stored as string inside JSON)
) 
returns table (
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
  is_active boolean,
  "position" integer,
  is_popular boolean,
  is_recommended boolean
)
language plpgsql
set search_path = ''
as $$
declare
  tier_data jsonb;
begin
  -- Extract the pricing tier JSON object matching the tier ID
  select tier into tier_data
  from public.published_courses pc,
    jsonb_array_elements(pc.pricing_tiers) as tier
  where pc.id = p_published_course_id
    and pc.is_active = true                               -- Only consider active courses
    and tier->>'id' = p_tier_id                           -- Match tier by ID
    and (tier->>'is_active')::boolean = true;             -- Only include active tiers

  -- Raise error if no such tier is found
  if tier_data is null then
    raise exception 'Pricing tier not found or inactive: %', p_tier_id;
  end if;

  -- Return the parsed tier fields, casting from JSONB to proper types
  return query select
    tier_data->>'id',
    (tier_data->>'payment_frequency')::payment_frequency,
    (tier_data->>'is_free')::boolean,
    (tier_data->>'price')::numeric(19,4),
    tier_data->>'currency_code',

    -- Handle nullable promotional price
    case 
      when tier_data->>'promotional_price' = 'null' then null
      else (tier_data->>'promotional_price')::numeric(19,4)
    end,

    -- Handle nullable promotion start date
    case 
      when tier_data->>'promotion_start_date' = 'null' then null
      else (tier_data->>'promotion_start_date')::timestamptz
    end,

    -- Handle nullable promotion end date
    case 
      when tier_data->>'promotion_end_date' = 'null' then null
      else (tier_data->>'promotion_end_date')::timestamptz
    end,

    tier_data->>'tier_name',
    tier_data->>'tier_description',
    (tier_data->>'is_active')::boolean,
    (tier_data->>'position')::integer,
    (tier_data->>'is_popular')::boolean,
    (tier_data->>'is_recommended')::boolean;
end;
$$;


-- Function: get_effective_pricing_for_published_tier
-- Purpose: Computes the effective price (regular or promotional) for a course tier at the current time.
-- Returns: A table with the effective price, whether it's promotional, and the raw promotional price.

-- Function: get_effective_pricing_for_published_tier
-- Purpose: Computes the effective price (regular or promotional) for a course tier at the current time.
-- Returns: A table with the effective price, whether it's promotional, and the raw promotional price.

create or replace function get_effective_pricing_for_published_tier(
  p_published_course_id uuid,   -- ID of the published course
  p_tier_id text                -- ID of the pricing tier
) 
returns table (
  effective_price numeric(19,4),        -- Final price to be paid
  is_promotional boolean,               -- Indicates whether a promotion is active
  promotional_price numeric(19,4)       -- Raw promotional price (may be null)
)
language plpgsql
set search_path = ''
as $$
declare
  tier_record record;
  now_utc timestamptz := timezone('utc', now());  -- Use UTC for reliable comparisons
begin
  -- Retrieve the tier's pricing and promotional details
  select * into tier_record
  from public.get_published_course_pricing_tier(p_published_course_id, p_tier_id)
  limit 1;


  -- Determine if a promotion is currently active
  if tier_record.promotional_price is not null
    and tier_record.promotion_start_date is not null
    and tier_record.promotion_end_date is not null
    and tier_record.promotion_start_date <= now_utc
    and tier_record.promotion_end_date >= now_utc then

    -- Use promotional price if promotion is active
    return query select 
      tier_record.promotional_price,
      true,
      tier_record.promotional_price;
  else
    -- Use regular price if no active promotion
    return query select 
      tier_record.price,
      false,
      tier_record.promotional_price;
  end if;
end;
$$;
