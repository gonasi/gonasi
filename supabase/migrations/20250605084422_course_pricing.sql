-- ============================================================================
-- COURSE PRICING TIERS SCHEMA - COMPLETE FIXED VERSION
-- ============================================================================
-- This schema defines a flexible pricing system for courses that supports:
-- - Multiple payment frequencies (monthly, quarterly, annual, etc.)
-- - Free and paid tiers with promotional pricing
-- - Automatic tier management with business logic enforcement
-- - Comprehensive RBAC (role-based access control) policies
-- 
-- KEY FIXES:
-- 1. Fixed set_course_paid() function to create PAID tier (not free)
-- 2. Improved trigger logic to handle course conversion scenarios
-- 3. Added proper bypass mechanisms for business rule conflicts
-- ============================================================================

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Defines supported payment frequencies for course subscriptions
-- This enum ensures consistency across the application and prevents invalid frequency values
CREATE TYPE payment_frequency AS ENUM (
  'monthly',        -- charged every month
  'bi_monthly',     -- charged every 2 months
  'quarterly',      -- charged every 3 months (popular for business courses)
  'semi_annual',    -- charged every 6 months
  'annual'          -- charged every 12 months (often discounted)
);

-- ============================================================================
-- MAIN TABLE: course_pricing_tiers
-- ============================================================================

-- This table stores all pricing information for courses, supporting both free and paid models
-- Each course can have multiple pricing tiers with different payment frequencies
-- The table includes promotional pricing, display metadata, and audit trails
CREATE TABLE public.course_pricing_tiers (
  -- Primary key and course relationship
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

  -- Core pricing configuration
  payment_frequency payment_frequency NOT NULL,
  is_free BOOLEAN NOT NULL DEFAULT true,
  price NUMERIC(19,4) NOT NULL CHECK (price >= 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'KES' CHECK (currency_code IN ('KES', 'USD')),

  -- Promotional pricing system
  promotional_price NUMERIC(19,4) NULL CHECK (promotional_price >= 0),
  promotion_start_date TIMESTAMPTZ NULL,
  promotion_end_date TIMESTAMPTZ NULL,

  -- Display and marketing metadata
  -- These fields control how pricing tiers appear in the UI
  tier_name TEXT NULL,           -- e.g., "monthly plan", "premium annual"
  tier_description TEXT NULL,    -- marketing copy or feature descriptions

  -- Status and display ordering
  is_active BOOLEAN NOT NULL DEFAULT true,      -- allows soft deletion of tiers
  position INTEGER NOT NULL DEFAULT 0,          -- controls display order in UI

  -- UI enhancement flags
  -- These flags help highlight certain tiers for better conversion
  is_popular BOOLEAN NOT NULL DEFAULT false,      -- shows "most popular" badge
  is_recommended BOOLEAN NOT NULL DEFAULT false,  -- shows "recommended" badge

  -- Comprehensive audit trail
  -- Tracks who created/modified each tier and when
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  updated_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Business logic constraints
  -- These constraints enforce pricing model integrity

  -- Ensures promotion dates are logically ordered
  CONSTRAINT chk_promotion_dates CHECK (
    promotion_start_date IS NULL OR promotion_end_date IS NULL OR 
    promotion_start_date < promotion_end_date
  ),

  -- Ensures promotional price is always lower than regular price
  CONSTRAINT chk_promotional_price CHECK (
    is_free = true OR promotional_price IS NULL OR promotional_price < price
  ),

  -- Ensures paid tiers have a price greater than zero
  CONSTRAINT chk_price_nonfree CHECK (
    is_free = true OR price > 0
  ),

  -- Prevents free tiers from having promotional pricing (business rule)
  -- Free tiers should not have promotions as they're already free
  CONSTRAINT chk_free_has_no_promo CHECK (
    is_free = false OR (
      promotional_price IS NULL AND 
      promotion_start_date IS NULL AND 
      promotion_end_date IS NULL
    )
  ),

  CONSTRAINT uq_one_active_tier_per_frequency
  UNIQUE (course_id, payment_frequency, is_active)
  DEFERRABLE INITIALLY DEFERRED
);

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- Basic foreign key indexes for join performance
CREATE INDEX idx_course_pricing_tiers_course_id ON public.course_pricing_tiers (course_id);
CREATE INDEX idx_course_pricing_tiers_created_by ON public.course_pricing_tiers (created_by);
CREATE INDEX idx_course_pricing_tiers_updated_by ON public.course_pricing_tiers (updated_by);

-- Composite indexes for common query patterns
CREATE INDEX idx_course_pricing_tiers_course_id_active 
  ON public.course_pricing_tiers (course_id, is_active);

CREATE INDEX idx_course_pricing_tiers_position 
  ON public.course_pricing_tiers (course_id, position);

-- Promotional pricing queries
CREATE INDEX idx_course_pricing_tiers_promotion_dates 
  ON public.course_pricing_tiers (promotion_start_date, promotion_end_date);

-- UI enhancement flags for marketing queries
CREATE INDEX idx_course_pricing_tiers_popular_recommended 
  ON public.course_pricing_tiers (is_popular, is_recommended);

-- ============================================================================
-- TABLE DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.course_pricing_tiers IS 
  'Comprehensive pricing system for courses supporting multiple payment frequencies, promotional pricing, free access tiers, and advanced UI customization options. Includes built-in business logic constraints and audit trails.';

-- ============================================================================
-- TRIGGER FUNCTIONS AND BUSINESS LOGIC AUTOMATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.enforce_at_least_one_active_tier()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF new.is_active = false THEN
    -- Check if this is the last active tier for this course
    IF NOT EXISTS (
      SELECT 1
      FROM course_pricing_tiers
      WHERE course_id = new.course_id
        AND id != new.id
        AND is_active = true
    ) THEN
      RAISE EXCEPTION 'Each course must have at least one active pricing tier.';
    END IF;
  END IF;
  RETURN new;
END;
$$;

-- Automatically sets position for new pricing tiers
-- When a tier is created without specifying position, it gets the next available number
-- This ensures consistent ordering without manual position management
CREATE OR REPLACE FUNCTION public.set_course_pricing_tier_position()
RETURNS TRIGGER
AS $$
BEGIN
  -- Only set position if it's not provided or is zero
  IF new.position IS NULL OR new.position = 0 THEN
    -- Find the highest existing position for this course and add 1
    SELECT COALESCE(MAX(position), 0) + 1
    INTO new.position
    FROM public.course_pricing_tiers
    WHERE course_id = new.course_id;
  END IF;
  RETURN new;
END;
$$
LANGUAGE plpgsql
SET search_path = '';

-- Trigger to automatically set position on insert
CREATE TRIGGER trg_set_course_pricing_tier_position
BEFORE INSERT ON public.course_pricing_tiers
FOR EACH ROW
EXECUTE FUNCTION public.set_course_pricing_tier_position();

-- FIXED: Enforces the "free tier exclusivity" business rule with conversion bypass
-- When a course is marked as free, all other pricing tiers are automatically removed
-- This prevents mixed free/paid models which could confuse users
CREATE OR REPLACE FUNCTION public.trg_delete_other_tiers_if_free()
RETURNS TRIGGER AS $$
DECLARE
  bypass_check BOOLEAN;
BEGIN
  -- Check if we're in a course conversion context
  SELECT COALESCE(current_setting('app.converting_course_pricing', true)::boolean, false) 
  INTO bypass_check;
  
  -- Skip trigger during course conversion to prevent conflicts
  IF bypass_check THEN
    RETURN new;
  END IF;

  IF new.is_free = true THEN
    -- Delete all other tiers for this course when adding a free tier
    DELETE FROM public.course_pricing_tiers
    WHERE course_id = new.course_id
      AND id != new.id;
  END IF;
  RETURN new;
END;
$$ 
LANGUAGE plpgsql
SET search_path = '';

-- Trigger to enforce free tier exclusivity
CREATE TRIGGER trg_handle_free_tier
AFTER INSERT OR UPDATE ON public.course_pricing_tiers
FOR EACH ROW
EXECUTE FUNCTION public.trg_delete_other_tiers_if_free();

-- FIXED: Prevents deletion of the last paid tier for paid courses with conversion bypass
-- This maintains data integrity by ensuring paid courses always have at least one paid option
-- Includes bypass mechanism for bulk operations (course conversion scenarios)
CREATE OR REPLACE FUNCTION public.trg_prevent_deleting_last_paid_tier()
RETURNS TRIGGER AS $$
DECLARE
  remaining_paid_tiers INT;
  bypass_check BOOLEAN;
BEGIN
  -- Check if we're in a course conversion context (bulk operations)
  -- This allows controlled deletion during course type changes
  SELECT COALESCE(current_setting('app.converting_course_pricing', true)::boolean, false) 
  INTO bypass_check;
  
  IF bypass_check THEN
    RETURN old; -- Skip the check during course conversion
  END IF;

  -- Only check if we're deleting a paid tier
  IF old.is_free = false THEN
    -- Count remaining paid tiers after this deletion
    SELECT count(*) INTO remaining_paid_tiers
    FROM public.course_pricing_tiers
    WHERE course_id = old.course_id
      AND id != old.id
      AND is_free = false;

    -- Prevent deletion if this would leave zero paid tiers
    IF remaining_paid_tiers = 0 THEN
      RAISE EXCEPTION 'Cannot delete the last paid tier for a paid course (course_id=%)', old.course_id;
    END IF;
  END IF;
  
  RETURN old;
END;
$$ 
LANGUAGE plpgsql
SET search_path = '';

-- Trigger to prevent deletion of last paid tier
CREATE TRIGGER trg_prevent_last_paid_tier_deletion
BEFORE DELETE ON public.course_pricing_tiers
FOR EACH ROW
EXECUTE FUNCTION public.trg_prevent_deleting_last_paid_tier();

-- FIXED: This function runs before deleting a pricing tier with conversion bypass
-- It checks if the tier being deleted is free, and if it's the only free tier for the course
-- If it is, the deletion is blocked with an error
CREATE OR REPLACE FUNCTION public.trg_prevent_deleting_last_free_tier()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    remaining_free_count INT;
    bypass_check BOOLEAN;
BEGIN
    -- Check if we're in a course conversion context
    SELECT COALESCE(current_setting('app.converting_course_pricing', true)::boolean, false) 
    INTO bypass_check;
    
    -- Skip check during course conversion
    IF bypass_check THEN
        RETURN old;
    END IF;

    -- Only run check if the deleted tier is free
    IF old.is_free THEN
        -- Count remaining active free tiers for the same course, excluding the one being deleted
        SELECT count(*) INTO remaining_free_count
        FROM public.course_pricing_tiers
        WHERE course_id = old.course_id
          AND id <> old.id
          AND is_free = true
          AND is_active = true;

        -- If none remain, raise an error
        IF remaining_free_count = 0 THEN
            RAISE EXCEPTION 'Cannot delete the only free pricing tier for course %', old.course_id;
        END IF;
    END IF;

    -- Allow deletion
    RETURN old;
END;
$$;

-- Attach the trigger to the course_pricing_tiers table
-- It fires before any row is deleted
CREATE TRIGGER trg_prevent_deleting_last_free_tier
BEFORE DELETE ON public.course_pricing_tiers
FOR EACH ROW
EXECUTE FUNCTION public.trg_prevent_deleting_last_free_tier();

-- FIXED: Prevent deactivating last free tier with conversion bypass
CREATE OR REPLACE FUNCTION public.trg_prevent_deactivating_last_free_tier()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    bypass_check BOOLEAN;
BEGIN
    -- Check if we're in a course conversion context
    SELECT COALESCE(current_setting('app.converting_course_pricing', true)::boolean, false) 
    INTO bypass_check;
    
    -- Skip check during course conversion
    IF bypass_check THEN
        RETURN new;
    END IF;

    -- Only run check if the tier is free and is being deactivated
    IF old.is_free
       AND old.is_active
       AND new.is_active = false THEN

        -- Check if other active free tiers exist for the same course
        IF NOT EXISTS (
            SELECT 1 FROM public.course_pricing_tiers
            WHERE course_id = old.course_id
              AND id <> old.id
              AND is_free = true
              AND is_active = true
        ) THEN
            RAISE EXCEPTION 'Cannot deactivate the only free pricing tier for course %', old.course_id;
        END IF;
    END IF;

    -- Allow update
    RETURN new;
END;
$$;

CREATE TRIGGER trg_prevent_deactivating_last_free_tier
BEFORE UPDATE ON public.course_pricing_tiers
FOR EACH ROW
WHEN (old.is_active = true AND new.is_active = false)
EXECUTE FUNCTION public.trg_prevent_deactivating_last_free_tier();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) CONFIGURATION
-- ============================================================================

-- Enable RLS to ensure users can only access pricing tiers for courses they have permission to view
ALTER TABLE public.course_pricing_tiers ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES FOR FINE-GRAINED ACCESS CONTROL
-- ============================================================================

-- Read access: users can view pricing tiers for courses they have any level of access to
-- This includes course admins, editors, viewers, and course creators
CREATE POLICY "select: users with course roles or owners can view pricing tiers"
ON public.course_pricing_tiers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_pricing_tiers.course_id
      AND (
        is_course_admin(c.id, (SELECT auth.uid())) OR
        is_course_editor(c.id, (SELECT auth.uid())) OR
        is_course_viewer(c.id, (SELECT auth.uid())) OR
        c.created_by = (SELECT auth.uid())
      )
  )
);

-- Create access: only course admins, editors, and creators can add new pricing tiers
-- Viewers cannot create pricing tiers as this could affect course monetization
CREATE POLICY "insert: users with course roles or owners can add pricing tiers"
ON public.course_pricing_tiers
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_pricing_tiers.course_id
      AND (
        is_course_admin(c.id, (SELECT auth.uid())) OR
        is_course_editor(c.id, (SELECT auth.uid())) OR
        c.created_by = (SELECT auth.uid())
      )
  )
);

-- Update access: same permissions as create - admins, editors, and creators only
-- Requires both using and with check clauses for complete protection
CREATE POLICY "update: users with admin/editor roles or owners can modify pricing tiers"
ON public.course_pricing_tiers
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_pricing_tiers.course_id
      AND (
        is_course_admin(c.id, (SELECT auth.uid())) OR
        is_course_editor(c.id, (SELECT auth.uid())) OR
        c.created_by = (SELECT auth.uid())
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_pricing_tiers.course_id
      AND (
        is_course_admin(c.id, (SELECT auth.uid())) OR
        is_course_editor(c.id, (SELECT auth.uid())) OR
        c.created_by = (SELECT auth.uid())
      )
  )
);

-- Delete access: same permissions as create/update
-- Deletion of pricing tiers is a sensitive operation that affects course monetization
CREATE POLICY "delete: course admins, editors, and owners can remove pricing tiers"
ON public.course_pricing_tiers
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_pricing_tiers.course_id
      AND (
        is_course_admin(c.id, (SELECT auth.uid())) OR
        is_course_editor(c.id, (SELECT auth.uid())) OR
        c.created_by = (SELECT auth.uid())
      )
  )
);

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