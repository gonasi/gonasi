-- ==========================================================
-- ENUM TYPE: subscription_status
-- ==========================================================
-- This enum defines the possible billing states of an organization's subscription.
-- It is used to track the lifecycle of a subscription — from trial to active, 
-- to cancellation or payment issues.
-- ==========================================================
create type public.subscription_status as enum (
  'active',      -- The organization has an active, fully paid subscription
  'canceled',    -- The subscription was canceled, but access may continue until the current period ends
  'past_due',    -- The last payment failed or is overdue
  'trialing',    -- The organization is in a trial period (not yet paying)
  'incomplete'   -- Subscription setup failed (e.g., payment method not added or incomplete checkout)
);

-- ==========================================================
-- TABLE: organization_subscriptions
-- ==========================================================
-- Purpose:
--   Stores subscription details for each organization.
--   Each organization should have at most one active subscription at a time.
--
-- Typical usage:
--   - Tracks which tier (Launch, Grow, Scale, etc.) an organization is on
--   - Integrates with payment gateways (e.g., Paystack)
--   - Helps manage trial periods, renewals, and cancellations
-- ==========================================================
create table public.organization_subscriptions (
  -- ======================================================
  -- Primary Key
  -- ======================================================
  id uuid primary key default uuid_generate_v4(),

  -- ======================================================
  -- Organization Relationship
  -- ======================================================
  -- Each subscription belongs to exactly one organization.
  -- If the organization is deleted, the subscription is removed as well.
  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  -- ======================================================
  -- Subscription Tier
  -- ======================================================
  -- Defines the current plan/tier for the organization.
  -- The `tier_limits` table defines what features each tier provides.
  -- Default: 'launch' (the free tier with no expiration).
  tier subscription_tier not null default 'launch'
    references public.tier_limits(tier)
    on update cascade
    on delete restrict,  -- Prevent deleting a tier that is in use

  -- ======================================================
  -- Subscription Status
  -- ======================================================
  -- Tracks the current state of the subscription.
  -- Common statuses:
  --   - 'active': Paid or trialing
  --   - 'canceled': Set to end after the current billing cycle
  --   - 'past_due': Payment failed
  --   - 'incomplete': Setup issue or missing payment method
  status subscription_status not null default 'active',

  -- ======================================================
  -- Date Tracking
  -- ======================================================
  start_date timestamptz not null default timezone('utc', now()),
    -- When the subscription originally started

  current_period_start timestamptz not null default timezone('utc', now()),
    -- When the current billing period began

  current_period_end timestamptz default null,
    -- When the current billing period ends.
    -- For free tiers (like 'launch'), this stays NULL since there's no expiry.

  cancel_at_period_end boolean not null default false,
    -- Indicates whether the subscription will automatically cancel when the current period ends

  -- ======================================================
  -- Audit Fields
  -- ======================================================
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  -- Track who created or updated this record (optional)
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,

  -- ======================================================
  -- Constraints
  -- ======================================================
  constraint one_active_subscription_per_org
    unique (organization_id, status)
    deferrable initially deferred
    -- Ensures each organization has only one active subscription at a time.
    -- Deferred so updates can occur safely within a transaction (e.g., renewing or upgrading a plan)
);

-- ==========================================================
-- INDEXES
-- ==========================================================
-- These indexes make common queries faster.
-- For example:
--   - Checking which organizations are on a certain tier
--   - Fetching active subscriptions for billing
--   - Looking up subscriptions by payment provider codes
-- ==========================================================

-- Common lookup patterns
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
