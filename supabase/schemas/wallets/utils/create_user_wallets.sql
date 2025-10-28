-- ===========================================================
-- FUNCTION: public.create_user_wallets()
-- PURPOSE:
--   For every newly inserted user (auth.users), initialize a
--   user_wallets row for each supported currency.
-- SECURITY:
--   - SECURITY DEFINER ensures inserts succeed regardless of caller.
--   - search_path is emptied for safety against search_path injection.
--   - Function should be owned by a privileged role (e.g. postgres).
-- ===========================================================
create or replace function public.create_user_wallets()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  currency public.currency_code;
begin
  for currency in select unnest(enum_range(null::public.currency_code)) 
  loop
    -- Log which wallet is being created
    raise notice 'Creating user wallet in % for org %', currency, new.id;

    insert into public.user_wallets (
      user_id,
      currency_code
    )
    values (
      new.id,
      currency
    )
    on conflict (user_id, currency_code) do nothing;
  end loop;

  return new;
end;
$$;

-- Ensure ownership and permissions
alter function public.create_user_wallets() owner to postgres;
revoke all on function public.create_user_wallets() from public;
grant execute on function public.create_user_wallets() to postgres; -- only trigger will use it

-- Drop and recreate trigger
drop trigger if exists trg_create_user_wallets on auth.users;

create trigger trg_create_user_wallets
after insert on auth.users
for each row
execute function public.create_user_wallets();
