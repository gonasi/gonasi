-- ============================================================================
-- FUNCTION: enroll_user_in_free_course
-- ============================================================================
-- PURPOSE:
--   Enrolls a user into a FREE published course tier.  Assumptions:
--     - course_enrollments table as provided by the user
--     - course_enrollment_activities table exists (same columns used by paid flow)
--     - pricing tier row exists and is marked free
-- ============================================================================
create or replace function public.enroll_user_in_free_course(
  p_user_id uuid,
  p_published_course_id uuid,
  p_tier_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := timezone('utc', now());
  v_access_start timestamptz := v_now;
  v_access_end timestamptz := v_access_start + interval '1 month';

  -- course / org
  v_org_id uuid;
  v_course_title text;

  -- tier
  v_tier_name text;
  v_tier_description text;
  v_tier_promotional_price numeric(19,4);
  v_tier_price numeric(19,4);
  v_tier_currency public.currency_code;
  v_tier_frequency public.payment_frequency;
  v_tier_is_free boolean;

  -- enrollment
  v_enrollment_id uuid;
  v_existing_enrollment record;

  -- activity
  v_activity_id uuid;
begin
  ---------------------------------------------------------------
  -- Validate published course and get organization
  ---------------------------------------------------------------
  select pc.name, pc.organization_id
  into v_course_title, v_org_id
  from public.published_courses pc
  where pc.id = p_published_course_id
    and pc.is_active = true;

  if not found then
    raise exception 'Published course not found or inactive: %', p_published_course_id;
  end if;

  ---------------------------------------------------------------
  -- Validate pricing tier belongs to the course and is free
  ---------------------------------------------------------------
  select
    pt.tier_name,
    pt.tier_description,
    pt.price      as price_amount,
    pt.promotional_price,
    pt.currency_code::public.currency_code,
    pt.payment_frequency::public.payment_frequency,
    pt.is_free
  into
    v_tier_name,
    v_tier_description,
    v_tier_price,
    v_tier_promotional_price,
    v_tier_currency,
    v_tier_frequency,
    v_tier_is_free
  from public.course_pricing_tiers pt
  where pt.id = p_tier_id
    and pt.course_id = p_published_course_id
    and pt.is_active = true;

  if not found then
    raise exception 'Pricing tier not found for this course: %', p_tier_id;
  end if;

  if not v_tier_is_free then
    raise exception 'TIER_NOT_FREE: tier % is not marked free', p_tier_id;
  end if;

  -- Optional sanity: ensure price is zero if you store numeric price
  if v_tier_price is not null and v_tier_price <> 0 then
    raise exception 'TIER_PRICE_MISMATCH: tier % price is % (expected 0)', p_tier_id, v_tier_price;
  end if;

  ---------------------------------------------------------------
  -- Check for existing enrollment (locks the row when present)
  ---------------------------------------------------------------
  select id, user_id, published_course_id, organization_id, enrolled_at, expires_at, is_active
  into v_existing_enrollment
  from public.course_enrollments e
  where e.user_id = p_user_id
    and e.published_course_id = p_published_course_id
  for update;

  if found then
    -- If already active and not expired, return existing
    if v_existing_enrollment.is_active = true
       and (v_existing_enrollment.expires_at is null or v_existing_enrollment.expires_at > v_now) then
      return jsonb_build_object(
        'success', true,
        'message', 'User already actively enrolled in free course',
        'enrollment_id', v_existing_enrollment.id,
        'was_created', false
      );
    end if;

    -- Otherwise renew / reactivate the enrollment
    update public.course_enrollments
    set expires_at = v_access_end,
        is_active = true,
        updated_at = v_now,
        enrolled_at = coalesce(v_existing_enrollment.enrolled_at, v_now),
        completed_at = null
    where id = v_existing_enrollment.id
    returning id into v_enrollment_id;
  else
    -- Create a new enrollment
    insert into public.course_enrollments (
      id, user_id, published_course_id, organization_id,
      enrolled_at, expires_at, completed_at, is_active,
      created_at, updated_at
    ) values (
      gen_random_uuid(), p_user_id, p_published_course_id, v_org_id,
      v_access_start, v_access_end, null, true,
      v_now, v_now
    )
    returning id into v_enrollment_id;
  end if;

  ---------------------------------------------------------------
  -- Insert enrollment activity (mirrors paid flow activity shape)
  ---------------------------------------------------------------
  insert into public.course_enrollment_activities (
    enrollment_id, tier_name, tier_description, payment_frequency,
    currency_code, is_free, price_paid, promotional_price, was_promotional,
    access_start, access_end, created_by, created_at
  ) values (
    v_enrollment_id, v_tier_name, v_tier_description, v_tier_frequency,
    v_tier_currency, true, 0, v_tier_promotional_price,
    (v_tier_promotional_price is not null and v_tier_promotional_price < coalesce(v_tier_price, 0)),
    v_access_start, v_access_end, p_user_id, v_now
  ) returning id into v_activity_id;

  ---------------------------------------------------------------
  -- Insert user notification for free enrollment success
  ---------------------------------------------------------------
  begin
    perform public.insert_user_notification(
      p_user_id := p_user_id,
      p_type_key := 'course_enrollment_free_success',
      p_metadata := jsonb_build_object(
        'enrollment_id', v_enrollment_id,
        'course_title', v_course_title,
        'tier_name', v_tier_name,
        'access_start', v_access_start,
        'access_end', v_access_end
      )
    );
  exception
    when others then
      -- Log or ignore notification errors, but don't fail the enrollment
      raise notice 'Failed to insert user notification: %', sqlerrm;
  end;

  
  ---------------------------------------------------------------
  -- Return success summary
  ---------------------------------------------------------------
  return jsonb_build_object(
    'success', true,
    'message', 'User enrolled (free tier) successfully',
    'enrollment_id', v_enrollment_id,
    'activity_id', v_activity_id,
    'user_id', p_user_id,
    'course_title', v_course_title,
    'tier_name', v_tier_name,
    'access_start', v_access_start,
    'access_end', v_access_end
  );

exception
  when unique_violation then
    -- Defensive: if concurrent insert violated unique constraint, fetch the row and return it
    perform 1
    from public.course_enrollments e
    where e.user_id = p_user_id
      and e.published_course_id = p_published_course_id
    limit 1;

    select id into v_enrollment_id
    from public.course_enrollments e
    where e.user_id = p_user_id
      and e.published_course_id = p_published_course_id
    limit 1;

    return jsonb_build_object(
      'success', true,
      'message', 'User already enrolled (race condition handled)',
      'enrollment_id', v_enrollment_id,
      'was_created', false
    );

  when others then
    raise exception 'Free enrollment failed: %', sqlerrm;
end;
$$;
