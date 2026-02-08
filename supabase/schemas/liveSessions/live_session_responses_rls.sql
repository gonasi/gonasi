-- ============================================================================
-- RLS: public.live_session_responses
-- ============================================================================

alter table public.live_session_responses enable row level security;

-- ============================================================================
-- SELECT: Org members can view responses in their sessions OR users can view their own responses
-- ============================================================================
create policy "Select: Org members can view responses or users can view their own"
on public.live_session_responses
for select
to authenticated
using (
  -- User can view their own responses
  user_id = (select auth.uid())
  or
  -- Or org members can view all responses in their sessions
  exists (
    select 1
    from public.live_sessions ls
    where ls.id = live_session_responses.live_session_id
      and public.get_user_org_role(ls.organization_id, (select auth.uid())) is not null
  )
);

-- ============================================================================
-- INSERT: Active participants can submit responses to active blocks (session not ended)
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
    join public.live_sessions ls on ls.id = lsb.live_session_id
    where lsb.id = live_session_responses.live_session_block_id
      and lsb.status = 'active'
      and ls.status != 'ended'  -- Cannot submit responses to ended sessions
  )
);
