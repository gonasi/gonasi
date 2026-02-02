-- ============================================================================
-- course_pricing_tiers schema
-- ============================================================================
-- This schema implements a flexible and scalable pricing model for online courses.
-- It supports:
--   - Multiple billing frequencies (e.g., monthly, annually)
--   - Free and paid subscription tiers
--   - Time-limited promotional pricing (discount campaigns)
--   - Custom tier metadata for UI (e.g., labels, badges, sort order)
--   - Business logic enforcement via constraints
--   - Audit tracking for pricing changes
--   - Indexes optimized for UI/admin querying patterns
--
-- Each course may define multiple pricing tiers.
-- A tier can be:
--   - Free: accessible without payment
--   - Paid: includes standard and optional promotional pricing
--
-- Business rules enforced include:
--   - Only one active tier per frequency per course
--   - No promo pricing on free tiers
--   - Promo price must be lower than base price
--   - Valid promotion date windows
--
-- Notes:
--   - All time values are stored as UTC (timestamptz)
--   - Prices use NUMERIC(19,4) for precision and large amounts
-- ============================================================================


-- ============================================================================
-- table: course_pricing_tiers
-- ============================================================================
-- Stores pricing tiers per course, including metadata for billing, UI, and promotions.

create table public.course_pricing_tiers (
  -- Primary key and foreign keys
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,

  -- Pricing configuration
  payment_frequency payment_frequency not null,
  is_free boolean not null default true,
  price numeric(19,4) not null check (price >= 0),
  currency_code currency_code not null default 'KES',

  -- Optional promotional campaign
  promotional_price numeric(19,4) null check (promotional_price >= 0),
  promotion_start_date timestamptz null,
  promotion_end_date timestamptz null,

  -- UI/UX display metadata
  tier_name text null,
  tier_description text null,
  is_active boolean not null default true,
  position integer not null default 0,
  is_popular boolean not null default false,
  is_recommended boolean not null default false,

  -- Audit metadata
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  pricing_version integer not null default 1,
  created_by uuid not null references public.profiles(id) on delete cascade,
  updated_by uuid not null references public.profiles(id) on delete cascade,

  -- ==========================================================================
  -- Business logic constraints
  -- ==========================================================================

  -- Promotion dates must be in proper order if both exist
  constraint chk_promotion_dates check (
    promotion_start_date is null or promotion_end_date is null or 
    promotion_start_date < promotion_end_date
  ),

  -- Promo price must be lower than the base price
  constraint chk_promotional_price check (
    is_free = true or promotional_price is null or promotional_price < price
  ),

  -- Paid tiers must have a price > 0
  constraint chk_price_nonfree check (
    is_free = true or price > 0
  ),

  -- Free tiers must not have any promotional pricing
  constraint chk_free_has_no_promo check (
    is_free = false or (
      promotional_price is null and 
      promotion_start_date is null and 
      promotion_end_date is null
    )
  ),

  -- Enforce a single active tier per frequency per course
  constraint uq_one_active_tier_per_frequency
    unique (course_id, payment_frequency, is_active)
    deferrable initially deferred
);


-- ============================================================================
-- indexes
-- ============================================================================
-- Optimize frequent filtering, sorting, and joins

-- Foreign key join indexes
create index idx_course_pricing_tiers_course_id
  on public.course_pricing_tiers (course_id);

create index idx_course_pricing_tiers_created_by
  on public.course_pricing_tiers (created_by);

create index idx_course_pricing_tiers_updated_by
  on public.course_pricing_tiers (updated_by);

-- Version tracking index
create index idx_course_pricing_tiers_pricing_version
  on public.course_pricing_tiers (pricing_version);

-- Filter by course + is_active
create index idx_course_pricing_tiers_course_id_active 
  on public.course_pricing_tiers (course_id, is_active);

-- Order tiers in UI
create index idx_course_pricing_tiers_position 
  on public.course_pricing_tiers (course_id, position);

-- Search for active promotions
create index idx_course_pricing_tiers_promotion_dates 
  on public.course_pricing_tiers (promotion_start_date, promotion_end_date);

-- UI badge rendering (e.g. "Popular", "Recommended")
create index idx_course_pricing_tiers_popular_recommended 
  on public.course_pricing_tiers (is_popular, is_recommended);

-- Organization-level filters
create index idx_course_pricing_tiers_organization_id
  on public.course_pricing_tiers (organization_id);

-- Filter by organization + is_active
create index idx_course_pricing_tiers_org_active
  on public.course_pricing_tiers (organization_id, is_active);

-- Optional: For org + course filtering
create index idx_course_pricing_tiers_org_course
  on public.course_pricing_tiers (organization_id, course_id);


-- ============================================================================
-- documentation
-- ============================================================================

comment on table public.course_pricing_tiers is 
  'Defines pricing tiers for courses, scoped by organization, supporting free and paid options, multiple billing frequencies, promotional discounts, and customizable display metadata. Includes audit fields and business logic enforcement for pricing integrity.';
