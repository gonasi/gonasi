-- ====================================================================================
-- Function: reorder_course_pricing_tiers
-- ====================================================================================
-- Reorders pricing tiers within a course using a JSONB array input specifying
-- tier IDs and their new positions.
--
-- Implementation notes:
-- 1. Validates user permissions to modify pricing tiers for the course
-- 2. Validates input presence and structure
-- 3. Ensures all pricing tiers for the course are included in the input
-- 4. Checks that all tier IDs exist and belong to the specified course
-- 5. Temporarily shifts all tier positions by a large offset to avoid conflicts
-- 6. Updates each tier with its new position and updates audit fields
-- 7. Ensures positions are consecutive starting from 1
--
-- @param p_course_id: UUID of the course containing pricing tiers to reorder
-- @param tier_positions: JSONB array of objects {id: uuid, position: int}
-- @param p_updated_by: UUID of user performing the reorder operation
-- ====================================================================================
create or replace function reorder_course_pricing_tiers(
  p_course_id uuid,
  tier_positions jsonb,
  p_updated_by uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  temp_offset int := 1000000;
begin
  -- Validate input
  if tier_positions is null or jsonb_array_length(tier_positions) = 0 then
    raise exception 'tier_positions array cannot be null or empty';
  end if;

  -- Verify permission
  if not exists (
    select 1
    from public.courses c
    where c.id = p_course_id
      and (
        public.is_course_admin(c.id, p_updated_by) or
        public.is_course_editor(c.id, p_updated_by) or
        c.created_by = p_updated_by
      )
  ) then
    raise exception 'Insufficient permissions to reorder pricing tiers';
  end if;

  -- Validate all tier IDs exist and belong to the course
  if exists (
    select 1
    from jsonb_array_elements(tier_positions) as tp
    left join public.course_pricing_tiers cpt on cpt.id = (tp->>'id')::uuid
    where cpt.id is null or cpt.course_id != p_course_id
  ) then
    raise exception 'One or more tier IDs do not exist or do not belong to the specified course';
  end if;

  -- Validate positions are positive integers
  if exists (
    select 1
    from jsonb_array_elements(tier_positions) as tp
    where (tp->>'position')::int <= 0
  ) then
    raise exception 'All position values must be positive integers';
  end if;

  -- Ensure all tiers are included
  if (
    select count(*)
    from public.course_pricing_tiers
    where course_id = p_course_id
  ) != jsonb_array_length(tier_positions) then
    raise exception 'All tiers in the course must be included in the reorder operation';
  end if;

  -- Check for duplicate positions
  if (
    select count(distinct (tp->>'position')::int)
    from jsonb_array_elements(tier_positions) as tp
  ) != jsonb_array_length(tier_positions) then
    raise exception 'Duplicate position values are not allowed';
  end if;

  -- Temporarily shift all positions
  update public.course_pricing_tiers
  set position = position + temp_offset
  where course_id = p_course_id;

  -- Apply new positions
  update public.course_pricing_tiers
  set 
    position = new_positions.position,
    updated_at = timezone('utc', now()),
    updated_by = p_updated_by
  from (
    select 
      (tp->>'id')::uuid as id,
      row_number() over (order by (tp->>'position')::int) as position
    from jsonb_array_elements(tier_positions) as tp
  ) as new_positions
  where course_pricing_tiers.id = new_positions.id
    and course_pricing_tiers.course_id = p_course_id;
end;
$$;


-- ====================================================================================
-- Function: delete_course_pricing_tier
-- ====================================================================================
-- Deletes a pricing tier from a course and reorders the remaining tiers.
--
-- Implementation notes:
-- 1. Retrieves the course ID and current position of the tier to be deleted
-- 2. Validates user permissions for modifying the course
-- 3. Deletes the specified pricing tier
-- 4. Reorders remaining tiers by decrementing the position of those after the deleted one
-- 5. Updates audit fields for affected tiers
--
-- @param p_tier_id: UUID of the pricing tier to delete
-- @param p_deleted_by: UUID of user performing the delete operation
-- ====================================================================================
create or replace function delete_course_pricing_tier(
  p_tier_id uuid,
  p_deleted_by uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_course_id uuid;
  v_position int;
begin
  -- Get course and position
  select course_id, position
  into v_course_id, v_position
  from public.course_pricing_tiers
  where id = p_tier_id;

  if v_course_id is null then
    raise exception 'Pricing tier does not exist';
  end if;

  -- Permission check
  if not exists (
    select 1
    from public.courses c
    where c.id = v_course_id
      and (
        public.is_course_admin(c.id, p_deleted_by) or
        public.is_course_editor(c.id, p_deleted_by) or
        c.created_by = p_deleted_by
      )
  ) then
    raise exception 'Insufficient permissions to delete pricing tiers';
  end if;

  -- Delete tier
  delete from public.course_pricing_tiers
  where id = p_tier_id;

  if not found then
    raise exception 'Failed to delete pricing tier';
  end if;

  -- Reorder remaining tiers
  update public.course_pricing_tiers
  set 
    position = position - 1,
    updated_at = timezone('utc', now()),
    updated_by = p_deleted_by
  where course_id = v_course_id
    and position > v_position;
end;
$$;
