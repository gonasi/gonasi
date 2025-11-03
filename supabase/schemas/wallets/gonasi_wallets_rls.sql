-- Enable Row-Level Security
alter table public.gonasi_wallets enable row level security;

create policy gonasi_wallets_select_with_permission
  on public.gonasi_wallets
  for select
  to authenticated
  using (
    authorize('go_su_read')
    or authorize('go_admin_read')
  );
