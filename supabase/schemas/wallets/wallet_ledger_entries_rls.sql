-- ============================================================================
-- Enable Row-Level Security on wallet_ledger_entries table
-- ============================================================================
alter table public.wallet_ledger_entries enable row level security;

-- ============================================================================
-- SELECT: Allow go_su, go_admin, and org owner/admin to read wallet_ledger_entries
-- ============================================================================
create policy "Select: go_su, go_admin, or org owner/admin can read wallet_ledger_entries"
on public.wallet_ledger_entries
for select
to authenticated
using (
  -- Platform-wide privileged users
  authorize('go_su_read')
  or authorize('go_admin_read')

  -- Or organization-level access via organization_wallets
  or public.get_user_org_role(
      coalesce(
        (select ow.organization_id
          from public.organization_wallets ow
          where ow.id = wallet_ledger_entries.source_wallet_id
          limit 1),
        (select ow.organization_id
          from public.organization_wallets ow
          where ow.id = wallet_ledger_entries.destination_wallet_id
          limit 1)
      ),
      (select auth.uid())
    ) in ('owner', 'admin')
);
