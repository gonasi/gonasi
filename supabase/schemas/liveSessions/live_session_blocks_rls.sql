-- ============================================================================
-- RLS: public.live_session_blocks
-- ============================================================================

alter table public.live_session_blocks enable row level security;

-- ============================================================================
-- SELECT: Any organization member can view blocks
-- ============================================================================
create policy "Select: Org members can view blocks"
on public.live_session_blocks
for select
to authenticated
using (
  public.get_user_org_role(organization_id, (select auth.uid())) is not null
);

-- ============================================================================
-- INSERT: Admins OR designated session facilitators can create blocks
-- ============================================================================
create policy "Insert: Admins or facilitators can create blocks"
on public.live_session_blocks
for insert
to authenticated
with check (
  public.can_user_edit_live_session(live_session_id)
);

-- ============================================================================
-- UPDATE: Admins OR designated session facilitators can update blocks
-- ============================================================================
create policy "Update: Admins or facilitators can update blocks"
on public.live_session_blocks
for update
to authenticated
using (
  public.can_user_edit_live_session(live_session_id)
)
with check (
  public.can_user_edit_live_session(live_session_id)
);

-- ============================================================================
-- DELETE: Admins OR designated session facilitators can delete blocks
-- ============================================================================
create policy "Delete: Admins or facilitators can delete blocks"
on public.live_session_blocks
for delete
to authenticated
using (
  public.can_user_edit_live_session(live_session_id)
);
