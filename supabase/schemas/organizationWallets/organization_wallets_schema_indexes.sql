-- ====================================================================================
-- TABLE: organization_wallets
-- Description: Holds wallet balances per organization and currency.
-- Each organization can only have one wallet per currency.
-- ====================================================================================
create table public.organization_wallets (
  id uuid primary key default uuid_generate_v4(),

  organization_id uuid not null references public.organizations(id) on delete cascade,
  currency_code public.currency_code not null,  -- e.g., 'USD', 'KES'

  available_balance numeric(19,4) not null default 0,  -- Available for withdrawal
  pending_balance numeric(19,4) not null default 0,    -- Pending (e.g., in review or refund buffer)

  -- Audit fields
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  -- Ensure one wallet per currency per organization
  unique (organization_id, currency_code)
);


-- ====================================================================================
-- INDEXES
-- ====================================================================================
-- Optional: Fast lookup by organization_id
create index idx_organization_wallets_organization_id
  on public.organization_wallets (organization_id);

-- Optional: Fast filtering by currency (e.g., admin dashboards or payouts per currency)
create index idx_organization_wallets_currency_code
  on public.organization_wallets (currency_code);

-- Optional: For sorting/filtering recent wallet updates
create index idx_organization_wallets_updated_at
  on public.organization_wallets (updated_at);
