-- Function: calculate_access_end_date
-- Purpose: Calculates when access should end based on a start date and payment frequency.
-- Returns: A timestamp with time zone representing the end date.

create or replace function calculate_access_end_date(
  start_date timestamptz,                  -- The start date of the access period
  frequency public.payment_frequency              -- Enum: 'monthly', 'bi_monthly', 'quarterly', etc.
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
