-- ===================================================
-- UTILITY FUNCTIONS FOR GONASI PLATFORM
-- ===================================================


-- ===========================================
-- FUNCTION: get_user_org_role
-- -------------------------------------------
-- Returns the role of a user in an organization.
-- If no user_id is passed, defaults to auth.uid().
-- This is commonly used in RLS policies and logic checks.
-- ===========================================

create or replace function public.get_user_org_role(
  org_id uuid,
  user_id uuid
)
returns text
language sql
security definer
stable
set search_path = ''
as $$
  select role::text
  from public.organization_members
  where organization_id = org_id
    and user_id = coalesce(user_id, auth.uid());  -- Use current auth.uid() if user_id is null
$$;

-- ===========================================
-- FUNCTION: has_org_role
-- -------------------------------------------
-- Checks if a user has a minimum required role 
-- within an organization.
--
-- Role hierarchy:
--   - owner > admin > editor
-- Returns TRUE if user meets or exceeds required role.
-- ===========================================

create or replace function public.has_org_role(
  org_id uuid,
  required_role text,
  user_id uuid
)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select case required_role
    when 'owner' then public.get_user_org_role(org_id, coalesce(user_id, auth.uid())) = 'owner'
    when 'admin' then public.get_user_org_role(org_id, coalesce(user_id, auth.uid())) in ('owner', 'admin')
    when 'editor' then public.get_user_org_role(org_id, coalesce(user_id, auth.uid())) in ('owner', 'admin', 'editor')
    else false  -- If unknown role is passed
  end;
$$;

-- ===========================================
-- FUNCTION: can_accept_new_member
-- -------------------------------------------
-- Checks if an organization can accept new members
-- based on current tier limits.
--
-- It counts:
--   1. Active members in `organization_members`
--   2. Pending invites in `organization_invites`
-- Then compares total to tier limit.
-- ===========================================

create or replace function public.can_accept_new_member(org_id uuid)
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
    where o.id = org_id
  ),
  limits as (
    select tl.max_members_per_org
    from public.organizations o
    join public.tier_limits tl on o.tier = tl.tier
    where o.id = org_id
  )
  select (counts.active_members + counts.pending_invites) < limits.max_members_per_org
  from counts, limits;
$$;

-- ===========================================
-- FUNCTION: can_create_organization
-- -------------------------------------------
-- Checks if a user can create a new organization
-- under the given tier.
--
-- Limits are defined in the `tier_limits` table.
-- If no user_id is passed, defaults to auth.uid().
-- ===========================================

create or replace function public.can_create_organization(
  tier_name text,
  user_id uuid
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
    where owned_by = coalesce(user_id, auth.uid())
      and tier = tier_name::public.subscription_tier  -- 👈 explicit cast
  ),
  tier_limit as (
    select max_organizations_per_user
    from public.tier_limits
    where tier = tier_name::public.subscription_tier  -- 👈 explicit cast
  )
  select user_org_count.count < tier_limit.max_organizations_per_user
  from user_org_count, tier_limit;
$$;


-- ===========================================
-- FUNCTION: is_user_already_member
-- -------------------------------------------
-- Checks if a user (by email) is already a member 
-- of a given organization.
--
-- This is used to prevent sending invites to users 
-- who are already part of the organization.
-- Case-insensitive email match.
-- ===========================================

create or replace function public.is_user_already_member(
  org_id uuid,
  user_email text
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
    where om.organization_id = org_id
      and lower(p.email) = lower(user_email)
  )
$$;


-- ===========================================
-- FUNCTION: has_pending_invite
-- -------------------------------------------
-- Checks if a user (by email) already has a pending 
-- invitation to join a given organization.
--
-- A pending invite is one that:
--   - has not been accepted
--   - has not been revoked
--   - has not expired
-- Case-insensitive email match.
-- ===========================================

create or replace function public.has_pending_invite(
  org_id uuid,
  user_email text
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
    where oi.organization_id = org_id
      and lower(oi.email) = lower(user_email)
      and oi.accepted_at is null
      and oi.revoked_at is null
      and oi.expires_at > now()
  );
$$;

grant execute on function public.has_pending_invite(uuid, text) to authenticated;

create or replace function prevent_manual_delivery_field_updates()
returns trigger as $$
begin
  -- Allow changes only if made by a system role (e.g., service role or background job)
  -- You can optionally check current_user or context here if needed

  if new.delivery_status is distinct from old.delivery_status
    or new.delivery_logs is distinct from old.delivery_logs then
    raise exception 'Cannot manually modify delivery fields.';
  end if;

  return new;
end;
$$ language plpgsql;

create trigger block_delivery_field_updates
before update on public.organization_invites
for each row
execute function prevent_manual_delivery_field_updates();