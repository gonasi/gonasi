
-- ============================================================================
-- AUTOMATED COURSE SETUP FUNCTIONS
-- ============================================================================

-- Automatically creates a default free tier when a new course is created
-- This ensures every course has a basic pricing structure from the start
-- Simplifies course creation workflow and provides consistent defaults
CREATE OR REPLACE FUNCTION public.add_default_free_pricing_tier()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Insert a basic free tier for every new course
  -- Uses course creator as both creator and updater for audit trail
  INSERT INTO public.course_pricing_tiers (
    course_id,
    is_free,
    price,
    currency_code,
    created_by,
    updated_by,
    payment_frequency,
    tier_name
  )
  VALUES (
    new.id,              -- The newly created course
    true,                -- Free tier
    0,                   -- No cost
    'USD',               -- Default currency
    new.created_by,      -- Course creator
    new.created_by,      -- Course creator
    'monthly',           -- Default frequency
    'Free'               -- Descriptive name
  );

  RETURN new;
END;
$$;

-- Trigger to automatically add free tier to new courses
-- Executes after course creation to ensure course exists before adding pricing tier
CREATE TRIGGER trg_add_default_free_pricing_tier
AFTER INSERT ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.add_default_free_pricing_tier();

-- ============================================================================
-- course conversion functions (rpc endpoints)
-- ============================================================================

-- converts a paid course to free by:
-- 1. removing all pricing tiers (both free and paid)
-- 2. inserting a standard free pricing tier
-- 3. updating all chapters to not require payment
-- this is a complete conversion operation that handles the transition safely
-- includes permission checks and bypass mechanisms for business rule triggers

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
  -- verify user has permission to modify course pricing
  -- only course admins, editors, and creators can change pricing models
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
      using errcode = '42501'; -- insufficient_privilege
  end if;

  -- check if course actually has paid tiers to convert
  -- prevents unnecessary operations on already-free courses
  select exists (
    select 1 from public.course_pricing_tiers
    where course_id = p_course_id
      and is_free = false
  ) into has_paid_tiers;

  if not has_paid_tiers then
    raise exception 'course (id=%) is already free.', p_course_id
      using errcode = 'P0001';
  end if;

  -- temporarily bypass business rule triggers during conversion
  -- this allows deletion of all tiers without triggering "last paid tier" protection
  perform set_config('app.converting_course_pricing', 'true', true);

  -- remove all existing pricing tiers (both free and paid)
  delete from public.course_pricing_tiers
  where course_id = p_course_id;

  -- re-enable business rule triggers
  perform set_config('app.converting_course_pricing', 'false', true);

  -- insert a new standard free tier
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
  ) values (
    p_course_id, 
    true,           -- free tier
    0,              -- no cost
    'KES',          -- local currency default
    p_user_id,      -- conversion performer
    p_user_id,      -- conversion performer
    'monthly',      -- default frequency
    'Free',         -- standard name
    true            -- active tier
  );

  -- mark all chapters in the course as not requiring payment
  update public.chapters
  set requires_payment = false
  where course_id = p_course_id;
end;
$$;

-- ============================================================================
-- course conversion functions (rpc endpoints)
-- ============================================================================

-- converts a free course to paid by:
-- 1. removing all existing pricing tiers
-- 2. creating a default paid pricing tier
-- 3. marking all chapters as requiring payment
-- includes validation to prevent accidental conversions
-- handles permission checks and trigger bypassing

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
  -- verify user permissions for course pricing changes
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
      using errcode = '42501'; -- insufficient_privilege
  end if;

  -- check if course already has paid tiers
  -- prevents accidental re-conversion of already-paid courses
  select count(*) into paid_tiers_count
  from public.course_pricing_tiers
  where course_id = p_course_id
    and is_free = false;

  if paid_tiers_count > 0 then
    raise exception 'course (id=%) already has a paid tier and is considered paid.', p_course_id
      using errcode = 'P0001';
  end if;

  -- temporarily bypass business rule triggers for clean conversion
  perform set_config('app.converting_course_pricing', 'true', true);

  -- remove all existing tiers to avoid constraint conflicts
  delete from public.course_pricing_tiers
  where course_id = p_course_id;

  -- re-enable business rule enforcement
  perform set_config('app.converting_course_pricing', 'false', true);

  -- create default paid tier with starter pricing
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
  ) values (
    p_course_id,
    false,                                                      -- paid tier
    100.00,                                                     -- starter price
    'KES',                                                      -- local currency
    p_user_id,
    p_user_id,
    'monthly',
    'Basic Plan',
    'automatically added paid tier. you can update this.',
    true
  );

  -- mark all chapters in the course as requiring payment
  update public.chapters
  set requires_payment = true
  where course_id = p_course_id;
end;
$$;


-- ============================================================================
-- ADDITIONAL UTILITY FUNCTIONS
-- ============================================================================

-- Function: get_available_payment_frequencies(p_course_id UUID)
-- Purpose : Returns a list of unused payment_frequency enum values for a course
-- Inputs  : p_course_id - UUID of the course
-- Returns : public.payment_frequency[] - Array of available (unused) enum values
CREATE OR REPLACE FUNCTION get_available_payment_frequencies(p_course_id UUID)
RETURNS public.payment_frequency[] AS $$
DECLARE
  all_frequencies public.payment_frequency[]; -- All possible enum values
  used_frequencies public.payment_frequency[]; -- Values already used for this course
BEGIN
  -- Get all possible enum values
  SELECT enum_range(null::public.payment_frequency)
  INTO all_frequencies;

  -- Get used frequencies for the course (only active tiers)
  SELECT array_agg(payment_frequency)
  INTO used_frequencies
  FROM public.course_pricing_tiers
  WHERE course_id = p_course_id;

  -- Return unused frequencies
  RETURN (
    SELECT array_agg(freq)
    FROM unnest(all_frequencies) AS freq
    WHERE used_frequencies IS NULL OR freq != ALL(used_frequencies)
  );
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- Add a utility function to safely switch course pricing models
CREATE OR REPLACE FUNCTION public.switch_course_pricing_model(
    p_course_id UUID, 
    p_user_id UUID, 
    p_target_model TEXT -- 'free' or 'paid'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    has_access BOOLEAN;
    current_model TEXT;
BEGIN
    -- Verify user permissions
    SELECT EXISTS (
        SELECT 1 FROM public.courses c
        WHERE c.id = p_course_id
          AND (
            public.is_course_admin(c.id, p_user_id)
            OR public.is_course_editor(c.id, p_user_id)
            OR c.created_by = p_user_id
          )
    ) INTO has_access;

    IF NOT has_access THEN
        RAISE EXCEPTION 'Permission denied: you do not have access to modify this course'
            USING errcode = '42501';
    END IF;

    -- Validate target model
    IF p_target_model NOT IN ('free', 'paid') THEN
        RAISE EXCEPTION 'Invalid target model: must be ''free'' or ''paid''';
    END IF;

    -- Determine current model
    SELECT CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.course_pricing_tiers 
            WHERE course_id = p_course_id AND is_free = false
        ) THEN 'paid'
        ELSE 'free'
    END INTO current_model;

    -- Skip if already in target model
    IF current_model = p_target_model THEN
        RAISE NOTICE 'Course is already in % model', p_target_model;
        RETURN;
    END IF;

    -- Perform the switch
    IF p_target_model = 'free' THEN
        PERFORM public.set_course_free(p_course_id, p_user_id);
    ELSE
        PERFORM public.set_course_paid(p_course_id, p_user_id);
    END IF;
END;
$$;

-- Add helper function to check if course conversion is safe
CREATE OR REPLACE FUNCTION public.can_convert_course_pricing(
    p_course_id UUID,
    p_target_model TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    has_active_subscriptions BOOLEAN;
BEGIN
    -- Check for active subscriptions (assuming you have a subscriptions table)
    -- This prevents converting a course that has paying customers
    SELECT EXISTS (
        SELECT 1 FROM subscriptions s
        JOIN course_pricing_tiers cpt ON s.pricing_tier_id = cpt.id
        WHERE cpt.course_id = p_course_id
          AND s.status = 'active'
          AND cpt.is_free = false
    ) INTO has_active_subscriptions;

    -- Prevent converting paid course to free if there are active paid subscriptions
    IF p_target_model = 'free' AND has_active_subscriptions THEN
        RETURN false;
    END IF;

    RETURN true;
END;
$$;


CREATE OR REPLACE FUNCTION public.trg_ensure_active_tier_exists()
RETURNS TRIGGER AS $$
DECLARE
  active_tier_count INTEGER;
  bypass_check BOOLEAN;
BEGIN
  -- Check if we're in a course conversion context
  SELECT COALESCE(current_setting('app.converting_course_pricing', true)::boolean, false) 
  INTO bypass_check;
  
  -- Skip trigger during course conversion to prevent conflicts
  IF bypass_check THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Handle DELETE operations
  IF TG_OP = 'DELETE' THEN
    -- Count remaining active tiers for this course after deletion
    SELECT COUNT(*)
    INTO active_tier_count
    FROM public.course_pricing_tiers
    WHERE course_id = OLD.course_id
      AND is_active = true
      AND id != OLD.id; -- Exclude the row being deleted
    
    -- Prevent deletion if it would leave no active tiers
    IF active_tier_count = 0 THEN
      RAISE EXCEPTION 'Cannot delete tier: Course must have at least one active pricing tier (course_id: %)', OLD.course_id;
    END IF;
    
    RETURN OLD;
  END IF;

  -- Handle UPDATE operations (deactivating a tier)
  IF TG_OP = 'UPDATE' AND OLD.is_active = true AND NEW.is_active = false THEN
    -- Count remaining active tiers for this course after deactivation
    SELECT COUNT(*)
    INTO active_tier_count
    FROM public.course_pricing_tiers
    WHERE course_id = NEW.course_id
      AND is_active = true
      AND id != NEW.id; -- Exclude the row being updated
    
    -- Prevent deactivation if it would leave no active tiers
    IF active_tier_count = 0 THEN
      RAISE EXCEPTION 'Cannot deactivate tier: Course must have at least one active pricing tier (course_id: %)', NEW.course_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ 
LANGUAGE plpgsql
SET search_path = '';

-- Trigger to enforce at least one active tier per course
-- Using BEFORE trigger to prevent the operation before it happens
CREATE TRIGGER trg_ensure_active_tier
  BEFORE UPDATE OR DELETE ON public.course_pricing_tiers
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_ensure_active_tier_exists();