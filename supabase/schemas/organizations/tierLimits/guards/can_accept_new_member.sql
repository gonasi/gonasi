-- ===========================================
-- FUNCTION: can_accept_new_member
-- ===========================================
-- Checks whether an organization can accept more members
-- based on its current tier limits.
--
-- This function handles two distinct scenarios:
--
-- 1. INVITING NEW MEMBERS ('invite' mode)
--    Checks if the organization can send a new invitation.
--    Capacity = active_members + pending_invites
--    This prevents organizations from having too many
--    outstanding invitations that could all be accepted.
--
-- 2. ACCEPTING EXISTING INVITES ('accept' mode)
--    Checks if an existing pending invite can be accepted.
--    Capacity = active_members only
--    This allows pending invites to be accepted even when
--    the org is at capacity due to other pending invites.
--
-- MEMBERSHIP COUNTING:
--   - Active members: Distinct users in `organization_members`
--   - Pending invites: Distinct emails in `organization_invites`
--     where accepted_at IS NULL, revoked_at IS NULL,
--     and expires_at > now()
--
-- TIER LIMITS:
--   The limit is pulled from `tier_limits.max_members_per_org`
--   based on the organization's current tier.
--
-- PARAMETERS:
--   arg_org_id    uuid  - The ID of the organization being checked
--   arg_check_type text - The type of check to perform:
--                         'invite' (default) - Check if can send new invite
--                         'accept' - Check if can accept existing invite
--
-- RETURNS:
--   boolean - TRUE if the action is allowed, FALSE otherwise
--
-- EXAMPLES:
--   -- Check if org can send a new invitation
--   SELECT can_accept_new_member('df423f7b-e0d3-4ab9-8b54-2e823fdd25f7', 'invite');
--
--   -- Check if org can accept a pending invitation
--   SELECT can_accept_new_member('df423f7b-e0d3-4ab9-8b54-2e823fdd25f7', 'accept');
--
--   -- Default behavior (checks for inviting)
--   SELECT can_accept_new_member('df423f7b-e0d3-4ab9-8b54-2e823fdd25f7');
--
-- SCENARIO EXAMPLE:
--   Organization with max_members_per_org = 3
--   - Active members: 2
--   - Pending invites: 1
--
--   can_accept_new_member(org_id, 'invite')  → FALSE (2+1 = 3, at capacity)
--   can_accept_new_member(org_id, 'accept')  → TRUE  (2 < 3, room for one more)
--
-- ===========================================

create or replace function public.can_accept_new_member(
  arg_org_id uuid,
  arg_check_type text default 'invite'
)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  with counts as (
    select 
      count(distinct om.user_id) as active_members,
      count(distinct oi.email) filter (
        where oi.accepted_at is null 
          and oi.revoked_at is null 
          and oi.expires_at > now()
      ) as pending_invites
    from public.organizations o
    left join public.organization_members om on o.id = om.organization_id
    left join public.organization_invites oi on o.id = oi.organization_id
    where o.id = arg_org_id
  ),
  limits as (
    select tl.max_members_per_org
    from public.organizations o
    join public.tier_limits tl on o.tier = tl.tier
    where o.id = arg_org_id
  )
  select case 
    when arg_check_type = 'accept' then
      -- When accepting, only check active members
      -- (the pending invite will become an active member)
      counts.active_members < limits.max_members_per_org
    else
      -- When inviting, check both active members + pending invites
      -- to prevent over-inviting
      (counts.active_members + counts.pending_invites) < limits.max_members_per_org
  end
  from counts, limits;
$$;
