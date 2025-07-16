-- ============================================================================
-- Enable RLS on wallet_transactions
-- ============================================================================
alter table public.wallet_transactions enable row level security;

-- ============================================================================
-- SELECT: Only org owner/admins can view transactions
-- ============================================================================
create policy "Select: Only org owners/admins can view transactions"
on public.wallet_transactions
for select
to authenticated
using (
  exists (
    select 1
    from public.organization_wallets w
    where w.id = wallet_transactions.wallet_id
      and public.get_user_org_role(w.organization_id, (select auth.uid())) in ('owner', 'admin')
  )
);

-- ============================================================================
-- INSERT: Only org owner/admins can insert transactions
-- ============================================================================
create policy "Insert: Only org owners/admins can insert transactions"
on public.wallet_transactions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.organization_wallets w
    where w.id = wallet_transactions.wallet_id
      and public.get_user_org_role(w.organization_id, (select auth.uid())) in ('owner', 'admin')
  )
);


