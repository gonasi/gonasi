-- ============================================================================
-- TABLE: gonasi_wallets
-- Description: Tracks Gonasi's internal balances (e.g. platform fees) per currency.
-- ============================================================================
create table public.gonasi_wallets (
  id uuid primary key default uuid_generate_v4(), -- Unique wallet ID

  currency_code currency_code not null unique,    -- e.g., 'USD', 'KES'. One wallet per currency

  available_balance numeric(19,4) not null default 0,  -- Cleared, usable balance
  pending_balance numeric(19,4) not null default 0,    -- Buffer for refunds/processing

  created_at timestamptz not null default timezone('utc', now()), -- Creation timestamp
  updated_at timestamptz not null default timezone('utc', now())  -- Auto-updated on row change
);

-- ============================================================================
-- TRIGGER: Auto-update `updated_at` on update
-- ============================================================================
create trigger set_updated_at_gonasi_wallets
before update on public.gonasi_wallets
for each row
execute function public.update_updated_at_column();
