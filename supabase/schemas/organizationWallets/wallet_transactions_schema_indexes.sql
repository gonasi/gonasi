-- ====================================================================================
-- TABLE: wallet_transactions
-- Description:
--   Tracks all money movements in and out of an organization wallet.
--   Includes payouts (course sales), withdrawals, refunds, and manual adjustments.
-- ====================================================================================

create table public.wallet_transactions (
  id uuid primary key default uuid_generate_v4(),

  -- Associated wallet
  wallet_id uuid not null references public.organization_wallets(id) on delete cascade,

  -- Transaction type:
  -- 'payout'     - credit from course sales
  -- 'withdrawal' - debit when org requests a payout
  -- 'refund'     - debit to return money to a user
  -- 'adjustment' - manual credit/debit by admin
  type text not null check (type in ('payout', 'withdrawal', 'refund', 'adjustment')),

  -- Amount must be non-negative; use 'direction' to determine net effect
  amount numeric(19,4) not null check (amount >= 0),

  -- Direction of movement:
  -- 'credit' - adds to available balance
  -- 'debit'  - removes from available balance
  direction text not null check (direction in ('credit', 'debit')),

  -- Course payment linkage (only for payouts)
  course_payment_id uuid references public.course_payments(id) on delete set null,

  -- Withdrawal linkage (optional, only for withdrawals)
  withdrawal_request_id uuid,

  -- Arbitrary extra info (e.g., Paystack reference, admin note)
  metadata jsonb,

  -- Audit
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles(id) on delete set null
);

-- ====================================================================================
-- INDEXES
-- ====================================================================================

-- Index for quickly finding all transactions for a wallet
create index idx_wallet_transactions_wallet_id
  on public.wallet_transactions (wallet_id);

-- Index to filter by direction or type (e.g., reporting, balances)
create index idx_wallet_transactions_direction
  on public.wallet_transactions (direction);

create index idx_wallet_transactions_type
  on public.wallet_transactions (type);

-- Index for course payout lookups
create index idx_wallet_transactions_course_payment_id
  on public.wallet_transactions (course_payment_id);

-- Index for withdrawal tracking
create index idx_wallet_transactions_withdrawal_request_id
  on public.wallet_transactions (withdrawal_request_id);

-- Index for foreign key: wallet_transactions.created_by → profiles.id
create index idx_wallet_transactions_created_by
  on public.wallet_transactions (created_by);