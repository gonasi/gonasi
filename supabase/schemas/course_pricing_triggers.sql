-- ============================================================================
-- trigger functions to enforce pricing tier business rules
-- ============================================================================

-- ensures that each course always has at least one active tier
create or replace function public.enforce_at_least_one_active_tier()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_active = false then
    -- prevent deactivating the last active tier for a course
    if not exists (
      select 1
      from course_pricing_tiers
      where course_id = new.course_id
        and id != new.id
        and is_active = true
    ) then
      raise exception 'each course must have at least one active pricing tier';
    end if;
  end if;
  return new;
end;
$$;

-- auto-assigns a position number to newly inserted tiers
-- ensures proper tier ordering even if client doesn't specify position
create or replace function public.set_course_pricing_tier_position()
returns trigger
as $$
begin
  if new.position is null or new.position = 0 then
    select coalesce(max(position), 0) + 1
    into new.position
    from public.course_pricing_tiers
    where course_id = new.course_id;
  end if;
  return new;
end;
$$
language plpgsql
set search_path = '';

create trigger trg_set_course_pricing_tier_position
before insert on public.course_pricing_tiers
for each row
execute function public.set_course_pricing_tier_position();

-- ensures exclusive free-tier model: only one free tier per course
-- if a free tier is added, all other tiers are deleted unless bypassed
create or replace function public.trg_delete_other_tiers_if_free()
returns trigger as $$
declare
  bypass_check boolean;
begin
  select coalesce(current_setting('app.converting_course_pricing', true)::boolean, false)
  into bypass_check;

  if bypass_check then
    return new;
  end if;

  if new.is_free = true then
    delete from public.course_pricing_tiers
    where course_id = new.course_id
      and id != new.id;
  end if;

  return new;
end;
$$ 
language plpgsql
set search_path = '';

create trigger trg_handle_free_tier
after insert or update on public.course_pricing_tiers
for each row
execute function public.trg_delete_other_tiers_if_free();

-- blocks deletion of the last remaining paid tier unless bypassed
-- protects against removing all monetization paths for a paid course
create or replace function public.trg_prevent_deleting_last_paid_tier()
returns trigger as $$
declare
  remaining_paid_tiers int;
  bypass_check boolean;
begin
  select coalesce(current_setting('app.converting_course_pricing', true)::boolean, false)
  into bypass_check;

  if bypass_check then
    return old;
  end if;

  if old.is_free = false then
    select count(*) into remaining_paid_tiers
    from public.course_pricing_tiers
    where course_id = old.course_id
      and id != old.id
      and is_free = false;

    if remaining_paid_tiers = 0 then
      raise exception 'cannot delete the last paid tier for a paid course (course_id=%)', old.course_id;
    end if;
  end if;

  return old;
end;
$$ 
language plpgsql
set search_path = '';

create trigger trg_prevent_last_paid_tier_deletion
before delete on public.course_pricing_tiers
for each row
execute function public.trg_prevent_deleting_last_paid_tier();

-- blocks deletion of the only remaining free tier unless bypassed
-- ensures a course marked as free always retains at least one free tier
create or replace function public.trg_prevent_deleting_last_free_tier()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  remaining_free_count int;
  bypass_check boolean;
begin
  select coalesce(current_setting('app.converting_course_pricing', true)::boolean, false)
  into bypass_check;

  if bypass_check then
    return old;
  end if;

  if old.is_free then
    select count(*) into remaining_free_count
    from public.course_pricing_tiers
    where course_id = old.course_id
      and id <> old.id
      and is_free = true
      and is_active = true;

    if remaining_free_count = 0 then
      raise exception 'cannot delete the only free pricing tier for course %', old.course_id;
    end if;
  end if;

  return old;
end;
$$;

create trigger trg_prevent_deleting_last_free_tier
before delete on public.course_pricing_tiers
for each row
execute function public.trg_prevent_deleting_last_free_tier();

-- prevents deactivating the last free tier unless bypassed
-- similar to deletion rule, but for updates setting is_active to false
create or replace function public.trg_prevent_deactivating_last_free_tier()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  bypass_check boolean;
begin
  select coalesce(current_setting('app.converting_course_pricing', true)::boolean, false)
  into bypass_check;

  if bypass_check then
    return new;
  end if;

  if old.is_free
    and old.is_active
    and new.is_active = false then

    if not exists (
      select 1 from public.course_pricing_tiers
      where course_id = old.course_id
        and id <> old.id
        and is_free = true
        and is_active = true
    ) then
      raise exception 'cannot deactivate the only free pricing tier for course %', old.course_id;
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_prevent_deactivating_last_free_tier
before update on public.course_pricing_tiers
for each row
when (old.is_active = true and new.is_active = false)
execute function public.trg_prevent_deactivating_last_free_tier();
