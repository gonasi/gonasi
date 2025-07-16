alter table public.gonasi_wallet_transactions enable row level security;

create policy gonasi_wallet_transactions_select_with_permission
  on public.gonasi_wallet_transactions
  for select
  to authenticated
  using (
    (select authorize('go_wallet.view'))
  );


create policy gonasi_wallet_transactions_update_with_permission
  on public.gonasi_wallet_transactions
  for update
  to authenticated
  using (
    (select authorize('go_wallet.withdraw'))
  )
  with check (
    (select authorize('go_wallet.withdraw'))
  );
