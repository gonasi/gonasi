-- ============================================================================
-- RLS: public.live_session_messages
-- ============================================================================

alter table public.live_session_messages enable row level security;

-- ============================================================================
-- SELECT: Active participants can view messages
-- ============================================================================
create policy "Select: Active participants can view messages"
on public.live_session_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.live_session_participants lsp
    where lsp.live_session_id = live_session_messages.live_session_id
      and lsp.user_id = (select auth.uid())
      and lsp.status = 'joined'
  )
);

-- ============================================================================
-- INSERT: Active participants can send messages if chat is enabled and session not ended
-- ============================================================================
create policy "Insert: Participants can send messages"
on public.live_session_messages
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.live_session_participants lsp
    join public.live_sessions ls on ls.id = lsp.live_session_id
    where lsp.live_session_id = live_session_messages.live_session_id
      and lsp.user_id = (select auth.uid())
      and lsp.status = 'joined'
      and ls.enable_chat = true
      and ls.status != 'ended'  -- Cannot send messages to ended sessions
  )
);

-- ============================================================================
-- UPDATE: Facilitators can moderate messages (pin, delete, etc.)
-- ============================================================================
create policy "Update: Facilitators can moderate messages"
on public.live_session_messages
for update
to authenticated
using (
  exists (
    select 1
    from public.live_sessions ls
    where ls.id = live_session_messages.live_session_id
      and public.can_user_edit_live_session(ls.id)
  )
);
