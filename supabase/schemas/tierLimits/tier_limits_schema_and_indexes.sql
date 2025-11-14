-- ===================================================
-- TYPE: public.subscription_tier
-- ===================================================
create type public.subscription_tier as enum (
  'launch',
  'scale',
  'impact',
  'enterprise'
);

-- ===================================================
-- TYPE: public.analytics_level
-- ===================================================
create type public.analytics_level as enum (
  'basic',
  'intermediate',
  'advanced',
  'enterprise'
);

-- ===================================================
-- TYPE: public.support_level
-- ===================================================
create type public.support_level as enum (
  'community',
  'email',
  'priority',
  'dedicated'
);

-- ===================================================
-- TABLE: public.tier_limits
-- ===================================================
create table public.tier_limits (
  -- Primary key = subscription tier
  tier subscription_tier primary key,

  -- Organizational limits
  storage_limit_mb_per_org integer not null check (storage_limit_mb_per_org >= 0),

  -- Team size
  max_members_per_org integer not null check (max_members_per_org >= 0),

  -- Course-related limits
  max_free_courses_per_org integer not null check (max_free_courses_per_org >= 0),

  -- AI tooling
  ai_tools_enabled boolean not null default true,
  ai_usage_limit_monthly integer check (ai_usage_limit_monthly is null or ai_usage_limit_monthly >= 0),

  -- Custom domains
  custom_domains_enabled boolean not null default false,
  max_custom_domains integer check (max_custom_domains is null or max_custom_domains >= 0),

  -- Feature depth (enums)
  analytics_level analytics_level not null,
  support_level support_level not null,

  -- Revenue sharing
  platform_fee_percentage decimal(5,2) not null default 15.00
    check (platform_fee_percentage >= 0 and platform_fee_percentage <= 100),

  -- Branding
  white_label_enabled boolean not null default false,

  -- Pricing (USD)
  price_monthly_usd numeric(10,2) not null default 0.00 check (price_monthly_usd >= 0),
  price_yearly_usd numeric(10,2) not null default 0.00 check (price_yearly_usd >= 0),

  -- Paystack integration
  paystack_plan_id text unique,
  paystack_plan_code text unique,
  plan_currency text not null default 'USD',
  plan_interval text not null default 'monthly',

  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ===================================================
-- Indexes (additional to PK + uniques)
-- ===================================================

-- Faster filtering by pricing or lookup by interval/currency
create index tier_limits_price_monthly_usd_idx on public.tier_limits (price_monthly_usd);
create index tier_limits_price_yearly_usd_idx on public.tier_limits (price_yearly_usd);

-- Lookup plans by interval + currency combinations
create index tier_limits_plan_interval_currency_idx
  on public.tier_limits (plan_interval, plan_currency);

-- Analytics and support levels (useful for feature gating queries)
create index tier_limits_analytics_level_idx on public.tier_limits (analytics_level);
create index tier_limits_support_level_idx on public.tier_limits (support_level);

-- Custom domains & AI gating checks
create index tier_limits_custom_domains_enabled_idx on public.tier_limits (custom_domains_enabled);
create index tier_limits_ai_tools_enabled_idx on public.tier_limits (ai_tools_enabled);


-- Trigger to update `updated_at` on changes
create trigger trg_tier_limits_updated_at
  before update on public.tier_limits
  for each row
  execute function public.update_updated_at_column();

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
  with check (authorize('go_su_create'));

-- Allow authorized users to update tier limits
create policy "Authorized users can update tier limits"
  on public.tier_limits
  for update
  to authenticated
  using (authorize('go_su_update'));

-- Allow authorized users to delete tier limits
create policy "Authorized users can delete tier limits"
  on public.tier_limits
  for delete
  to authenticated
  using (authorize('go_su_delete'));

