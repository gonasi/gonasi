
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
