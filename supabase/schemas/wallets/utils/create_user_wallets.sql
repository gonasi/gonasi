-- ===========================================================
-- FUNCTION: public.create_user_wallets()
-- PURPOSE:
--   For every newly inserted user (auth.users), initialize a
--   user_wallets row for each supported currency.
--
-- BEHAVIOR / SAFETY:
--   - Uses `set search_path = ''` so all object names below are
--     schema-qualified and resolved deterministically.
--   - Idempotent: inserts use ON CONFLICT DO NOTHING.
--   - Returns NEW so this is safe as an AFTER INSERT trigger.
-- ===========================================================
create or replace function public.create_user_wallets()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  -- iterate over the enum values; type is fully qualified
  currency public.currency_code;
begin
  -- Loop through every currency defined in public.currency_code
  for currency in select unnest(enum_range(null::public.currency_code)) loop
    -- Insert a wallet row for this user + currency.
    -- All object names are schema-qualified to work with empty search_path.
    insert into public.user_wallets (id, user_id, currency_code, balance_total, balance_reserved, created_at, updated_at)
    values (
      public.uuid_generate_v4(),      -- id
      new.id,                         -- user_id (from auth.users)
      currency,                       -- currency_code
      0::numeric(19,4),               -- balance_total default
      0::numeric(19,4),               -- balance_reserved default
      timezone('utc', now()),         -- created_at
      timezone('utc', now())          -- updated_at
    )
    on conflict (user_id, currency_code) do nothing;
  end loop;

  -- Return the inserted user record (standard for AFTER INSERT triggers)
  return new;
end;
$$;

-- Create trigger (drop existing first for safe re-deploy)
drop trigger if exists trg_create_user_wallets on auth.users;
create trigger trg_create_user_wallets
after insert on auth.users
for each row
execute function public.create_user_wallets();
