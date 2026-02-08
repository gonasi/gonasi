-- ====================================================================================
-- ENABLE RLS
-- ====================================================================================
alter table public.live_session_facilitators enable row level security;

-- SELECT: Any organization member can see session facilitators
create policy "live-session-facilitators-select-org-members"
on public.live_session_facilitators
for select
to authenticated
using (
    has_org_role(
        organization_id,
        'editor',
        (select auth.uid())
    )
);

-- INSERT: Only org admins (or higher) may add facilitators
--         EXCEPT if org is on 'temp' tier or session is ended
create policy "live-session-facilitators-insert-admins"
on public.live_session_facilitators
for insert
with check (
    -- Only admins or owners may add session facilitators
    has_org_role(
        organization_id,
        'admin',
        (select auth.uid())
    )
    AND
    -- Target user must belong to the same organization
    exists (
        select 1
        from public.organization_members m
        where m.organization_id = live_session_facilitators.organization_id
          and m.user_id = live_session_facilitators.user_id
    )
    AND
    -- Org must not be on temp tier
    public.get_org_tier(organization_id) != 'temp'
    AND
    -- Session must not be ended
    exists (
        select 1
        from public.live_sessions ls
        where ls.id = live_session_facilitators.live_session_id
          and ls.status != 'ended'
    )
);

-- DELETE: Only org admins (or higher) may remove facilitators
--         EXCEPT if org is on 'temp' tier or session is ended
create policy "live-session-facilitators-delete-admins"
on public.live_session_facilitators
for delete
using (
    has_org_role(
        organization_id,
        'admin',
        (select auth.uid())
    )
    AND
    -- Org must not be on temp tier
    public.get_org_tier(organization_id) != 'temp'
    AND
    -- Session must not be ended
    exists (
        select 1
        from public.live_sessions ls
        where ls.id = live_session_facilitators.live_session_id
          and ls.status != 'ended'
    )
);

comment on policy "live-session-facilitators-select-org-members" on public.live_session_facilitators is 'Org members can view session facilitators';
comment on policy "live-session-facilitators-insert-admins" on public.live_session_facilitators is 'Only admins/owners can add facilitators';
comment on policy "live-session-facilitators-delete-admins" on public.live_session_facilitators is 'Only admins/owners can remove facilitators';
