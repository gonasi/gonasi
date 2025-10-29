-- ===========================================================
-- TABLE: public.gonasi_wallets
-- PURPOSE:
--   Tracks Gonasi's internal balances per currency — representing
--   platform-level funds such as total inflows, reserves, payouts,
--   or other ledger-level balances.
--
-- NOTES:
--   - One row per supported currency.
--   - Balances are expressed in smallest currency units
--     (e.g., cents, kobo) using numeric(19,4) for precision.
--   - Typically updated by internal financial or payout processes.
-- ===========================================================
-- former platform_wallets
create table public.gonasi_wallets (
  -- Unique identifier for each Gonasi wallet entry
  id uuid primary key default uuid_generate_v4(),

  -- ISO 4217 currency code (e.g. 'USD', 'KES', 'EUR')
  currency_code public.currency_code not null unique,

  -- Total funds held by Gonasi in this currency
  balance_total numeric(19,4) not null default 0,

  -- Portion of funds reserved (e.g. pending disbursements, holds)
  balance_reserved numeric(19,4) not null default 0,

  -- ===========================================
  -- AUDIT FIELDS
  -- ===========================================
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- ===========================================================
-- INDEXES
-- ===========================================================

-- Lookup by currency (already unique, but speeds up joins/lookups)
create index idx_gonasi_wallets_currency_code
  on public.gonasi_wallets (currency_code);

-- Support chronological queries (e.g. audit trails, sorting)
create index idx_gonasi_wallets_created_at
  on public.gonasi_wallets (created_at);

-- ===========================================================
-- TRIGGERS
-- ===========================================================

-- Automatically refresh updated_at on modification
create or replace trigger trg_gonasi_wallets_updated_at
before update on public.gonasi_wallets
for each row
execute function public.update_updated_at_column();
