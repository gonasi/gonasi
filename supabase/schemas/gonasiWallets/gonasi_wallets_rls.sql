-- Enable Row-Level Security
alter table public.gonasi_wallets enable row level security;

-- Allow SELECT access to users with go_wallet.view permission
create policy gonasi_wallets_select_with_permission
  on public.gonasi_wallets
  for select
  to authenticated
  using (
    (select authorize('go_wallet.view'))
  );
