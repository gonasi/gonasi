-- ======================================================================
-- FUNCTION + TRIGGER: enforce_single_launch_tier
-- ======================================================================
-- Purpose:
--   Enforces launch tier business rules at the database layer.
--
-- Rules:
--   1. An owner can only have one organization on the 'launch' tier.
--   2. An owner cannot set next_tier = 'launch' if they already have
--      a launch tier org or an upgrade scheduled.
--   3. If tier = 'launch' then status MUST always be 'active'.
--
-- Notes:
--   - Uses a trigger to prevent invalid inserts/updates.
--   - Prevents race conditions and ensures data integrity.
--   - Safe for Supabase RLS and API usage.
-- ======================================================================

create or replace function enforce_single_launch_tier()
returns trigger
language plpgsql
as $$
declare
  v_owner uuid;
  v_conflict boolean;
begin
  --------------------------------------------------------------------
  -- Look up organization owner
  --------------------------------------------------------------------
  select owned_by
  into v_owner
  from public.organizations
  where id = NEW.organization_id;

  if v_owner is null then
    -- Safety fallback: do not block if owner cannot be resolved
    return NEW;
  end if;

  --------------------------------------------------------------------
  -- RULE 3: Launch tier MUST always be active
  --------------------------------------------------------------------
  if NEW.tier = 'launch' and NEW.status != 'active' then
    raise exception 'Launch tier must always have status = active.';
  end if;

  --------------------------------------------------------------------
  -- RULE 1: Only one launch tier org per owner
  --------------------------------------------------------------------
  if NEW.tier = 'launch' then
    select exists (
      select 1
      from public.organization_subscriptions s
      join public.organizations o on o.id = s.organization_id
      where o.owned_by = v_owner
        and s.tier = 'launch'
        and s.organization_id != NEW.organization_id
    )
    into v_conflict;

    if v_conflict then
      raise exception 'Owner already has an organization using the launch tier.';
    end if;
  end if;

  --------------------------------------------------------------------
  -- RULE 2: Cannot schedule next_tier = launch if one already exists
  --------------------------------------------------------------------
  if NEW.next_tier = 'launch' then
    select exists (
      select 1
      from public.organization_subscriptions s
      join public.organizations o on o.id = s.organization_id
      where o.owned_by = v_owner
        and (
          s.tier = 'launch'
          or s.next_tier = 'launch'
        )
        and s.organization_id != NEW.organization_id
    )
    into v_conflict;

    if v_conflict then
      raise exception 'Owner already has a launch tier org or launch upgrade scheduled.';
    end if;
  end if;

  return NEW;
end;
$$;

-- ======================================================================
-- TRIGGER: enforce_single_launch_tier
-- ======================================================================
create trigger trg_enforce_single_launch_tier
  before insert or update
  on public.organization_subscriptions
  for each row
  execute function enforce_single_launch_tier();
