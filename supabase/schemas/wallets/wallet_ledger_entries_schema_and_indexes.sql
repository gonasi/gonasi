-- ===========================================================
-- TABLE: wallet_ledger_entries
-- PURPOSE: Records all financial movements between wallets 
--          (platform, organization, user, and external). Each 
--          record represents a single atomic debit or credit.
--
-- NOTE:
--   - External wallets represent off-platform entities (e.g. Paystack, banks).
--   - Paystack fees are absorbed by the PLATFORM, not by organizations.
--     → Organizations always receive their full share.
-- ===========================================================

create table public.wallet_ledger_entries (
  -- ===========================================================
  -- CORE IDENTIFIERS
  -- ===========================================================
  id uuid primary key default uuid_generate_v4(),

  -- ===========================================================
  -- SOURCE WALLET
  -- ===========================================================
  -- The wallet from which funds originate (debited wallet).
  -- May be 'external' if the funds come from an outside source
  -- (e.g., Paystack payment, bank deposit).
  source_wallet_id uuid,
  source_wallet_type text check (
    source_wallet_type in ('platform', 'organization', 'user', 'external')
  ),

  -- ===========================================================
  -- DESTINATION WALLET
  -- ===========================================================
  -- The wallet receiving the funds (credited wallet).
  -- May be 'external' if funds are leaving the platform
  -- (e.g., withdrawal to bank, payment processor fees).
  destination_wallet_id uuid,
  destination_wallet_type text check (
    destination_wallet_type in ('platform', 'organization', 'user', 'external')
  ),

  -- ===========================================================
  -- TRANSACTION DETAILS
  -- ===========================================================

  -- The currency used in this transaction (must match both wallets if internal)
  currency_code public.currency_code not null,

  -- Positive transaction amount
  amount numeric(19,4) not null check (amount > 0),

  -- Direction of movement relative to the "actor" wallet
  -- - 'credit': Funds are added to the wallet
  -- - 'debit' : Funds are deducted from the wallet
  direction text not null check (direction in ('credit', 'debit')),

  -- ===========================================================
  -- TRANSACTION TYPE (Business Context)
  -- ===========================================================
  -- Describes *why* the transaction occurred. Each type represents 
  -- a specific business event in the system.
  --
  -- ▸ 'course_sale'           → Payment from learner via Paystack to platform.
  --                             Platform receives gross amount, then splits payout
  --                             (organization gets full share; Paystack fee deducted
  --                             from platform’s commission).
  -- ▸ 'course_sale_payout'    → Payout from platform to organization after sale.
  -- ▸ 'subscription_payment'  → Recurring payment from user/org for a subscription plan.
  -- ▸ 'ai_credit_purchase'    → Organization purchases AI usage credits or tokens.
  -- ▸ 'sponsorship_payment'   → Funds received from sponsor for featured placement.
  -- ▸ 'funds_hold'            → Temporary reservation (e.g. pending reward payout).
  -- ▸ 'funds_release'         → Reversal of a previous hold (funds made available).
  -- ▸ 'reward_payout'         → Incentive or bonus disbursed to a user.
  -- ▸ 'withdrawal_request'    → User/org initiates withdrawal to external account.
  -- ▸ 'withdrawal_complete'   → Withdrawal successfully completed.
  -- ▸ 'withdrawal_revert'     → Failed withdrawal; funds returned to wallet.
  -- ▸ 'platform_fee'          → Commission or service fee charged by the platform.
  -- ▸ 'paystack_fee'          → Payment processor fee deducted from the platform cut.
  --
  -- Adding new transaction types should follow this convention:
  --   1. Prefix with entity/action category (e.g., 'refund_', 'bonus_', 'adjustment_').
  --   2. Keep all lowercase with underscores.
  --   3. Update reporting/analytics logic accordingly.
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

  -- Transaction lifecycle status
  status transaction_status not null default 'completed',

  -- ===========================================================
  -- CONTEXT & METADATA
  -- ===========================================================

  -- Optionally link this transaction to a related business entity
  -- Examples:
  --  - course_sale → related_entity_type = 'course', related_entity_id = <uuid>
  --  - withdrawal  → related_entity_type = 'withdrawal', related_entity_id = <uuid>
  related_entity_type text,
  related_entity_id uuid,

  -- Arbitrary structured data for additional details, e.g.:
  -- {
  --   "payment_reference": "psk_123abc",
  --   "platform_cut": 150.00,
  --   "paystack_fee": 30.00,
  --   "org_share": 850.00,
  --   "note": "January sale split"
  -- }
  metadata jsonb not null default '{}'::jsonb,

  -- ===========================================================
  -- AUDIT FIELDS
  -- ===========================================================
  created_at timestamptz not null default timezone('utc', now()),

  -- ===========================================================
  -- INTEGRITY CONSTRAINTS
  -- ===========================================================

  -- Currency must always be provided.
  constraint wallet_ledger_entries_currency_not_null check (
    currency_code is not null
  ),

  -- Source and destination wallet IDs must be NULL when wallet type is 'external'.
  constraint wallet_tx_external_id_null check (
    (source_wallet_type = 'external' and source_wallet_id is null)
    or (source_wallet_type != 'external')
  ),

  constraint wallet_tx_external_dest_id_null check (
    (destination_wallet_type = 'external' and destination_wallet_id is null)
    or (destination_wallet_type != 'external')
  )
);

-- ===========================================================
-- INDEXES
-- ===========================================================

-- Common lookup: get all outgoing or incoming transactions for a wallet
create index idx_wallet_tx_source_wallet
  on public.wallet_ledger_entries (source_wallet_id, source_wallet_type);

create index idx_wallet_tx_destination_wallet
  on public.wallet_ledger_entries (destination_wallet_id, destination_wallet_type);

-- Filter by currency for analytics and reconciliation
create index idx_wallet_tx_currency
  on public.wallet_ledger_entries (currency_code);

-- Fast chronological queries and ledger reports
create index idx_wallet_tx_created_at
  on public.wallet_ledger_entries (created_at);

-- For joining or searching transactions linked to a specific business entity
create index idx_wallet_tx_related_entity
  on public.wallet_ledger_entries (related_entity_type, related_entity_id);
