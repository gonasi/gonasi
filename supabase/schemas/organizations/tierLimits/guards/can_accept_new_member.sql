-- ===========================================================
-- FUNCTION: public.can_accept_new_member
-- -----------------------------------------------------------
-- Purpose:
--   Checks whether an organization can accept more members
--   based on its current tier limits.
--
-- Scenarios:
--   1. INVITING NEW MEMBERS ('invite' mode)
--      Capacity = active_members + pending_invites
--   2. ACCEPTING EXISTING INVITES ('accept' mode)
--      Capacity = active_members only
--
-- Membership counting:
--   - Active members: distinct users in organization_members
--   - Pending invites: distinct emails in organization_invites
--     where accepted_at IS NULL, revoked_at IS NULL,
--     and expires_at > now()
--
-- Tier limits:
--   - Pulled from tier_limits.max_members_per_org
--     based on the org's **active subscription tier**
--
-- Parameters:
--   arg_org_id uuid      - ID of the organization
--   arg_check_type text  - 'invite' (default) or 'accept'
--
-- Returns:
--   boolean - TRUE if action is allowed, FALSE otherwise
-- ===========================================================
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
    from public.organization_members om
    left join public.organization_invites oi 
      on om.organization_id = oi.organization_id
    where om.organization_id = arg_org_id
),
limits as (
    select tl.max_members_per_org
    from public.organization_subscriptions s
    join public.tier_limits tl on s.tier = tl.tier
    where s.organization_id = arg_org_id
      and s.status = 'active'
    limit 1
)
select case 
    when arg_check_type = 'accept' then
        counts.active_members < limits.max_members_per_org
    else
        (counts.active_members + counts.pending_invites) < limits.max_members_per_org
end
from counts, limits;
$$;
