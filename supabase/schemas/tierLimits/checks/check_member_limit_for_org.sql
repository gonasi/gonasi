-- =====================================================================
-- FUNCTION: public.check_member_limit_for_org
-- =====================================================================
create or replace function public.check_member_limit_for_org(
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
begin
  -- Pull tier limits JSON
  select public.get_tier_limits(p_organization_id)
  into limits;

  -- If no subscription / no limits: treat as zero capacity
  if limits is null then
    return query
    select
      true as exceeded, 
      0 as allowed,
      0 as current,
      0 as remaining,
      0 as active_members,
      0 as pending_invites,
      p_check_type as check_type;
    return;
  end if;

  -- Extract allowed members from tier limits JSON
  max_members := (limits->>'max_members_per_org')::int;

  return query
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
    where om.organization_id = p_organization_id
  ),
  calc as (
    select
      counts.active_members,
      counts.pending_invites,
      max_members as allowed,
      case 
        when p_check_type = 'accept'
          then counts.active_members
        else counts.active_members + counts.pending_invites
      end as current
    from counts
  )
  select
    (calc.current > calc.allowed) as exceeded,
    calc.allowed,
    calc.current,
    greatest(calc.allowed - calc.current, 0) as remaining,
    calc.active_members,
    calc.pending_invites,
    p_check_type as check_type
  from calc;
end;
$$;
