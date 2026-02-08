-- ============================================================================
-- FUNCTION: can_user_edit_live_session
-- DESCRIPTION:
--   Determines if the currently authenticated user has permission to edit
--   a specific live session, based on their organization role and facilitator assignment.
--
--   Editing rights are granted to:
--     1. Organization 'owner' or 'admin'
--     2. Assigned session facilitators (via live_session_facilitators table)
--
--   Restrictions:
--     - If the organization's tier is 'temp', no editing is allowed for anyone.
--     - If the session status is 'ended', no editing is allowed (session is read-only).
--
-- PARAMETERS:
--   arg_session_id uuid – The ID of the live session to check.
--
-- RETURNS:
--   boolean – TRUE if the user can edit the session; FALSE otherwise.
--
-- USAGE:
--   select public.can_user_edit_live_session('session-uuid-here');
--
-- SECURITY:
--   - SECURITY DEFINER: Ensures function runs with its own privileges.
--   - search_path set to '' to prevent privilege escalation via malicious objects.
-- ============================================================================
create or replace function public.can_user_edit_live_session(arg_session_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select coalesce(
    (
      -- Step 1: Fetch session and organization info
      with session_org as (
        select ls.id as session_id, ls.organization_id, ls.status
        from public.live_sessions ls
        where ls.id = arg_session_id
      )
      select
        -- Step 2: Check if session is ended (read-only)
        case
          -- If the session is ended, editing is disallowed
          when so.status = 'ended' then false

          -- If the org is in 'temp' tier, editing is disallowed
          when public.get_org_tier(so.organization_id) = 'temp' then false

          -- Step 3: Otherwise, check normal permissions
          else (
            -- User is an owner or admin in the organization
            public.get_user_org_role(so.organization_id, (select auth.uid())) in ('owner', 'admin')
            -- OR user is explicitly assigned as a session facilitator
            or exists (
              select 1
              from public.live_session_facilitators lsf
              where lsf.live_session_id = so.session_id
                and lsf.user_id = (select auth.uid())
            )
          )
        end
      from session_org so
    ),
    -- Step 4: Default to false if session does not exist
    false
  )
$$;

comment on function public.can_user_edit_live_session is 'Checks if user can edit a live session (admins, owners, or assigned facilitators)';
