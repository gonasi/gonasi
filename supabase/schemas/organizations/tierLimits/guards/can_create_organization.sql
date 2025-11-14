-- ===========================================================
-- FUNCTION: public.can_create_organization
-- -----------------------------------------------------------
-- Purpose:
--   Determines whether a user is allowed to create a new organization
--   under the current subscription/tier rules.
--
-- Business Rules Enforced:
--   1. Each user may create at most **one launch-tier organization**.
--   2. Each user may create at most **one temp-tier organization**.
--   3. A temp-tier organization may only be created if the user 
--      already has a launch-tier organization.
--   4. Paid tiers (scale, impact, etc.) cannot be created directly.
--
-- Notes:
--   - Queries the `organization_subscriptions` table to get each org’s tier.
--   - Only considers active subscriptions (`status = 'active'`).
--   - SECURITY DEFINER ensures access even for limited-privilege users.
--   - search_path is cleared to prevent schema conflicts.
--
-- Parameters:
--   arg_user_id uuid – The ID of the user to check. Defaults to current user if NULL.
--
-- Returns:
--   boolean – TRUE if the user can create a new org (launch or temp), FALSE otherwise.
--
-- Example Usage:
--   select public.can_create_organization(null);
--   select public.can_create_organization('9a7c1e2f-1234-5678-90ab-cdef12345678');
-- ===========================================================
create or replace function public.can_create_organization(
  arg_user_id uuid
)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
with org_counts as (
  select
    count(*) filter (where s.tier = 'launch') as launch_count,
    count(*) filter (where s.tier = 'temp') as temp_count
  from public.organizations o
  join public.organization_subscriptions s
    on s.organization_id = o.id
  where o.owned_by = coalesce(arg_user_id, (select auth.uid()))
    and s.status = 'active'
)
select
  (select
      -- Only allow launch or temp tiers
      case
        when (launch_count = 0) then true          -- can create launch
        when (launch_count > 0 and temp_count = 0) then true  -- can create temp only
        else false
      end
    from org_counts
  );
$$;
