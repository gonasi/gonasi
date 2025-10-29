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
      -- ======================================================================
      -- PAYMENT INFLOWS (Money coming into the platform)
      -- ======================================================================
      'payment_inflow',
      -- Money received from external payment gateway (net of gateway fees)
      -- Direction: credit to platform wallet
      -- Example: Customer pays 100 KES, Paystack deducts 1.5 KES, 
      --          platform receives 98.5 KES
      -- Source: external → Destination: platform

      -- ======================================================================
      -- REVENUE DISTRIBUTION (How money is split internally)
      -- ======================================================================
      'org_payout',
      -- Payment from platform to organization for their share of a sale
      -- Direction: debit from platform, credit to organization
      -- Example: Of the 100 KES sale, organization gets 80 KES
      -- Source: platform → Destination: organization

      'platform_revenue',
      -- Platform's earned revenue recognition (net of all fees)
      -- Direction: credit to platform (internal accounting entry)
      -- Example: Platform keeps 18.5 KES (20 KES fee - 1.5 KES gateway cost)
      -- Source: platform → Destination: platform

      -- ======================================================================
      -- EXPENSE TRACKING (Costs incurred by the platform)
      -- ======================================================================
      'payment_gateway_fee',
      -- Fee paid to payment gateway (Paystack, Stripe, etc.)
      -- Direction: debit from platform
      -- Example: 1.5 KES deducted by Paystack
      -- Source: platform → Destination: external

      -- ======================================================================
      -- SUBSCRIPTIONS (Recurring payments)
      -- ======================================================================
      'subscription_payment',
      -- Monthly/annual subscription payment received
      -- Direction: credit to platform or organization wallet
      -- Example: User pays for monthly platform subscription
      -- Source: external → Destination: platform/organization

      -- ======================================================================
      -- DIGITAL PRODUCTS (One-time purchases)
      -- ======================================================================
      'ai_credit_purchase',
      -- Purchase of AI credits/tokens by users
      -- Direction: credit to platform wallet
      -- Example: User buys 1000 AI credits for 50 KES
      -- Source: external → Destination: platform

      -- ======================================================================
      -- SPONSORSHIPS & PARTNERSHIPS
      -- ======================================================================
      'sponsorship_payment',
      -- Payment received from sponsors or partners
      -- Direction: credit to organization wallet
      -- Example: Company sponsors a course for 5000 KES
      -- Source: external → Destination: organization

      -- ======================================================================
      -- FUNDS MANAGEMENT (Temporary holds & releases)
      -- ======================================================================
      'funds_hold',
      -- Temporary hold on funds (escrow, pending verification)
      -- Direction: debit from available balance, credit to held balance
      -- Example: Hold 1000 KES pending payout approval
      -- Source: organization → Destination: platform (held)

      'funds_release',
      -- Release of previously held funds
      -- Direction: debit from held balance, credit to available balance
      -- Example: Release 1000 KES after verification complete
      -- Source: platform (held) → Destination: organization

      -- ======================================================================
      -- PAYOUTS & WITHDRAWALS (Money leaving the platform)
      -- ======================================================================
      'withdrawal_request',
      -- Organization requests to withdraw funds to their bank
      -- Direction: debit from organization available balance
      -- Status: pending
      -- Example: Organization requests 50,000 KES withdrawal
      -- Source: organization → Destination: external (pending)

      'withdrawal_complete',
      -- Withdrawal successfully sent to bank account
      -- Direction: Updates status of withdrawal_request to completed
      -- Example: Bank confirms 50,000 KES received
      -- Updates existing withdrawal_request entry

      'withdrawal_failed',
      -- Withdrawal failed (bank rejected, invalid account, etc.)
      -- Direction: credit back to organization available balance
      -- Example: Bank rejects transfer, refund 50,000 KES to wallet
      -- Source: external → Destination: organization

      -- ======================================================================
      -- INCENTIVES & REWARDS
      -- ======================================================================
      'reward_payout',
      -- Rewards, bonuses, or incentive payments to users/organizations
      -- Direction: debit from platform, credit to user/organization
      -- Example: 500 KES referral bonus paid to user
      -- Source: platform → Destination: user/organization

      -- ======================================================================
      -- REFUNDS & REVERSALS
      -- ======================================================================
      'refund',
      -- Full or partial refund of a previous payment
      -- Direction: debit from organization, credit to platform → external
      -- Example: Course refund of 100 KES to customer
      -- Source: organization → Destination: external

      'chargeback',
      -- Payment reversed due to dispute/fraud
      -- Direction: debit from organization wallet
      -- Example: Customer disputes 100 KES charge, bank reverses it
      -- Source: organization → Destination: external

      -- ======================================================================
      -- ADJUSTMENTS & CORRECTIONS
      -- ======================================================================
      'manual_adjustment',
      -- Manual correction by admin (positive or negative)
      -- Direction: varies (must include reason in metadata)
      -- Example: Correct accounting error, add/subtract from wallet
      -- Source: varies → Destination: varies
      -- ⚠️ Requires admin approval and detailed audit trail

      'currency_conversion',
      -- Exchange rate adjustment when converting between currencies
      -- Direction: debit one currency, credit another
      -- Example: Convert 100 USD to 13,000 KES
      -- Source: wallet (USD) → Destination: wallet (KES)

      -- ======================================================================
      -- COMPLIANCE & LEGAL
      -- ======================================================================
      'tax_withholding',
      -- Tax withheld from payout (required in some jurisdictions)
      -- Direction: debit from organization payout
      -- Example: Withhold 16% VAT from 10,000 KES payout
      -- Source: organization → Destination: platform (tax holding)

      'tax_remittance'
      -- Tax paid to tax authority
      -- Direction: debit from platform tax holding account
      -- Example: Remit 1,600 KES VAT to Kenya Revenue Authority
      -- Source: platform (tax holding) → Destination: external
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
