-- ==========================================================
-- ENUM TYPE: subscription_status
-- ==========================================================
-- This enum defines the possible billing states of an organization's subscription.
-- It is used to track the lifecycle of a subscription — from trial to active, 
-- to cancellation or payment issues.
-- ==========================================================
-- ==========================================================
-- ENUM TYPE: subscription_status
-- ==========================================================
create type public.subscription_status as enum (
  'active',       -- Billing or trialing normally
  'non-renewing', -- Cancelled but active until period end
  'attention',    -- Payment issue requires action
  'completed',    -- Fixed-term subscription completed
  'cancelled'     -- Terminated immediately
);

-- ==========================================================
-- TABLE: organization_subscriptions
-- ==========================================================
create table public.organization_subscriptions (
  -- Primary Key
  id uuid primary key default uuid_generate_v4(),

  -- Organization Relationship
  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  -- Subscription Tier
  tier subscription_tier not null default 'launch'
    references public.tier_limits(tier)
    on update cascade
    on delete restrict,

  -- Subscription Status
  status subscription_status not null default 'active',

  -- Dates
  start_date timestamptz not null default timezone('utc', now()),
  current_period_start timestamptz not null default timezone('utc', now()),
  current_period_end timestamptz default null,
  cancel_at_period_end boolean not null default false,
  initial_next_payment_date timestamptz default null,

  -- Audit Fields
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,

  -- ✅ Correct invariant: exactly one subscription per organization
  constraint unique_subscription_per_org
    unique (organization_id)
);

-- Indexes
create index idx_org_subscriptions_org_id
  on public.organization_subscriptions (organization_id);

create index idx_org_subscriptions_status
  on public.organization_subscriptions (status);

create index idx_org_subscriptions_tier
  on public.organization_subscriptions (tier);

create index idx_org_subscriptions_active_period
  on public.organization_subscriptions (status, current_period_end);

create index idx_org_subscriptions_created_by
  on public.organization_subscriptions (created_by);

create index idx_org_subscriptions_updated_by
  on public.organization_subscriptions (updated_by);
