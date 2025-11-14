

-- ===========================================
-- FUNCTION: can_create_organization
-- -------------------------------------------
-- Checks if a user can create another organization under a given tier.
--
-- Rules:
-- - A user can only create a limited number of organizations per tier.
-- - Limits are defined in the `tier_limits` table.
-- - If `user_id` is null, defaults to current `auth.uid()`.
-- ===========================================

create or replace function public.can_create_organization(
  tier_name text,          -- Tier name (e.g., 'free', 'pro', 'team')
  arg_user_id uuid         -- ID of the user (defaults to auth.uid() if null)
)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  with user_org_count as (
    select count(*) as count
    from public.organizations
    where owned_by = coalesce(arg_user_id, auth.uid())
      and tier = tier_name::public.subscription_tier
  ),
  tier_limit as (
    select max_organizations_per_user
    from public.tier_limits
    where tier = tier_name::public.subscription_tier
  )
  select user_org_count.count < tier_limit.max_organizations_per_user
  from user_org_count, tier_limit;
$$;





