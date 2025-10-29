-- ============================================================================
-- TABLE: wallet_ledger_entries
-- PURPOSE:
--   Records all financial movements between wallets (platform, organization,
--   user, and external). Each record represents a single atomic debit or credit.
--
-- NOTES:
--   - External wallets represent off-platform entities (e.g. Paystack, banks).
--   - Paystack fees are absorbed by the PLATFORM, not by organizations.
--     → Organizations always receive their full share.
--   - Multiple ledger entries may share the same Paystack reference.
--     → Use this for reconciliation, not uniqueness.
-- ============================================================================

create table public.wallet_ledger_entries (
  -- ==========================================================================
  -- CORE IDENTIFIERS
  -- ==========================================================================
  id uuid primary key default uuid_generate_v4(),

  -- ==========================================================================
  -- SOURCE WALLET
  -- ==========================================================================
  source_wallet_id uuid,
  source_wallet_type text check (
    source_wallet_type in ('platform', 'organization', 'user', 'external')
  ),

  -- ==========================================================================
  -- DESTINATION WALLET
  -- ==========================================================================
  destination_wallet_id uuid,
  destination_wallet_type text check (
    destination_wallet_type in ('platform', 'organization', 'user', 'external')
  ),

  -- ==========================================================================
  -- TRANSACTION DETAILS
  -- ==========================================================================
  currency_code public.currency_code not null,
  amount numeric(19,4) not null check (amount > 0),
  direction text not null check (direction in ('credit', 'debit')),

  -- Paystack reference used for reconciliation and idempotency checks
  paystack_reference text not null,

  -- ==========================================================================
  -- TRANSACTION TYPE (Business Context)
  -- ==========================================================================
  type text not null check (
    type in (
      'course_sale',
      'course_sale_payout',
      'subscription_payment',
      'ai_credit_purchase',
      'sponsorship_payment',
      'funds_hold',
      'funds_release',
      'reward_payout',
      'withdrawal_request',
      'withdrawal_complete',
      'withdrawal_revert',
      'platform_fee',
      'paystack_fee'
    )
  ),

  status transaction_status not null default 'completed',

  -- ==========================================================================
  -- CONTEXT & METADATA
  -- ==========================================================================
  related_entity_type text,
  related_entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,

  -- ==========================================================================
  -- AUDIT FIELDS
  -- ==========================================================================
  created_at timestamptz not null default timezone('utc', now()),

  -- ==========================================================================
  -- INTEGRITY CONSTRAINTS
  -- ==========================================================================
  constraint wallet_ledger_entries_currency_not_null check (
    currency_code is not null
  ),

  constraint wallet_tx_external_id_null check (
    (source_wallet_type = 'external' and source_wallet_id is null)
    or (source_wallet_type != 'external')
  ),

  constraint wallet_tx_external_dest_id_null check (
    (destination_wallet_type = 'external' and destination_wallet_id is null)
    or (destination_wallet_type != 'external')
  )
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Lookup transactions by source or destination
create index idx_wallet_tx_source_wallet
  on public.wallet_ledger_entries (source_wallet_id, source_wallet_type);

create index idx_wallet_tx_destination_wallet
  on public.wallet_ledger_entries (destination_wallet_id, destination_wallet_type);

-- Filter by currency for analytics and reconciliation
create index idx_wallet_tx_currency
  on public.wallet_ledger_entries (currency_code);

-- Chronological queries and ledger reports
create index idx_wallet_tx_created_at
  on public.wallet_ledger_entries (created_at);

-- Business entity linkage
create index idx_wallet_tx_related_entity
  on public.wallet_ledger_entries (related_entity_type, related_entity_id);

-- Paystack reconciliation (non-unique — multiple entries may share same ref)
create index idx_wallet_tx_paystack_reference
  on public.wallet_ledger_entries (paystack_reference)
  where paystack_reference is not null;

-- Optional composite index for fast lookups by Paystack reference + type
create index idx_wallet_tx_paystack_reference_type
  on public.wallet_ledger_entries (paystack_reference, type)
  where paystack_reference is not null;
