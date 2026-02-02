-- ============================================================================
-- RLS: public.live_session_participants
-- ============================================================================

alter table public.live_session_participants enable row level security;

-- ============================================================================
-- SELECT: Any organization member can view participants
-- ============================================================================
create policy "Select: Org members can view participants"
on public.live_session_participants
for select
to authenticated
using (
  exists (
    select 1
    from public.live_sessions ls
    where ls.id = live_session_participants.live_session_id
      and public.get_user_org_role(ls.organization_id, (select auth.uid())) is not null
  )
);

-- ============================================================================
-- INSERT: Users can join sessions via RPC (organization membership checked in RPC)
-- ============================================================================
create policy "Insert: Users can join sessions"
on public.live_session_participants
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.live_sessions ls
    where ls.id = live_session_participants.live_session_id
      and public.get_user_org_role(ls.organization_id, (select auth.uid())) is not null
  )
);

-- ============================================================================
-- UPDATE: Users can update their own participation OR facilitators can manage
-- ============================================================================
create policy "Update: Users or facilitators can update participants"
on public.live_session_participants
for update
to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.live_sessions ls
    where ls.id = live_session_participants.live_session_id
      and public.can_user_edit_live_session(ls.id)
  )
);

-- ============================================================================
-- DELETE: Only admins/owners or facilitators can remove participants
-- ============================================================================
create policy "Delete: Admins or facilitators can remove participants"
on public.live_session_participants
for delete
to authenticated
using (
  exists (
    select 1
    from public.live_sessions ls
    where ls.id = live_session_participants.live_session_id
      and public.can_user_edit_live_session(ls.id)
  )
);
