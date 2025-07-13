create or replace function get_effective_pricing_for_published_tier(
  p_published_course_id uuid,   -- ID of the published course
  p_tier_id uuid                -- ID of the pricing tier (now UUID)
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
