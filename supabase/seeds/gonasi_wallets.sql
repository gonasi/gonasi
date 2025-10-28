-- Insert Gonasi wallet balances for supported currencies
insert into public.gonasi_wallets (currency_code, balance_total, balance_reserved)
values
  ('USD', 0, 0),
  ('KES', 0, 0)
on conflict (currency_code) do nothing;