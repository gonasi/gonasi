create type public.payment_frequency as enum (
  'monthly',        -- every month (standard)
  'bi_monthly',     -- every 2 months
  'quarterly',      -- every 3 months (business-friendly)
  'semi_annual',    -- every 6 months
  'annual'          -- every 12 months (typically discounted)
);