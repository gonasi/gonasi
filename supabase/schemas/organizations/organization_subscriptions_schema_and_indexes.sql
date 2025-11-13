-- ======================================================================
-- ENUM: subscription_status
-- ======================================================================
create type public.subscription_status as enum (
  'active',        -- Billing normally
  'non-renewing',  -- Cancelled but active until period end
  'attention',     -- Payment issue requires user action
  'completed',     -- Fixed-term subscription completed
  'cancelled'      -- Terminated immediately
);

-- ======================================================================
-- TABLE: organization_subscriptions
-- ======================================================================
create table public.organization_subscriptions (
  -- Primary Key
  id uuid primary key default uuid_generate_v4(),

  -- Organization Relationship
  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  -- Current Subscription Tier
  tier subscription_tier not null default 'launch'
    references public.tier_limits(tier)
    on update cascade
    on delete restrict,

  -- Scheduled Downgrade Fields
  next_tier subscription_tier
    references public.tier_limits(tier)
    on update cascade
    on delete restrict,
  next_plan_code text default null,              -- Paystack plan code for upcoming tier
  downgrade_requested_at timestamptz default null,
  downgrade_effective_at timestamptz default null,
  downgrade_executed_at timestamptz default null, -- When downgrade was actually applied
  downgrade_requested_by uuid
    references auth.users(id)
    on delete set null,

  -- Paystack Integration
  paystack_customer_code text unique,
  paystack_subscription_code text unique,

  -- Subscription Status
  status subscription_status not null default 'active',

  -- Period & Billing Info
  start_date timestamptz not null default timezone('utc', now()),
  current_period_start timestamptz not null default timezone('utc', now()),
  current_period_end timestamptz default null,
  cancel_at_period_end boolean not null default false,
  initial_next_payment_date timestamptz default null,

  -- Optional rollback safety: store original tier for post-downgrade audits
  revert_tier subscription_tier
    references public.tier_limits(tier)
    on update cascade
    on delete set null,

  -- Audit Fields
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,

  -- ✅ Exactly one subscription per organization
  constraint unique_subscription_per_org
    unique (organization_id)
);

-- ======================================================================
-- INDEXES
-- ======================================================================
create index idx_org_subscriptions_org_id
  on public.organization_subscriptions (organization_id);

create index idx_org_subscriptions_status
  on public.organization_subscriptions (status);

create index idx_org_subscriptions_tier
  on public.organization_subscriptions (tier);

create index idx_org_subscriptions_next_tier
  on public.organization_subscriptions (next_tier);

create index idx_org_subscriptions_active_period
  on public.organization_subscriptions (status, current_period_end);

create index idx_org_subscriptions_cancel_at_period_end
  on public.organization_subscriptions (cancel_at_period_end)
  where cancel_at_period_end = true;

create index idx_org_subscriptions_downgrade_due
  on public.organization_subscriptions (downgrade_effective_at)
  where cancel_at_period_end = true and next_tier is not null;

create index idx_org_subscriptions_created_by
  on public.organization_subscriptions (created_by);

create index idx_org_subscriptions_updated_by
  on public.organization_subscriptions (updated_by);
