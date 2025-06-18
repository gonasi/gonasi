-- Automatically inserts a free pricing tier after a course is created.
-- Ensures all courses start with a valid pricing structure.
create or replace function public.add_default_free_pricing_tier()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  insert into public.course_pricing_tiers (
    course_id,
    is_free,
    price,
    currency_code,
    created_by,
    updated_by,
    payment_frequency,
    tier_name
  )
  values (
    new.id,
    true,
    0,
    'usd',
    new.created_by,
    new.created_by,
    'monthly',
    'free'
  );

  return new;
end;
$$;

-- trigger: attaches a free tier immediately after course creation
create trigger trg_add_default_free_pricing_tier
after insert on public.courses
for each row
execute function public.add_default_free_pricing_tier();


-- Converts a paid course to a free one by:
-- 1. Removing all pricing tiers
-- 2. Adding a standard free tier
-- 3. Marking all chapters as non-paid
create or replace function public.set_course_free(p_course_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$ 
declare
  has_access boolean;
  has_paid_tiers boolean;
begin
  -- check permission: only admins, editors, or course creator
  select exists (
    select 1 from public.courses c
    where c.id = p_course_id
      and (
        public.is_course_admin(c.id, p_user_id)
        or public.is_course_editor(c.id, p_user_id)
        or c.created_by = p_user_id
      )
  ) into has_access;

  if not has_access then
    raise exception 'permission denied: you do not have access to modify this course (course_id=%)', p_course_id
      using errcode = '42501';
  end if;

  -- skip if no paid tiers exist
  select exists (
    select 1 from public.course_pricing_tiers
    where course_id = p_course_id
      and is_free = false
  ) into has_paid_tiers;

  if not has_paid_tiers then
    raise exception 'course (id=%) is already free.', p_course_id
      using errcode = 'P0001';
  end if;

  -- temporarily disable conversion-related triggers
  perform set_config('app.converting_course_pricing', 'true', true);

  delete from public.course_pricing_tiers
  where course_id = p_course_id;

  perform set_config('app.converting_course_pricing', 'false', true);

  -- insert standard free tier
  insert into public.course_pricing_tiers (
    course_id,
    is_free,
    price,
    currency_code,
    created_by,
    updated_by,
    payment_frequency,
    tier_name,
    is_active
  )
  values (
    p_course_id,
    true,
    0,
    'kes',
    p_user_id,
    p_user_id,
    'monthly',
    'free',
    true
  );

  -- mark all chapters as non-paid
  update public.chapters
  set requires_payment = false
  where course_id = p_course_id;
end;
$$;


-- Converts a free course to a paid course by:
-- 1. Removing all existing tiers
-- 2. Adding a default paid tier
-- 3. Marking all chapters as paid
create or replace function public.set_course_paid(p_course_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  has_access boolean;
  paid_tiers_count integer;
begin
  -- check permission
  select exists (
    select 1 from public.courses c
    where c.id = p_course_id
      and (
        public.is_course_admin(c.id, p_user_id)
        or public.is_course_editor(c.id, p_user_id)
        or c.created_by = p_user_id
      )
  ) into has_access;

  if not has_access then
    raise exception 'permission denied: you do not have access to modify this course (course_id=%)', p_course_id
      using errcode = '42501';
  end if;

  -- prevent redundant conversion
  select count(*) into paid_tiers_count
  from public.course_pricing_tiers
  where course_id = p_course_id
    and is_free = false;

  if paid_tiers_count > 0 then
    raise exception 'course (id=%) already has a paid tier and is considered paid.', p_course_id
      using errcode = 'P0001';
  end if;

  perform set_config('app.converting_course_pricing', 'true', true);

  delete from public.course_pricing_tiers
  where course_id = p_course_id;

  perform set_config('app.converting_course_pricing', 'false', true);

  -- insert default paid tier
  insert into public.course_pricing_tiers (
    course_id,
    is_free,
    price,
    currency_code,
    created_by,
    updated_by,
    payment_frequency,
    tier_name,
    tier_description,
    is_active
  )
  values (
    p_course_id,
    false,
    100.00,
    'kes',
    p_user_id,
    p_user_id,
    'monthly',
    'basic plan',
    'automatically added paid tier. you can update this.',
    true
  );

  -- mark all chapters as paid
  update public.chapters
  set requires_payment = true
  where course_id = p_course_id;
end;
$$;


-- Switches pricing model of a course to 'free' or 'paid' by delegating to the appropriate function
create or replace function public.switch_course_pricing_model(
  p_course_id uuid,
  p_user_id uuid,
  p_target_model text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  has_access boolean;
  current_model text;
begin
  -- check permission
  select exists (
    select 1 from public.courses c
    where c.id = p_course_id
      and (
        public.is_course_admin(c.id, p_user_id)
        or public.is_course_editor(c.id, p_user_id)
        or c.created_by = p_user_id
      )
  ) into has_access;

  if not has_access then
    raise exception 'permission denied: you do not have access to modify this course'
      using errcode = '42501';
  end if;

  if p_target_model not in ('free', 'paid') then
    raise exception 'invalid target model: must be ''free'' or ''paid''';
  end if;

  -- detect current model
  select case
    when exists (
      select 1 from public.course_pricing_tiers
      where course_id = p_course_id and is_free = false
    ) then 'paid'
    else 'free'
  end into current_model;

  if current_model = p_target_model then
    raise notice 'course is already in % model', p_target_model;
    return;
  end if;

  -- perform conversion
  if p_target_model = 'free' then
    perform public.set_course_free(p_course_id, p_user_id);
  else
    perform public.set_course_paid(p_course_id, p_user_id);
  end if;
end;
$$;


-- Validates if a course can be safely converted based on active subscriptions
create or replace function public.can_convert_course_pricing(
  p_course_id uuid,
  p_target_model text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  has_active_subscriptions boolean;
begin
  -- check for active subscriptions on paid tiers
  select exists (
    select 1 from subscriptions s
    join course_pricing_tiers cpt on s.pricing_tier_id = cpt.id
    where cpt.course_id = p_course_id
      and s.status = 'active'
      and cpt.is_free = false
  ) into has_active_subscriptions;

  -- prevent conversion to free if users are still subscribed
  if p_target_model = 'free' and has_active_subscriptions then
    return false;
  end if;

  return true;
end;
$$;


-- Ensures at least one active pricing tier exists per course
-- Prevents deletes or deactivations that would orphan the course
create or replace function public.trg_ensure_active_tier_exists()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  active_tier_count integer;
  bypass_check boolean;
begin
  -- skip check during conversions
  select coalesce(current_setting('app.converting_course_pricing', true)::boolean, false)
  into bypass_check;

  if bypass_check then
    return coalesce(new, old);
  end if;

  if tg_op = 'delete' then
    select count(*)
    into active_tier_count
    from public.course_pricing_tiers
    where course_id = old.course_id
      and is_active = true
      and id != old.id;

    if active_tier_count = 0 then
      raise exception 'cannot delete tier: course must have at least one active pricing tier (course_id: %)', old.course_id;
    end if;

    return old;
  end if;

  if tg_op = 'update' and old.is_active = true and new.is_active = false then
    select count(*)
    into active_tier_count
    from public.course_pricing_tiers
    where course_id = new.course_id
      and is_active = true
      and id != new.id;

    if active_tier_count = 0 then
      raise exception 'cannot deactivate tier: course must have at least one active pricing tier (course_id: %)', new.course_id;
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_ensure_active_tier
before update or delete on public.course_pricing_tiers
for each row
execute function public.trg_ensure_active_tier_exists();


-- Returns unused payment frequencies for a given course
create or replace function get_available_payment_frequencies(p_course_id uuid)
returns public.payment_frequency[] 
language plpgsql
set search_path = ''
as $$
declare
  all_frequencies public.payment_frequency[];
  used_frequencies public.payment_frequency[];
begin
  select enum_range(null::public.payment_frequency)
  into all_frequencies;

  select array_agg(payment_frequency)
  into used_frequencies
  from public.course_pricing_tiers
  where course_id = p_course_id;

  return (
    select array_agg(freq)
    from unnest(all_frequencies) as freq
    where used_frequencies is null or freq != all(used_frequencies)
  );
end;
$$;
