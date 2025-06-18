-- ============================================================================
-- course_pricing_tiers schema
-- ============================================================================
-- This schema implements a flexible and scalable pricing model for online courses.
-- It enables support for:
--   - Multiple billing cycles (e.g., monthly, quarterly, annually)
--   - Free and paid subscription tiers
--   - Time-limited promotional pricing (discount campaigns)
--   - Tier display metadata (e.g., names, badges, positioning)
--   - Fine-grained business rules via constraints
--   - Audit trail for pricing changes
--   - Indexed queries optimized for performance in UI and admin views
--
-- Each course can define multiple pricing tiers based on frequency and features.
-- A tier can be:
--   - Free: accessible to all without payment
--   - Paid: with standard and optional promotional pricing
--
-- Business rules are enforced using CHECK constraints and a unique index to ensure:
--   - Only one active tier per frequency per course
--   - No promotional pricing on free tiers
--   - Promotional prices are always lower than the base price
--   - Time windows for promotions are logically ordered
--
-- All time values are stored in UTC using timestamptz for consistency.
-- All prices are stored in `NUMERIC(19,4)` to handle large and fractional values.
-- ============================================================================

-- ============================================================================
-- enum: payment_frequency
-- ============================================================================
-- Defines valid billing cycles for recurring course subscriptions.
-- Used to normalize tier frequency and restrict to known values.

create type payment_frequency as enum (
  'monthly',        -- every month (standard)
  'bi_monthly',     -- every 2 months
  'quarterly',      -- every 3 months (business-friendly)
  'semi_annual',    -- every 6 months
  'annual'          -- every 12 months (typically discounted)
);

-- ============================================================================
-- table: course_pricing_tiers
-- ============================================================================
-- Defines one or more pricing tiers for each course.
-- Tiers may differ in billing frequency, price, promotional campaigns, and UI visibility.

create table public.course_pricing_tiers (
  -- unique tier ID and foreign key to owning course
  id uuid default uuid_generate_v4() primary key,
  course_id uuid not null references courses(id) on delete cascade,

  -- frequency and pricing configuration
  payment_frequency payment_frequency not null,
  is_free boolean not null default true, -- free vs paid tier
  price numeric(19,4) not null check (price >= 0), -- base price if paid
  currency_code char(3) not null default 'KES'
    check (currency_code in ('KES', 'USD')), -- restrict to accepted currencies

  -- optional promotional pricing window
  promotional_price numeric(19,4) null check (promotional_price >= 0),
  promotion_start_date timestamptz null,
  promotion_end_date timestamptz null,

  -- display-related metadata (for UI representation)
  tier_name text null,         -- user-facing label, e.g. "Annual Premium"
  tier_description text null,  -- marketing or feature-based description

  -- visibility and ordering in UI
  is_active boolean not null default true, -- soft delete support
  position integer not null default 0,     -- sort order among tiers

  -- UI badges and marketing flags
  is_popular boolean not null default false,      -- show "Most Popular" tag
  is_recommended boolean not null default false,  -- show "Recommended" tag

  -- audit trail
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid not null references profiles(id) on delete cascade,
  updated_by uuid not null references profiles(id) on delete cascade,

  -- ==========================================================================
  -- business logic constraints
  -- ==========================================================================

  -- promotion dates must be in valid chronological order
  constraint chk_promotion_dates check (
    promotion_start_date is null or promotion_end_date is null or 
    promotion_start_date < promotion_end_date
  ),

  -- promotional price must be less than the regular price
  constraint chk_promotional_price check (
    is_free = true or promotional_price is null or promotional_price < price
  ),

  -- paid tiers must have a price greater than zero
  constraint chk_price_nonfree check (
    is_free = true or price > 0
  ),

  -- free tiers cannot have promotional pricing
  constraint chk_free_has_no_promo check (
    is_free = false or (
      promotional_price is null and 
      promotion_start_date is null and 
      promotion_end_date is null
    )
  ),

  -- only one active tier per frequency per course
  constraint uq_one_active_tier_per_frequency
    unique (course_id, payment_frequency, is_active)
    deferrable initially deferred
);

-- ============================================================================
-- indexes
-- ============================================================================
-- Improves query performance for filtering, sorting, and joins

-- foreign key join indexes
create index idx_course_pricing_tiers_course_id 
  on public.course_pricing_tiers (course_id);

create index idx_course_pricing_tiers_created_by 
  on public.course_pricing_tiers (created_by);

create index idx_course_pricing_tiers_updated_by 
  on public.course_pricing_tiers (updated_by);

-- active tier filtering and UI ordering
create index idx_course_pricing_tiers_course_id_active 
  on public.course_pricing_tiers (course_id, is_active);

create index idx_course_pricing_tiers_position 
  on public.course_pricing_tiers (course_id, position);

-- promotional pricing lookups
create index idx_course_pricing_tiers_promotion_dates 
  on public.course_pricing_tiers (promotion_start_date, promotion_end_date);

-- ui enhancements (e.g., showing badges)
create index idx_course_pricing_tiers_popular_recommended 
  on public.course_pricing_tiers (is_popular, is_recommended);

-- ============================================================================
-- documentation
-- ============================================================================
-- High-level description of this table for Postgres-native introspection tools

comment on table public.course_pricing_tiers is 
  'Defines pricing tiers for courses, supporting free and paid options, multiple billing frequencies, promotional discounts, and customizable display metadata. Includes audit fields and business logic enforcement for pricing integrity.';
