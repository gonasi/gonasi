-- ============================================================================
-- Function: reorder_pricing_tiers
-- ============================================================================
-- Reorders pricing tiers within a course using a JSONB array input specifying
-- tier IDs and their desired positions. Ensures data integrity and permission
-- checks based on organization role.
--
-- PARAMETERS:
--   - p_course_id: UUID of the course whose pricing tiers are being reordered
--   - tier_positions: JSONB array of objects {id: uuid, position: int}
--   - p_updated_by: UUID of the user performing the operation
--
-- PERMISSIONS:
--   - Org 'owner' or 'admin' of the course can reorder tiers
--   - Org 'editor' can reorder only if they are the creator (owned_by)
-- ============================================================================

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
  v_org_id uuid;
  v_owned_by uuid;
  temp_offset int := 1000000;
begin
  -- Ensure input is not null or empty
  if tier_positions is null or jsonb_array_length(tier_positions) = 0 then
    raise exception 'tier_positions array cannot be null or empty';
  end if;

  -- Retrieve course organization and creator
  select organization_id, owned_by
  into v_org_id, v_owned_by
  from public.courses
  where id = p_course_id;

  if v_org_id is null then
    raise exception 'Course not found';
  end if;

  -- Enforce permission check using organization roles
  if not (
    public.has_org_role(v_org_id, 'owner', p_updated_by)
    or public.has_org_role(v_org_id, 'admin', p_updated_by)
    or (
      public.has_org_role(v_org_id, 'editor', p_updated_by)
      and v_owned_by = p_updated_by
    )
  ) then
    raise exception 'Insufficient permissions to reorder pricing tiers in this course';
  end if;

  -- Ensure all provided tier IDs are valid and belong to the course
  if exists (
    select 1 
    from jsonb_array_elements(tier_positions) as tp
    left join public.course_pricing_tiers t on t.id = (tp->>'id')::uuid
    where t.id is null or t.course_id != p_course_id
  ) then
    raise exception 'One or more pricing tier IDs do not exist or do not belong to the specified course';
  end if;

  -- Validate that all positions are positive integers
  if exists (
    select 1 from jsonb_array_elements(tier_positions) as tp
    where (tp->>'position')::int <= 0
  ) then
    raise exception 'All position values must be positive integers';
  end if;

  -- Ensure every tier for this course is included exactly once
  if (
    select count(*) from public.course_pricing_tiers
    where course_id = p_course_id
  ) != jsonb_array_length(tier_positions) then
    raise exception 'All tiers for the course must be included in the reorder operation';
  end if;

  -- Ensure there are no duplicate positions
  if (
    select count(distinct (tp->>'position')::int)
    from jsonb_array_elements(tier_positions) as tp
  ) != jsonb_array_length(tier_positions) then
    raise exception 'Duplicate position values are not allowed';
  end if;

  -- Temporarily shift all positions to prevent conflicts
  update public.course_pricing_tiers
  set position = position + temp_offset
  where course_id = p_course_id;

  -- Apply new positions in the desired order
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


-- ============================================================================
-- Function: delete_pricing_tier
-- ============================================================================
-- Permanently deletes a pricing tier from the `course_pricing_tiers` table and
-- reorders the remaining tiers to maintain continuous positions.
--
-- PARAMETERS:
--   - p_tier_id: UUID of the pricing tier to delete
--   - p_deleted_by: UUID of the user performing the deletion
--
-- PERMISSIONS:
--   - Org 'owner' or 'admin' of the course can delete tiers
--   - Org 'editor' can delete only if they are the creator (owned_by)
-- ============================================================================

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
  v_org_id uuid;
  v_owned_by uuid;
  v_position int;
begin
  -- Fetch course, org, owner, and tier position
  select t.course_id, c.organization_id, c.owned_by, t.position
  into v_course_id, v_org_id, v_owned_by, v_position
  from public.course_pricing_tiers t
  join public.courses c on c.id = t.course_id
  where t.id = p_tier_id;

  if v_course_id is null then
    raise exception 'Pricing tier not found';
  end if;

  -- Permission check using organization roles
  if not (
    public.has_org_role(v_org_id, 'owner', p_deleted_by)
    or public.has_org_role(v_org_id, 'admin', p_deleted_by)
    or (
      public.has_org_role(v_org_id, 'editor', p_deleted_by)
      and v_owned_by = p_deleted_by
    )
  ) then
    raise exception 'Insufficient permissions to delete pricing tiers in this course';
  end if;

  -- Delete the tier
  delete from public.course_pricing_tiers
  where id = p_tier_id;

  -- Reorder remaining tiers (shift down positions > deleted tier)
  update public.course_pricing_tiers
  set 
    position = position - 1,
    updated_at = timezone('utc', now()),
    updated_by = p_deleted_by
  where course_id = v_course_id and position > v_position;
end;
$$;
