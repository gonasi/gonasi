-- ============================================================================
-- RLS: public.live_session_analytics
-- ============================================================================

alter table public.live_session_analytics enable row level security;

-- ============================================================================
-- SELECT: Organization members can view analytics
-- ============================================================================
create policy "Select: Org members can view analytics"
on public.live_session_analytics
for select
to authenticated
using (
  public.get_user_org_role(organization_id, (select auth.uid())) is not null
);

-- ============================================================================
-- INSERT/UPDATE/DELETE: System-managed (via triggers)
-- No explicit policies needed - handled by security definer functions
-- ============================================================================
