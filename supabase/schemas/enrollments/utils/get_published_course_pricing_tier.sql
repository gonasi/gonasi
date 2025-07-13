create or replace function get_published_course_pricing_tier(
  p_published_course_id uuid,   -- The ID of the published course
  p_tier_id uuid                -- The ID of the pricing tier (now UUID)
) 
returns table (
  tier_id uuid,                 -- Changed from text to uuid
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
  course_pricing_tiers jsonb;
begin
  -- First, get the course and validate it exists
  select pc.pricing_tiers into course_pricing_tiers
  from public.published_courses pc
  where pc.id = p_published_course_id
    and pc.is_active = true;

  -- Check if course exists
  if not found then
    raise exception 'Published course not found or inactive: %', p_published_course_id;
  end if;

  -- Check if pricing_tiers is null or not an array
  if course_pricing_tiers is null then
    raise exception 'Course has no pricing tiers configured: %', p_published_course_id;
  end if;

  -- Check if pricing_tiers is actually a JSONB array
  if jsonb_typeof(course_pricing_tiers) != 'array' then
    raise exception 'Course pricing_tiers is not a valid array for course: %', p_published_course_id;
  end if;

  -- Extract the pricing tier JSON object matching the tier ID
  select tier into tier_data
  from jsonb_array_elements(course_pricing_tiers) as tier
  where (tier->>'id')::uuid = p_tier_id                  -- Convert JSON string to UUID for comparison
    and (tier->>'is_active')::boolean = true;             -- Only include active tiers

  -- Raise error if no such tier is found
  if tier_data is null then
    raise exception 'Pricing tier not found or inactive: % for course: %', p_tier_id, p_published_course_id;
  end if;

  -- Return the parsed tier fields, casting from JSONB to proper types
  return query select
    (tier_data->>'id')::uuid,    -- Cast to UUID
    (tier_data->>'payment_frequency')::payment_frequency,
    (tier_data->>'is_free')::boolean,
    (tier_data->>'price')::numeric(19,4),
    tier_data->>'currency_code',

    -- Handle nullable promotional price
    case 
      when tier_data->>'promotional_price' = 'null' or tier_data->>'promotional_price' is null then null
      else (tier_data->>'promotional_price')::numeric(19,4)
    end,

    -- Handle nullable promotion start date
    case 
      when tier_data->>'promotion_start_date' = 'null' or tier_data->>'promotion_start_date' is null then null
      else (tier_data->>'promotion_start_date')::timestamptz
    end,

    -- Handle nullable promotion end date
    case 
      when tier_data->>'promotion_end_date' = 'null' or tier_data->>'promotion_end_date' is null then null
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