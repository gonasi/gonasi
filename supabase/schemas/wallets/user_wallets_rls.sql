-- ===========================================================
-- RLS: Restrict access to wallet owner
-- ===========================================================

-- Enable row level security
alter table public.user_wallets enable row level security;

-- Allow authenticated users to select only their own wallets
create policy "user_wallets_select_own"
on public.user_wallets
for select
to authenticated
using (
  user_id = (select auth.uid())
);
