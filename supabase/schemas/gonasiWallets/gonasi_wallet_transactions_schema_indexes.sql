create table public.gonasi_wallet_transactions (
  id uuid primary key default uuid_generate_v4(),

  wallet_id uuid not null references public.gonasi_wallets(id) on delete restrict, -- The associated Gonasi wallet

  type text not null check (type in ('platform_fee', 'withdrawal', 'adjustment')), -- Nature of the transaction
  direction text not null check (direction in ('credit', 'debit')),               -- Whether it adds to or removes from the wallet
  amount numeric(19,4) not null check (amount >= 0),                              -- Absolute amount (>= 0)

  course_payment_id uuid references public.course_payments(id) on delete set null,       -- Nullable if tied to course payment
  metadata jsonb,                                                                 -- Optional extra data

  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())                  -- Auto-updated on row change
);

-- ============================================================================
-- TRIGGER: Auto-update `updated_at` on row update
-- ============================================================================
create trigger set_updated_at_gonasi_wallet_transactions
before update on public.gonasi_wallet_transactions
for each row
execute function public.update_updated_at_column();

-- Fast lookup by wallet
create index idx_gonasi_wallet_transactions_wallet_id
  on public.gonasi_wallet_transactions(wallet_id);

-- Filter by type (e.g., for fee reporting or withdrawal audits)
create index idx_gonasi_wallet_transactions_type
  on public.gonasi_wallet_transactions(type);

-- Filter by direction (debit vs credit)
create index idx_gonasi_wallet_transactions_direction
  on public.gonasi_wallet_transactions(direction);

-- Efficient queries by payment link
create index idx_gonasi_wallet_transactions_course_payment_id
  on public.gonasi_wallet_transactions(course_payment_id);

-- Timestamp index for recent activity
create index idx_gonasi_wallet_transactions_created_at
  on public.gonasi_wallet_transactions(created_at desc);
