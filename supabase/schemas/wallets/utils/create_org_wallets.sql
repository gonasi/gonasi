-- ===========================================================
-- FUNCTION: public.org_wallets()
-- PURPOSE:
--   For every newly inserted organization (public.organizations),
--   initialize an organization_wallets row for each supported currency.
--
-- BEHAVIOR / SAFETY:
--   - Uses `set search_path = ''` so all object names below are
--     schema-qualified and resolved deterministically.
--   - Idempotent: inserts use ON CONFLICT DO NOTHING.
--   - Returns NEW so this is safe as an AFTER INSERT trigger.
-- ===========================================================
create or replace function public.org_wallets()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  currency public.currency_code;
begin
  -- Loop through every currency defined in public.currency_code
  for currency in select unnest(enum_range(null::public.currency_code)) loop
    -- Insert an organization wallet for this organization + currency
    insert into public.organization_wallets (id, organization_id, currency_code, balance_total, balance_reserved, created_at, updated_at)
    values (
      public.uuid_generate_v4(),      -- id
      new.id,                         -- organization_id (from public.organizations)
      currency,                       -- currency_code
      0::numeric(19,4),               -- balance_total default
      0::numeric(19,4),               -- balance_reserved default
      timezone('utc', now()),         -- created_at
      timezone('utc', now())          -- updated_at
    )
    on conflict (organization_id, currency_code) do nothing;
  end loop;

  -- Return the inserted organization record
  return new;
end;
$$;

-- Create trigger (drop existing first for safe re-deploy)
drop trigger if exists trg_org_wallets on public.organizations;
create trigger trg_org_wallets
after insert on public.organizations
for each row
execute function public.org_wallets();
