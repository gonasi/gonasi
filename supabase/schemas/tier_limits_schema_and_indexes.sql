-- ===================================================
-- TYPE: public.subscription_tier
-- ===================================================
create type subscription_tier as enum (
  'launch',
  'scale',
  'impact',
  'enterprise'
);

-- ===================================================
-- TYPE: public.analytics_level
-- ===================================================
-- Defines depth of analytics & reporting features available on a tier.
-- Used by the platform to gate insights or dashboards.
-- ===================================================
create type analytics_level as enum (
  'basic',
  'intermediate',
  'advanced',
  'enterprise'
);

-- ===================================================
-- TYPE: public.support_level
-- ===================================================
-- Defines the level of support available to a given subscription tier.
-- Can be used to route support requests or prioritize SLAs.
-- ===================================================
create type support_level as enum (
  'community',
  'email',
  'priority',
  'dedicated'
);

-- ===================================================
-- TABLE: public.tier_limits
-- ===================================================
create table tier_limits (
  tier subscription_tier primary key,

  -- Organizational limits
  max_organizations_per_user integer not null,
  storage_limit_mb_per_org integer not null,

  -- Team size
  max_members_per_org integer not null,

  -- Course-related limits
  max_free_courses_per_org integer not null,  -- Paid courses are unlimited

  -- AI tooling
  ai_tools_enabled boolean not null default true,
  ai_usage_limit_monthly integer,             -- Null means unlimited

  -- Custom domains
  custom_domains_enabled boolean not null default false,
  max_custom_domains integer,

  -- Feature depth (now enums)
  analytics_level analytics_level not null,
  support_level support_level not null,

  -- Revenue sharing
  platform_fee_percentage decimal(5,2) not null default 15.00,

  -- Branding
  white_label_enabled boolean not null default false,

  -- Pricing
  price_monthly_usd numeric(10, 2) not null default 0.00,
  price_yearly_usd numeric(10, 2) not null default 0.00
);


-- ====================================================================================
-- RLS POLICIES FOR: public.tier_limits
-- ====================================================================================
alter table public.tier_limits enable row level security;

-- Allow public (anon and authenticated users) to read tier limits
create policy "Public can read tier limits"
  on public.tier_limits
  for select
  to authenticated, anon
  using (true);

-- Allow authorized users to insert new tier limits
create policy "Authorized users can insert tier limits"
  on public.tier_limits
  for insert
  to authenticated
  with check ((select authorize('pricing_tier.crud')));

-- Allow authorized users to update tier limits
create policy "Authorized users can update tier limits"
  on public.tier_limits
  for update
  to authenticated
  using ((select authorize('pricing_tier.crud')));

-- Allow authorized users to delete tier limits
create policy "Authorized users can delete tier limits"
  on public.tier_limits
  for delete
  to authenticated
  using ((select authorize('pricing_tier.crud')));

