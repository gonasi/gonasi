-- ============================================================================
-- RLS: public.live_session_reactions
-- ============================================================================

alter table public.live_session_reactions enable row level security;

-- ============================================================================
-- SELECT: Participants can view reactions
-- ============================================================================
create policy "Select: Participants can view reactions"
on public.live_session_reactions
for select
to authenticated
using (
  exists (
    select 1
    from public.live_session_participants lsp
    where lsp.live_session_id = live_session_reactions.live_session_id
      and lsp.user_id = (select auth.uid())
  )
);

-- ============================================================================
-- INSERT: Active participants can add reactions if enabled
-- ============================================================================
create policy "Insert: Participants can add reactions"
on public.live_session_reactions
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.live_session_participants lsp
    join public.live_sessions ls on ls.id = lsp.live_session_id
    where lsp.live_session_id = live_session_reactions.live_session_id
      and lsp.user_id = (select auth.uid())
      and lsp.status = 'joined'
      and ls.enable_reactions = true
  )
);
