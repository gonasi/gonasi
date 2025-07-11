-- ============================================================================
-- FUNCTION: add_default_free_pricing_tier
-- Automatically adds a default free pricing tier after a new course is created
-- Ensures a consistent default pricing model across the platform
-- ============================================================================
create or replace function public.add_default_free_pricing_tier()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  insert into public.course_pricing_tiers (
    course_id,
    organization_id,
    is_free,
    price,
    currency_code,
    created_by,
    updated_by,
    payment_frequency,
    tier_name
  ) values (
    new.id,
    new.organization_id,
    true,
    0,
    'USD',
    new.created_by,
    new.created_by,
    'monthly',
    'free'
  );
  return new;
end;
$$;

create trigger trg_add_default_free_pricing_tier
after insert on public.courses
for each row
execute function public.add_default_free_pricing_tier();

-- ============================================================================
-- FUNCTION: set_course_free
-- Converts a paid course to a free model
-- Removes all tiers, adds a free tier, disables chapter payment requirement
-- ============================================================================
create or replace function public.set_course_free(
  p_course_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org_id uuid;
  v_owned_by uuid;
  has_paid_tiers boolean;
begin
  select organization_id, owned_by
  into v_org_id, v_owned_by
  from public.courses
  where id = p_course_id;

  if not (
    public.has_org_role(v_org_id, 'owner', p_user_id) or
    public.has_org_role(v_org_id, 'admin', p_user_id) or
    (public.has_org_role(v_org_id, 'editor', p_user_id) and v_owned_by = p_user_id)
  ) then
    raise exception 'permission denied: insufficient privileges for course %', p_course_id;
  end if;

  select exists (
    select 1 from public.course_pricing_tiers
    where course_id = p_course_id and organization_id = v_org_id and is_free = false
  ) into has_paid_tiers;

  if not has_paid_tiers then
    raise exception 'course (id=%) is already free.', p_course_id;
  end if;

  perform set_config('app.converting_course_pricing', 'true', true);

  delete from public.course_pricing_tiers
  where course_id = p_course_id and organization_id = v_org_id;

  perform set_config('app.converting_course_pricing', 'false', true);

  insert into public.course_pricing_tiers (
    course_id, organization_id, is_free, price, currency_code, created_by, updated_by,
    payment_frequency, tier_name, is_active
  ) values (
    p_course_id, v_org_id, true, 0, 'KES', p_user_id, p_user_id,
    'monthly', 'free', true
  );
end;
$$;


-- ============================================================================
-- FUNCTION: set_course_paid
-- Converts a free course to a paid model
-- Removes all tiers, adds a default paid tier, and sets chapters to paid
-- ============================================================================
create or replace function public.set_course_paid(
  p_course_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org_id uuid;
  v_owned_by uuid;
  paid_tiers_count int;
begin
  select organization_id, owned_by
  into v_org_id, v_owned_by
  from public.courses
  where id = p_course_id;

  if not (
    public.has_org_role(v_org_id, 'owner', p_user_id) or
    public.has_org_role(v_org_id, 'admin', p_user_id) or
    (public.has_org_role(v_org_id, 'editor', p_user_id) and v_owned_by = p_user_id)
  ) then
    raise exception 'permission denied: insufficient privileges for course %', p_course_id;
  end if;

  select count(*)
  into paid_tiers_count
  from public.course_pricing_tiers
  where course_id = p_course_id and organization_id = v_org_id and is_free = false;

  if paid_tiers_count > 0 then
    raise exception 'course (id=%) already has a paid tier.', p_course_id;
  end if;

  perform set_config('app.converting_course_pricing', 'true', true);

  delete from public.course_pricing_tiers
  where course_id = p_course_id and organization_id = v_org_id;

  perform set_config('app.converting_course_pricing', 'false', true);

  insert into public.course_pricing_tiers (
    course_id, organization_id, is_free, price, currency_code, created_by, updated_by,
    payment_frequency, tier_name, tier_description, is_active
  ) values (
    p_course_id, v_org_id, false, 100.00, 'KES', p_user_id, p_user_id,
    'monthly', 'basic plan', 'automatically added paid tier. you can update this.', true
  );
end;
$$;



-- ============================================================================
-- FUNCTION: get_available_payment_frequencies
-- Returns unused enum values for payment_frequency per course
-- Useful for preventing duplicate frequencies in pricing tiers
-- ============================================================================
create or replace function public.get_available_payment_frequencies(
  p_course_id uuid
)
returns public.payment_frequency[]
language plpgsql
set search_path = ''
as $$
declare
  all_frequencies public.payment_frequency[];
  used_frequencies public.payment_frequency[];
  v_org_id uuid;
begin
  select organization_id into v_org_id
  from public.courses
  where id = p_course_id;

  select enum_range(null::public.payment_frequency)
  into all_frequencies;

  select array_agg(payment_frequency)
  into used_frequencies
  from public.course_pricing_tiers
  where course_id = p_course_id and organization_id = v_org_id;

  return (
    select array_agg(freq)
    from unnest(all_frequencies) as freq
    where used_frequencies is null or freq != all(used_frequencies)
  );
end;
$$;



-- ============================================================================
-- FUNCTION: switch_course_pricing_model
-- Utility wrapper to convert course pricing model to 'free' or 'paid'
-- Delegates to set_course_free or set_course_paid based on input
-- ============================================================================
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
  v_org_id uuid;
  v_owned_by uuid;
  current_model text;
begin
  select organization_id, owned_by
  into v_org_id, v_owned_by
  from public.courses
  where id = p_course_id;

  if not (
    public.has_org_role(v_org_id, 'owner', p_user_id) or
    public.has_org_role(v_org_id, 'admin', p_user_id) or
    (public.has_org_role(v_org_id, 'editor', p_user_id) and v_owned_by = p_user_id)
  ) then
    raise exception 'permission denied: cannot switch course pricing model';
  end if;

  if p_target_model not in ('free', 'paid') then
    raise exception 'invalid pricing model: must be ''free'' or ''paid''';
  end if;

  select case
    when exists (
      select 1 from public.course_pricing_tiers
      where course_id = p_course_id and organization_id = v_org_id and is_free = false
    ) then 'paid'
    else 'free'
  end
  into current_model;

  if current_model = p_target_model then
    raise notice 'course already in % model', p_target_model;
    return;
  end if;

  if p_target_model = 'free' then
    perform public.set_course_free(p_course_id, p_user_id);
  else
    perform public.set_course_paid(p_course_id, p_user_id);
  end if;
end;
$$;
