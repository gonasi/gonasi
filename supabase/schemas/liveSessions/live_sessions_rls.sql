-- ============================================================================
-- RLS: public.live_sessions
-- ============================================================================

alter table public.live_sessions enable row level security;

-- ============================================================================
-- SELECT: Any organization member can view sessions
-- ============================================================================
create policy "Select: Org members can view sessions"
on public.live_sessions
for select
to authenticated
using (
  public.get_user_org_role(organization_id, (select auth.uid())) is not null
);

-- ============================================================================
-- INSERT: Org members (owner/admin/editor) can create sessions
--         EXCEPT if org is on 'temp' tier
-- ============================================================================
create policy "Insert: Org members can create sessions"
on public.live_sessions
for insert
to authenticated
with check (
  public.get_user_org_role(organization_id, (select auth.uid())) in ('owner', 'admin', 'editor')
  and public.get_org_tier(organization_id) != 'temp'
);

-- ============================================================================
-- UPDATE: Admins OR designated session facilitators
-- ============================================================================
create policy "Update: Admins or facilitators can update sessions"
on public.live_sessions
for update
using (
  public.can_user_edit_live_session(id)
)
with check (
  public.can_user_edit_live_session(id)
);

-- ============================================================================
-- DELETE: Only admins/owners may delete sessions
--         → Facilitators CANNOT delete sessions.
--         → EXCEPT if org is on 'temp' tier
-- ============================================================================
create policy "Delete: Admins can delete sessions"
on public.live_sessions
for delete
to authenticated
using (
  public.get_user_org_role(organization_id, (select auth.uid())) in ('owner', 'admin')
  and public.get_org_tier(organization_id) != 'temp'
);
