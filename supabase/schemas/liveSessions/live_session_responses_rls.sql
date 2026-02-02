-- ============================================================================
-- RLS: public.live_session_responses
-- ============================================================================

alter table public.live_session_responses enable row level security;

-- ============================================================================
-- SELECT: Org members can view responses in their sessions
-- ============================================================================
create policy "Select: Org members can view responses"
on public.live_session_responses
for select
to authenticated
using (
  exists (
    select 1
    from public.live_sessions ls
    where ls.id = live_session_responses.live_session_id
      and public.get_user_org_role(ls.organization_id, (select auth.uid())) is not null
  )
);

-- ============================================================================
-- INSERT: Active participants can submit responses to active blocks
-- ============================================================================
create policy "Insert: Participants can submit responses"
on public.live_session_responses
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.live_session_participants lsp
    where lsp.id = live_session_responses.participant_id
      and lsp.user_id = (select auth.uid())
      and lsp.live_session_id = live_session_responses.live_session_id
      and lsp.status = 'joined'
  )
  and exists (
    select 1
    from public.live_session_blocks lsb
    where lsb.id = live_session_responses.live_session_block_id
      and lsb.status = 'active'
  )
);
