-- ============================================================================
-- RLS: public.live_session_test_responses
-- ============================================================================

alter table public.live_session_test_responses enable row level security;

-- ============================================================================
-- SELECT: Org members can view test responses OR facilitators can view their own
-- ============================================================================
create policy "Select: Org members can view test responses or facilitators can view their own"
on public.live_session_test_responses
for select
to authenticated
using (
  -- Facilitator can view their own test responses
  facilitator_id = (select auth.uid())
  or
  -- Or org members can view all test responses in their sessions
  exists (
    select 1
    from public.live_sessions ls
    where ls.id = live_session_test_responses.live_session_id
      and public.get_user_org_role(ls.organization_id, (select auth.uid())) is not null
  )
);

-- ============================================================================
-- INSERT: Facilitators can submit test responses (session not ended)
-- ============================================================================
create policy "Insert: Facilitators can submit test responses"
on public.live_session_test_responses
for insert
to authenticated
with check (
  facilitator_id = (select auth.uid())
  and exists (
    select 1
    from public.live_session_facilitators lsf
    join public.live_sessions ls on ls.id = lsf.live_session_id
    where lsf.live_session_id = live_session_test_responses.live_session_id
      and lsf.user_id = (select auth.uid())
      and ls.status != 'ended'  -- Cannot add test responses to ended sessions
  )
);

-- ============================================================================
-- DELETE: Facilitators can delete their own test responses (session not ended)
-- ============================================================================
create policy "Delete: Facilitators can delete their own test responses"
on public.live_session_test_responses
for delete
to authenticated
using (
  facilitator_id = (select auth.uid())
  and exists (
    select 1
    from public.live_sessions ls
    where ls.id = live_session_test_responses.live_session_id
      and ls.status != 'ended'  -- Cannot delete test responses from ended sessions
  )
);

-- ============================================================================
-- UPDATE: Facilitators can update their own test responses (session not ended)
-- ============================================================================
create policy "Update: Facilitators can update their own test responses"
on public.live_session_test_responses
for update
to authenticated
using (
  facilitator_id = (select auth.uid())
  and exists (
    select 1
    from public.live_sessions ls
    where ls.id = live_session_test_responses.live_session_id
      and ls.status != 'ended'  -- Cannot update test responses in ended sessions
  )
)
with check (
  facilitator_id = (select auth.uid())
  and exists (
    select 1
    from public.live_sessions ls
    where ls.id = live_session_test_responses.live_session_id
      and ls.status != 'ended'
  )
);
