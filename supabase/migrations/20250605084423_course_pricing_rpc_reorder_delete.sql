-- ====================================================================================
-- Function: reorder_pricing_tiers
-- ====================================================================================
-- Reorders pricing tiers within a course using a JSONB array input specifying
-- tier IDs and their new positions.
--
-- @param p_course_id: UUID of the course whose pricing tiers are being reordered
-- @param tier_positions: JSONB array of objects {id: uuid, position: int}
-- @param p_updated_by: UUID of user performing the reorder operation
create or replace function reorder_pricing_tiers(
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
  -- Validate that tier_positions array is not empty or null
  if tier_positions is null or jsonb_array_length(tier_positions) = 0 then
    raise exception 'tier_positions array cannot be null or empty';
  end if;

  -- Validate permissions (assumes similar role functions as for chapters)
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
    raise exception 'Insufficient permissions to reorder pricing tiers in this course';
  end if;

  -- Validate that all tier IDs exist and belong to the course
  if exists (
    select 1 
    from jsonb_array_elements(tier_positions) as tp
    left join public.course_pricing_tiers t on t.id = (tp->>'id')::uuid
    where t.id is null or t.course_id != p_course_id
  ) then
    raise exception 'One or more pricing tier IDs do not exist or do not belong to the specified course';
  end if;

  -- Validate that position values are positive integers
  if exists (
    select 1
    from jsonb_array_elements(tier_positions) as tp
    where (tp->>'position')::int <= 0
  ) then
    raise exception 'All position values must be positive integers';
  end if;

  -- Ensure all tiers are included
  if (
    select count(*) from public.course_pricing_tiers
    where course_id = p_course_id
  ) != jsonb_array_length(tier_positions) then
    raise exception 'All tiers for the course must be included in the reorder operation';
  end if;

  -- Check for duplicate positions
  if (
    select count(distinct (tp->>'position')::int)
    from jsonb_array_elements(tier_positions) as tp
  ) != jsonb_array_length(tier_positions) then
    raise exception 'Duplicate position values are not allowed';
  end if;

  -- Temporarily shift all active tier positions
  update public.course_pricing_tiers
  set position = position + temp_offset
  where course_id = p_course_id;

  -- Apply new positions and audit
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
  where public.course_pricing_tiers.id = new_positions.id
    and course_id = p_course_id;
end;
$$;

-- ====================================================================================
-- Function: delete_pricing_tier
-- ====================================================================================
-- Soft-deletes a pricing tier by removing it from the `course_pricing_tiers` table, 
-- and reorders the remaining tiers for the same course to maintain continuous positions.
--
-- Parameters:
--   @param p_tier_id UUID       -- ID of the pricing tier to delete
--   @param p_deleted_by UUID    -- ID of the user performing the deletion
--
-- Behavior:
--   - Verifies the pricing tier exists and retrieves its course ID and position.
--   - Checks that the user has sufficient permissions (admin, editor, or creator).
--   - Deletes the tier from the table.
--   - Decrements the `position` of remaining tiers that come after the deleted one.

create or replace function delete_pricing_tier(
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
  -- Retrieve course ID and position
  select course_id, position
  into v_course_id, v_position
  from public.course_pricing_tiers
  where id = p_tier_id;

  -- Check existence
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
    raise exception 'Insufficient permissions to delete pricing tiers in this course';
  end if;

  -- Delete the tier
  delete from public.course_pricing_tiers
  where id = p_tier_id;

  -- Reorder remaining tiers
  update public.course_pricing_tiers
  set 
    position = position - 1,
    updated_at = timezone('utc', now()),
    updated_by = p_deleted_by
  where course_id = v_course_id and position > v_position;
end;
$$;
