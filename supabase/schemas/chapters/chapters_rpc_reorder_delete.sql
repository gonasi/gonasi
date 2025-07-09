-- ====================================================================================
-- SQL File: lesson_blocks_rpc_reorder_delete.sql
-- Purpose: Reorder and delete lesson blocks with organization-level permissions.
-- Rules:
--   - Organization admins and owners can always perform these actions.
--   - Editors can only do so if they originally created the course.
-- Dependencies:
--   - has_org_role(org_id UUID, role TEXT, user_id UUID) RETURNS BOOLEAN
-- ====================================================================================

-- ====================================================================================
-- Function: reorder_lesson_blocks
-- ====================================================================================
-- Reorders blocks within a lesson using a JSONB array of objects {id, position}.
-- ====================================================================================
create or replace function reorder_lesson_blocks(
  p_lesson_id uuid,
  block_positions jsonb,
  p_updated_by uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  temp_offset int := 1000000;
  v_course_id uuid;
  v_org_id uuid;
  v_course_creator uuid;
begin
  -- Step 1: Validate input presence
  if block_positions is null or jsonb_array_length(block_positions) = 0 then
    raise exception 'block_positions array cannot be null or empty';
  end if;

  -- Step 2: Fetch course and org context
  select l.course_id, c.organization_id, c.created_by
  into v_course_id, v_org_id, v_course_creator
  from public.lessons l
  join public.courses c on l.course_id = c.id
  where l.id = p_lesson_id;

  if v_course_id is null then
    raise exception 'Lesson does not exist';
  end if;

  -- Step 3: Permission check
  if not (
    public.has_org_role(v_org_id, 'admin', p_updated_by) or
    v_course_creator = p_updated_by
  ) then
    raise exception 'You do not have permission to reorder blocks in this lesson';
  end if;

  -- Step 4: Validate block ownership and existence
  if exists (
    select 1 
    from jsonb_array_elements(block_positions) as bp
    left join public.lesson_blocks lb on lb.id = (bp->>'id')::uuid
    where lb.id is null or lb.lesson_id != p_lesson_id
  ) then
    raise exception 'One or more block IDs do not exist or do not belong to this lesson';
  end if;

  -- Step 5: Validate position values
  if exists (
    select 1
    from jsonb_array_elements(block_positions) as bp
    where (bp->>'position')::int <= 0
  ) then
    raise exception 'All position values must be positive integers';
  end if;

  -- Step 6: Ensure all blocks are included
  if (
    select count(*) from public.lesson_blocks where lesson_id = p_lesson_id
  ) != jsonb_array_length(block_positions) then
    raise exception 'All blocks in the lesson must be included in the reorder operation';
  end if;

  -- Step 7: Ensure unique position values
  if (
    select count(distinct (bp->>'position')::int)
    from jsonb_array_elements(block_positions) as bp
  ) != jsonb_array_length(block_positions) then
    raise exception 'Duplicate position values are not allowed';
  end if;

  -- Step 8: Temporarily offset all current positions
  update public.lesson_blocks
  set position = position + temp_offset
  where lesson_id = p_lesson_id;

  -- Step 9: Apply new positions with audit metadata
  update public.lesson_blocks
  set 
    position = new_positions.position,
    updated_at = timezone('utc', now()),
    updated_by = p_updated_by
  from (
    select 
      (bp->>'id')::uuid as id,
      row_number() over (order by (bp->>'position')::int) as position
    from jsonb_array_elements(block_positions) as bp
  ) as new_positions
  where public.lesson_blocks.id = new_positions.id
    and public.lesson_blocks.lesson_id = p_lesson_id;
end;
$$;

-- ====================================================================================
-- Function: delete_lesson_block
-- ====================================================================================
-- Deletes a lesson block and reorders remaining blocks to fill the gap.
-- ====================================================================================
create or replace function delete_lesson_block(
  p_block_id uuid,
  p_deleted_by uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lesson_id uuid;
  v_course_id uuid;
  v_org_id uuid;
  v_course_creator uuid;
  v_block_position int;
begin
  -- Step 1: Fetch lesson ID and current block position
  select lb.lesson_id, lb.position
  into v_lesson_id, v_block_position
  from public.lesson_blocks lb
  where lb.id = p_block_id;

  if v_lesson_id is null then
    raise exception 'Lesson block does not exist';
  end if;

  -- Step 2: Fetch course and org context
  select c.id, c.organization_id, c.created_by
  into v_course_id, v_org_id, v_course_creator
  from public.lessons l
  join public.courses c on l.course_id = c.id
  where l.id = v_lesson_id;

  if v_course_id is null then
    raise exception 'Associated course does not exist';
  end if;

  -- Step 3: Permission check
  if not (
    public.has_org_role(v_org_id, 'admin', p_deleted_by) or
    v_course_creator = p_deleted_by
  ) then
    raise exception 'You do not have permission to delete this block';
  end if;

  -- Step 4: Delete the block
  delete from public.lesson_blocks
  where id = p_block_id;

  if not found then
    raise exception 'Failed to delete lesson block';
  end if;

  -- Step 5: Shift down remaining block positions
  update public.lesson_blocks
  set position = position - 1000000
  where lesson_id = v_lesson_id
    and position > v_block_position;

  -- Step 6: Normalize final positions and set audit metadata
  update public.lesson_blocks
  set 
    position = position + 999999,
    updated_at = timezone('utc', now()),
    updated_by = p_deleted_by
  where lesson_id = v_lesson_id
    and position < 0;
end;
$$;
