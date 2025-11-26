-- =====================================================================
-- FUNCTION: public.member_limit_for_org_summary
-- PURPOSE:
--   Checks whether an organization is within its allowed member limit
--   based on its subscription tier. Uses get_org_usage(...) as single source
--   for member counts.
--
-- PARAMETERS:
--   p_organization_id  UUID  - The organization being checked.
--   p_check_type       TEXT  - 'invite' (default) or 'accept'.
--                               'invite' → active + pending invites.
--                               'accept' → active members only.
--
-- RETURNS TABLE:
--   exceeded         BOOLEAN  - TRUE if the current usage exceeds allowed.
--   allowed          INTEGER  - Maximum allowed members for this organization.
--   current          INTEGER  - Current membership usage (per check type).
--   remaining        INTEGER  - Remaining slots (never negative).
--   active_members   INTEGER  - Count of active organization members (from get_org_usage).
--   pending_invites  INTEGER  - Count of valid, unexpired, non-revoked invites.
--   check_type       TEXT     - Echo of input p_check_type.
--
-- NOTES:
--   - If no tier is found → allowed = 0 and exceeded = TRUE.
--   - Member limits are always numeric (no 'unlimited' path).
-- =====================================================================
create or replace function public.member_limit_for_org_summary(
  p_organization_id uuid,
  p_check_type text default 'invite'
)
returns table (
  exceeded boolean,
  allowed integer,
  current integer,
  remaining integer,
  active_members integer,
  pending_invites integer,
  check_type text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  limits json;
  max_members int;
  usage_record record;
  pending_invites int := 0;
begin
  -- Fetch subscription tier limits
  select public.get_tier_limits(p_organization_id)
  into limits;

  -- If no subscription/tier → treat as zero-limit tier
  if limits is null then
    return query
    select
      true,   -- exceeded
      0,      -- allowed
      0,      -- current
      0,      -- remaining
      0,      -- active_members
      0,      -- pending_invites
      p_check_type;
    return;
  end if;

  -- Extract numeric max members (cannot be null in your system)
  max_members := (limits->>'max_members_per_org')::int;

  -- Defensive fallback
  if max_members is null then
    max_members := 0;
  end if;

  -- Get canonical usage values from get_org_usage
  select storage_used_mb, member_count, domain_count, course_count, ai_usage_used
  into usage_record
  from public.get_org_usage(p_organization_id);

  -- Compute pending_invites separately (we still need to count invites)
  select count(distinct oi.email) 
  into pending_invites
  from public.organization_invites oi
  where oi.organization_id = p_organization_id
    and oi.accepted_at is null
    and oi.revoked_at is null
    and oi.expires_at > now();

  -- Compute current depending on check type
  if p_check_type = 'accept' then
    -- only active members count when accepting
    return query
    select
      (usage_record.member_count > max_members) as exceeded,
      max_members as allowed,
      usage_record.member_count as current,
      greatest(max_members - usage_record.member_count, 0) as remaining,
      usage_record.member_count as active_members,
      pending_invites as pending_invites,
      p_check_type as check_type;
  else
    -- invite: active + pending invites
    return query
    select
      ((usage_record.member_count + pending_invites) > max_members) as exceeded,
      max_members as allowed,
      (usage_record.member_count + pending_invites) as current,
      greatest(max_members - (usage_record.member_count + pending_invites), 0) as remaining,
      usage_record.member_count as active_members,
      pending_invites as pending_invites,
      p_check_type as check_type;
  end if;
end;
$$;
