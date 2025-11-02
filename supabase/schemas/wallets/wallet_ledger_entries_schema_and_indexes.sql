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
-- ==========================================================================
-- ENUM TYPES FOR WALLET LEDGER
-- ==========================================================================

-- Wallet types
create type public.wallet_type as enum (
  'platform',
  'organization', 
  'user',
  'external'
);

-- Transaction direction
create type public.transaction_direction as enum (
  'credit',
  'debit'
);

-- Transaction types with business context
create type public.ledger_transaction_type as enum (
  'course_purchase',
  
  -- PAYMENT INFLOWS
  'payment_inflow',
  
  -- REVENUE DISTRIBUTION
  'org_payout',
  'platform_revenue',
  
  -- EXPENSE TRACKING
  'payment_gateway_fee',
  
  -- SUBSCRIPTIONS
  'subscription_payment',
  
  -- DIGITAL PRODUCTS
  'ai_credit_purchase',
  
  -- SPONSORSHIPS & PARTNERSHIPS
  'sponsorship_payment',
  
  -- FUNDS MANAGEMENT
  'funds_hold',
  'funds_release',
  
  -- PAYOUTS & WITHDRAWALS
  'withdrawal_request',
  'withdrawal_complete',
  'withdrawal_failed',
  
  -- INCENTIVES & REWARDS
  'reward_payout',
  
  -- REFUNDS & REVERSALS
  'refund',
  'chargeback',
  
  -- ADJUSTMENTS & CORRECTIONS
  'manual_adjustment',
  'currency_conversion',
  
  -- COMPLIANCE & LEGAL
  'tax_withholding',
  'tax_remittance'
);

-- ==========================================================================
-- WALLET LEDGER ENTRIES TABLE
-- ==========================================================================

create table public.wallet_ledger_entries (
  -- CORE IDENTIFIERS
  id uuid primary key default uuid_generate_v4(),

  -- SOURCE WALLET
  source_wallet_id uuid,
  source_wallet_type public.wallet_type not null,

  -- DESTINATION WALLET
  destination_wallet_id uuid,
  destination_wallet_type public.wallet_type not null,

  -- TRANSACTION DETAILS
  currency_code public.currency_code not null,
  amount numeric(19,4) not null check (amount > 0),
  direction public.transaction_direction not null,

  -- Paystack reference for reconciliation and idempotency
  payment_reference text not null,

  -- TRANSACTION TYPE (Business Context)
  type public.ledger_transaction_type not null,
  status public.transaction_status not null default 'completed',

  -- CONTEXT & METADATA
  related_entity_type text,
  related_entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,

  -- AUDIT FIELDS
  created_at timestamptz not null default timezone('utc', now()),

  -- INTEGRITY CONSTRAINTS
  constraint wallet_tx_external_source_id_null check (
    (source_wallet_type = 'external' and source_wallet_id is null)
    or (source_wallet_type != 'external')
  ),

  constraint wallet_tx_external_dest_id_null check (
    (destination_wallet_type = 'external' and destination_wallet_id is null)
    or (destination_wallet_type != 'external')
  )
);

-- ==========================================================================
-- INDEXES FOR PERFORMANCE
-- ==========================================================================

-- Index for finding transactions by wallet (most common query)
create index idx_wallet_ledger_source_wallet 
  on public.wallet_ledger_entries(source_wallet_id, created_at desc);

create index idx_wallet_ledger_destination_wallet 
  on public.wallet_ledger_entries(destination_wallet_id, created_at desc);

-- Index for filtering by type and status
create index idx_wallet_ledger_type_status 
  on public.wallet_ledger_entries(type, status, created_at desc);

-- Index for finding by reference (idempotency checks)
create index idx_wallet_ledger_payment_reference 
  on public.wallet_ledger_entries(payment_reference);

-- Index for related entity lookups
create index idx_wallet_ledger_related_entity 
  on public.wallet_ledger_entries(related_entity_type, related_entity_id);

-- GIN index for metadata searches
create index idx_wallet_ledger_metadata 
  on public.wallet_ledger_entries using gin(metadata);