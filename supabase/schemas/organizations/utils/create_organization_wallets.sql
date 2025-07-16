create or replace function public.create_organization_wallets()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  currency public.currency_code;
begin
  -- Loop through all currency codes defined in the enum
  for currency in select unnest(enum_range(null::public.currency_code))
  loop
    insert into public.organization_wallets (
      organization_id,
      currency_code
    ) values (
      new.id,
      currency
    );
  end loop;

  return new;
end;
$$;
