-- ===========================================================
-- MIGRATION: Seed Existing Wallets
-- -----------------------------------------------------------
-- Creates wallets for all existing users, organizations, and
-- platform-level accounts across all supported currencies.
--
-- Safe to re-run: all inserts use ON CONFLICT DO NOTHING.
-- Search path is empty, so all objects are explicitly qualified.
-- ===========================================================

-- Ensure search_path is empty for this migration
set search_path = '';

do $$
declare
  currency public.currency_code;
begin
  -- ==========================================
  -- 1. PLATFORM WALLETS
  -- ==========================================
  for currency in select unnest(enum_range(null::public.currency_code)) loop
    insert into public.platform_wallets (
      currency_code,
      balance_total,
      balance_reserved,
      created_at,
      updated_at
    )
    values (
      currency,
      0::numeric(19,4),
      0::numeric(19,4),
      timezone('utc', now()),
      timezone('utc', now())
    )
    on conflict (currency_code) do nothing;
  end loop;

  -- ==========================================
  -- 2. ORGANIZATION WALLETS
  -- ==========================================
  insert into public.org_wallets (
    organization_id,
    currency_code,
    balance_total,
    balance_reserved,
    created_at,
    updated_at
  )
  select
    o.id,
    c.currency,
    0::numeric(19,4),
    0::numeric(19,4),
    timezone('utc', now()),
    timezone('utc', now())
  from public.organizations o
  cross join unnest(enum_range(null::public.currency_code)) as c(currency)
  on conflict (organization_id, currency_code) do nothing;

  -- ==========================================
  -- 3. USER WALLETS
  -- ==========================================
  insert into public.user_wallets (
    user_id,
    currency_code,
    balance_total,
    balance_reserved,
    created_at,
    updated_at
  )
  select
    u.id,
    c.currency,
    0::numeric(19,4),
    0::numeric(19,4),
    timezone('utc', now()),
    timezone('utc', now())
  from auth.users u
  cross join unnest(enum_range(null::public.currency_code)) as c(currency)
  on conflict (user_id, currency_code) do nothing;

end
$$ language plpgsql;
