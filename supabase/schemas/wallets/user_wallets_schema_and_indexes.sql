-- ===========================================================
-- TABLE: user_wallets
-- PURPOSE: Tracks individual users’ balances per currency,
--          including total and reserved amounts.
-- ===========================================================

create table public.user_wallets (
  -- Unique identifier for each wallet
  id uuid primary key default uuid_generate_v4(),

  -- The user this wallet belongs to (linked to Supabase auth.users)
  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  -- Currency code (e.g., 'USD', 'KES', 'EUR')
  currency_code public.currency_code not null,

  -- Total funds available in this user's wallet for this currency
  balance_total numeric(19,4) not null default 0,

  -- Funds reserved (e.g., pending withdrawals, holds)
  balance_reserved numeric(19,4) not null default 0,

  -- ===========================================
  -- AUDIT FIELDS
  -- ===========================================
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  -- Ensure one wallet per user per currency
  unique (user_id, currency_code)
);

-- ===========================================================
-- INDEXES
-- ===========================================================

-- Optimize lookups by user (most common query pattern)
create index idx_user_wallets_user_id
  on public.user_wallets (user_id);

-- Quick lookup or filtering by currency
create index idx_user_wallets_currency_code
  on public.user_wallets (currency_code);

-- Useful for time-based queries or sorting
create index idx_user_wallets_created_at
  on public.user_wallets (created_at);


-- Automatically refresh updated_at on modification
create or replace trigger trg_user_wallets_updated_at
before update on public.user_wallets
for each row
execute function public.update_updated_at_column();
