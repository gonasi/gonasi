insert into public.gonasi_wallets (currency_code, available_balance, pending_balance)
values 
  ('USD', 0.0000, 0.0000),
  ('KES', 0.0000, 0.0000)
on conflict (currency_code) do nothing;
