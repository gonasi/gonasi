create or replace function public.create_organization_wallets()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  currency public.currency_code;
begin
  -- Loop through all currency codes defined in the enum
  for currency in select unnest(enum_range(null::public.currency_code))
  loop
    -- Log which wallet is being created
    raise notice 'Creating wallet in % for org %', currency, new.id;

    -- Insert wallet row
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
