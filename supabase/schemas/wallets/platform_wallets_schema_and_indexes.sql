-- ===========================================================
-- TABLE: platform_wallets
-- PURPOSE: Tracks the platform’s total and reserved balances per currency.
-- ===========================================================

create table public.platform_wallets (
  -- Unique identifier for each wallet
  id uuid primary key default uuid_generate_v4(),

  -- Currency code (e.g., 'USD', 'KES', 'EUR')
  currency_code public.currency_code not null,

  -- Total funds available in the platform wallet for this currency
  balance_total numeric(19,4) not null default 0,

  -- Funds reserved (e.g., pending withdrawals, holds)
  balance_reserved numeric(19,4) not null default 0,

  -- ===========================================
  -- AUDIT FIELDS
  -- ===========================================
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  -- Ensure only one wallet per currency exists
  unique (currency_code)
);

-- ===========================================================
-- INDEXES
-- ===========================================================

-- Quick lookup by currency code
create index idx_platform_wallets_currency_code
  on public.platform_wallets (currency_code);

-- For audit queries or ordering by creation date
create index idx_platform_wallets_created_at
  on public.platform_wallets (created_at);
