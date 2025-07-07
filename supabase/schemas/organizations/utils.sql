-- ===================================================
-- UTILITY FUNCTIONS FOR GONASI PLATFORM
-- ===================================================
-- These functions support core permissions and platform logic.
-- All are written with clarity, safety, and RLS compatibility in mind.

-- ===========================================
-- FUNCTION: get_user_org_role
-- -------------------------------------------
-- Returns the role (e.g. 'owner', 'admin', 'editor') of a user 
-- within a specific organization.
--
-- If the user is not a member of the organization, returns NULL.
--
-- Used throughout the platform for permission checks and UI logic.
-- ===========================================

create or replace function public.get_user_org_role(
  arg_org_id uuid,         -- The ID of the organization
  arg_user_id uuid         -- The ID of the user being checked
)
returns text
language sql
security definer
stable
set search_path = ''
as $$
  select om.role::text
  from public.organization_members om
  where om.organization_id = arg_org_id
    and om.user_id = arg_user_id
  limit 1;
$$;



-- ===========================================
-- FUNCTION: has_org_role
-- -------------------------------------------
-- Checks if a user has a minimum required role within an organization.
--
-- Role hierarchy (highest → lowest):
--   - owner > admin > editor
--
-- Returns TRUE if user meets or exceeds the required role.
-- Returns FALSE if the user is not a member or has insufficient privileges.
-- ===========================================

create or replace function public.has_org_role(
  arg_org_id uuid,         -- The ID of the organization
  required_role text,      -- The minimum role required: 'owner', 'admin', or 'editor'
  arg_user_id uuid         -- The ID of the user being checked
)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select 
    case 
      when required_role = 'owner' then 
        coalesce(public.get_user_org_role(arg_org_id, arg_user_id), '') = 'owner'
      when required_role = 'admin' then 
        coalesce(public.get_user_org_role(arg_org_id, arg_user_id), '') in ('admin', 'owner')
      when required_role = 'editor' then 
        coalesce(public.get_user_org_role(arg_org_id, arg_user_id), '') in ('editor', 'admin', 'owner')
      else false  -- invalid role name fallback
    end;
$$;



-- ===========================================
-- FUNCTION: can_accept_new_member
-- -------------------------------------------
-- Checks whether an organization can accept more members
-- based on its current tier limits.
--
-- Membership capacity is calculated as:
--   active members in `organization_members` +
--   pending invites in `organization_invites`
--
-- The limit is pulled from the `tier_limits` table based on org tier.
-- ===========================================

create or replace function public.can_accept_new_member(
  arg_org_id uuid          -- The ID of the organization being checked
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
  select (counts.active_members + counts.pending_invites) < limits.max_members_per_org
  from counts, limits;
$$;



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



-- ===========================================
-- FUNCTION: is_user_already_member
-- -------------------------------------------
-- Checks if a user is already a member of an organization
-- using their email (case-insensitive).
--
-- Prevents sending invites to users who are already members.
-- ===========================================

create or replace function public.is_user_already_member(
  arg_org_id uuid,         -- Organization to check
  user_email text          -- Email of the user to check
)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members om
    join public.profiles p on om.user_id = p.id
    where om.organization_id = arg_org_id
      and lower(p.email) = lower(user_email)
  )
$$;



-- ===========================================
-- FUNCTION: has_pending_invite
-- -------------------------------------------
-- Checks if a user already has a pending invitation 
-- to join an organization (case-insensitive email).
--
-- A pending invite is one that:
-- - has not been accepted
-- - has not been revoked
-- - has not expired
-- ===========================================

create or replace function public.has_pending_invite(
  arg_org_id uuid,         -- Organization to check
  user_email text          -- Email of user to check
)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_invites oi
    where oi.organization_id = arg_org_id
      and lower(oi.email) = lower(user_email)
      and oi.accepted_at is null
      and oi.revoked_at is null
      and oi.expires_at > now()
  );
$$;

