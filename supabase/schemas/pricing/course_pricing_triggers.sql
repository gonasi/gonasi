-- ============================================================================
-- BUSINESS RULES & AUTOMATED LOGIC FOR COURSE PRICING TIERS
-- ============================================================================

-- ============================================================================
-- FUNCTION: set_course_pricing_tier_position
-- ----------------------------------------------------------------------------
-- Automatically assigns a position to newly inserted pricing tiers.
-- Ensures proper ordering without requiring manual input.
-- ============================================================================

-- ============================================================================
-- FUNCTION: set_course_pricing_tier_position
-- ============================================================================
create or replace function public.set_course_pricing_tier_position()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.position is null or new.position = 0 then
    select coalesce(max(position), 0) + 1
    into new.position
    from public.course_pricing_tiers
    where course_id = new.course_id
      and organization_id = new.organization_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_course_pricing_tier_position on public.course_pricing_tiers;
create trigger trg_set_course_pricing_tier_position
before insert on public.course_pricing_tiers
for each row
execute function public.set_course_pricing_tier_position();

-- ============================================================================
-- FUNCTION: trg_delete_other_tiers_if_free
-- ============================================================================
create or replace function public.trg_delete_other_tiers_if_free()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  bypass_check boolean;
begin
  begin
    select coalesce(nullif(current_setting('app.converting_course_pricing', true), '')::boolean, false)
    into bypass_check;
  exception when others then
    bypass_check := false;
  end;

  if bypass_check then
    return new;
  end if;

  if new.is_free = true then
    delete from public.course_pricing_tiers
    where course_id = new.course_id
      and organization_id = new.organization_id
      and id != new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_handle_free_tier on public.course_pricing_tiers;
create trigger trg_handle_free_tier
after insert or update on public.course_pricing_tiers
for each row
execute function public.trg_delete_other_tiers_if_free();

-- ============================================================================
-- FUNCTION: trg_prevent_deleting_last_paid_tier
-- ============================================================================
create or replace function public.trg_prevent_deleting_last_paid_tier()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  remaining_paid_tiers int;
  bypass_check boolean;
begin
  begin
    select coalesce(nullif(current_setting('app.converting_course_pricing', true), '')::boolean, false)
    into bypass_check;
  exception when others then
    bypass_check := false;
  end;

  if bypass_check then
    return old;
  end if;

  if old.is_free = false then
    select count(*) into remaining_paid_tiers
    from public.course_pricing_tiers
    where course_id = old.course_id
      and organization_id = old.organization_id
      and id != old.id
      and is_free = false;

    if remaining_paid_tiers = 0 then
      raise exception
        'Every course must have at least one paid tier. Please create another paid tier before deleting this one.';
    end if;
  end if;

  return old;
end;
$$;

drop trigger if exists trg_prevent_last_paid_tier_deletion on public.course_pricing_tiers;
create trigger trg_prevent_last_paid_tier_deletion
before delete on public.course_pricing_tiers
for each row
execute function public.trg_prevent_deleting_last_paid_tier();

-- ============================================================================
-- FUNCTION: trg_prevent_deleting_last_free_tier
-- ============================================================================
create or replace function public.trg_prevent_deleting_last_free_tier()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  remaining_free_count int;
  remaining_active_count int;
  bypass_check boolean;
begin
  begin
    select coalesce(nullif(current_setting('app.converting_course_pricing', true), '')::boolean, false)
    into bypass_check;
  exception when others then
    bypass_check := false;
  end;

  if bypass_check then
    return old;
  end if;

  select count(*) into remaining_active_count
  from public.course_pricing_tiers
  where course_id = old.course_id
    and organization_id = old.organization_id
    and id != old.id
    and is_active = true;

  if remaining_active_count = 0 then
    raise exception
      'Each course must have at least one active pricing tier. Please activate or add another tier before removing this one.';
  end if;

  if old.is_free = true then
    select count(*) into remaining_free_count
    from public.course_pricing_tiers
    where course_id = old.course_id
      and organization_id = old.organization_id
      and id != old.id
      and is_free = true
      and is_active = true;

    if remaining_free_count = 0 then
      raise exception
        'Each course must have at least one free tier. Please create another free tier before deleting this one.';
    end if;
  end if;

  return old;
end;
$$;

drop trigger if exists trg_prevent_deleting_last_free_tier on public.course_pricing_tiers;
create trigger trg_prevent_deleting_last_free_tier
before delete on public.course_pricing_tiers
for each row
execute function public.trg_prevent_deleting_last_free_tier();

-- ============================================================================
-- FUNCTION: trg_prevent_deactivating_last_free_tier
-- ============================================================================
create or replace function public.trg_prevent_deactivating_last_free_tier()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  bypass_check boolean;
begin
  begin
    select coalesce(nullif(current_setting('app.converting_course_pricing', true), '')::boolean, false)
    into bypass_check;
  exception when others then
    bypass_check := false;
  end;

  if bypass_check then
    return new;
  end if;

  if old.is_free = true
     and old.is_active = true
     and new.is_active = false then

    if not exists (
      select 1 from public.course_pricing_tiers
      where course_id = old.course_id
        and organization_id = old.organization_id
        and id != old.id
        and is_free = true
        and is_active = true
    ) then
      raise exception
        'Every course must have at least one active free tier. Please activate or add another free tier before deactivating this one.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_deactivating_last_free_tier on public.course_pricing_tiers;
create trigger trg_prevent_deactivating_last_free_tier
before update on public.course_pricing_tiers
for each row
when (old.is_active = true and new.is_active = false)
execute function public.trg_prevent_deactivating_last_free_tier();

-- ============================================================================
-- FUNCTION: enforce_at_least_one_active_pricing_tier
-- ============================================================================
create or replace function public.enforce_at_least_one_active_pricing_tier()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  bypass_check boolean;
  remaining_active_count integer;
begin
  begin
    select coalesce(nullif(current_setting('app.converting_course_pricing', true), '')::boolean, false)
    into bypass_check;
  exception when others then
    bypass_check := false;
  end;

  if bypass_check then
    return coalesce(new, old);
  end if;

  if tg_op = 'update' and old.is_active = true and new.is_active = false then
    select count(*) into remaining_active_count
    from public.course_pricing_tiers
    where course_id = old.course_id
      and organization_id = old.organization_id
      and id != old.id
      and is_active = true;

    if remaining_active_count = 0 then
      raise exception
        'Each course must have at least one active pricing tier. Please ensure at least one remains active.';
    end if;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_enforce_at_least_one_active_tier on public.course_pricing_tiers;
create trigger trg_enforce_at_least_one_active_tier
before update on public.course_pricing_tiers
for each row
execute function public.enforce_at_least_one_active_pricing_tier();
