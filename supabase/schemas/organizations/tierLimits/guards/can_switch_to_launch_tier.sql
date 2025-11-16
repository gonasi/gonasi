-- ======================================================================
-- FUNCTION: can_switch_to_launch_tier
-- ======================================================================
-- Purpose:
--   Checks whether the organization can switch to the 'launch' tier.
--   This enforces the same business rules as the trigger:
--
--   1. Only one org per owner may be on launch tier.
--   2. Cannot schedule launch upgrade if any launch exists.
--   3. Launch must always remain active, but this function only checks
--      eligibility to switch, so not relevant here.
--
-- Returns:
--   TRUE if allowed to switch to launch tier, else FALSE.
--
-- Usage:
--   select can_switch_to_launch_tier('org-uuid');
--
-- Notes:
--   - Uses the organization_id to determine owner and conflicts.
--   - This logic matches enforce_single_launch_tier().
--   - Safe for UI/backend usage, does not raise errors.
-- ======================================================================

create or replace function can_switch_to_launch_tier(p_org_id uuid)
returns boolean
language plpgsql
stable
as $$
declare
  v_owner uuid;
  v_conflict boolean;
begin
  --------------------------------------------------------------------
  -- Get owner
  --------------------------------------------------------------------
  select owned_by
  into v_owner
  from public.organizations
  where id = p_org_id;

  if v_owner is null then
    -- organization doesn't exist or no owner
    return false;
  end if;

  --------------------------------------------------------------------
  -- Check if owner already has a launch org or scheduled launch upgrade
  --------------------------------------------------------------------
  select exists (
    select 1
    from public.organization_subscriptions s
    join public.organizations o on o.id = s.organization_id
    where o.owned_by = v_owner
      and (
        s.tier = 'launch'
        or s.next_tier = 'launch'
      )
      and s.organization_id != p_org_id
  )
  into v_conflict;

  if v_conflict then
    return false;
  end if;

  --------------------------------------------------------------------
  -- This organization itself is allowed to switch to launch
  --------------------------------------------------------------------
  return true;
end;
$$;
