-- ============================================================================
-- TABLE: user_purchases
-- PURPOSE:
--   Records finalized (fully paid) user purchases for courses, subscriptions,
--   or digital goods. Every row represents a confirmed transaction that has
--   already passed through the wallet ledger system.
-- ============================================================================

create table public.user_purchases (
  id uuid primary key default uuid_generate_v4(),

  -- RELATIONSHIPS
  user_id uuid not null references auth.users(id) on delete cascade,
  published_course_id uuid references public.published_courses(id) on delete set null,

  -- PURCHASE DETAILS
  amount_paid numeric(19,4) not null check (amount_paid > 0),
  currency_code public.currency_code not null,
  transaction_type public.ledger_transaction_type not null default 'payment_inflow',
  payment_reference text not null unique, -- e.g., Paystack reference

  -- STATUS (all completed purchases only)
  status public.transaction_status not null default 'completed',

  -- CONTEXTUAL DATA
  metadata jsonb not null default '{}'::jsonb,
  purchased_at timestamptz not null default timezone('utc', now()),

  -- AUDIT
  created_at timestamptz not null default timezone('utc', now())
);

-- ============================================================================
-- INDEXES
-- ============================================================================
create index idx_user_purchases_user_id on public.user_purchases(user_id);
create index idx_user_purchases_course_id on public.user_purchases(published_course_id);
