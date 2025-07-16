-- ====================================================================================
-- RLS Policy Setup for organization_wallets
-- ====================================================================================
-- Description:
--   - SELECT: Only organization owners and admins can view wallet balances
--   - INSERT & UPDATE: Handled by system roles (e.g., service_role), no RLS policy needed
--   - DELETE: Explicitly disallowed by omitting DELETE policy
-- ====================================================================================

-- Enable Row-Level Security
alter table public.organization_wallets enable row level security;

-- ============================================================================
-- SELECT: Allow only organization owners and admins to view wallet balances
-- ============================================================================
create policy "Select: Only admins and owners can view wallets"
on public.organization_wallets
for select
to authenticated
using (
  public.get_user_org_role(organization_id, (select auth.uid())) in ('owner', 'admin')
);

-- ============================================================================
-- INSERT & UPDATE:
--   - No policy defined
--   - Assumes only backend/system roles (e.g. service_role) will perform these
-- ============================================================================

-- ============================================================================
-- DELETE:
--   - No DELETE policy defined
--   - This prevents any user from deleting organization_wallets
--   - Only possible via elevated/trusted roles (if needed)
-- ============================================================================
