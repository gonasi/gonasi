-- ===========================================================
-- TABLE: org_wallets
-- PURPOSE: Tracks each organization's balances per currency,
--          including total and reserved funds.
-- ===========================================================

create table public.org_wallets (
  -- Unique identifier for each wallet
  id uuid primary key default uuid_generate_v4(),

  -- The organization this wallet belongs to
  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  -- Currency code (e.g., 'USD', 'KES', 'EUR')
  currency_code public.currency_code not null,

  -- Total funds available in this organization's wallet for this currency
  balance_total numeric(19,4) not null default 0,

  -- Funds reserved (e.g., pending transactions or holds)
  balance_reserved numeric(19,4) not null default 0,

  -- ===========================================
  -- AUDIT FIELDS
  -- ===========================================
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  -- Ensure one wallet per organization per currency
  unique (organization_id, currency_code)
);

-- ===========================================================
-- INDEXES
-- ===========================================================

-- Speed up lookups by organization (most common query pattern)
create index idx_org_wallets_organization_id
  on public.org_wallets (organization_id);

-- Quick lookup by currency within organization context
create index idx_org_wallets_currency_code
  on public.org_wallets (currency_code);

-- Useful for time-based sorting or recent audit queries
create index idx_org_wallets_created_at
  on public.org_wallets (created_at);
