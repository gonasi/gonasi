-- ===========================================================
-- FUNCTION: public.create_organization_wallets()
-- PURPOSE:
--   Automatically initialize an organization_wallets row for
--   every supported currency when a new organization is created.
--
-- BEHAVIOR / SAFETY:
--   - Sets `search_path` to '' to ensure schema-qualified lookups.
--   - Idempotent: inserts use ON CONFLICT DO NOTHING.
--   - Safe as an AFTER INSERT trigger — returns NEW.
-- ===========================================================
create or replace function public.create_organization_wallets()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  currency public.currency_code;
begin
  -- For each defined currency, create a wallet for the new organization
  for currency in select unnest(enum_range(null::public.currency_code)) 
  loop
    -- Log which wallet is being created
    raise notice 'Creating wallet in % for org %', currency, new.id;

    insert into public.organization_wallets (
      organization_id,
      currency_code
    )
    values (
      new.id,                     -- organization_id
      currency                    -- currency_code
    )
    on conflict (organization_id, currency_code) do nothing;
  end loop;

  return new;
end;
$$;

-- Ensure ownership and permissions
alter function public.create_organization_wallets() owner to postgres;
revoke all on function public.create_organization_wallets() from public;
grant execute on function public.create_organization_wallets() to postgres; -- only trigger will use it


-- ===========================================================
-- TRIGGER: trg_create_organization_wallets
-- PURPOSE:
--   Calls public.create_organization_wallets() after an organization
--   is inserted to set up its wallets automatically.
-- ===========================================================
drop trigger if exists trg_create_organization_wallets on public.organizations;

create trigger trg_create_organization_wallets
after insert on public.organizations
for each row
execute function public.create_organization_wallets();
