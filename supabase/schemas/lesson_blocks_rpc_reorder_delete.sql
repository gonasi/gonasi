-- ====================================================================================
-- Function: reorder_lesson_blocks
-- ====================================================================================
-- Reorders lesson blocks within a lesson using a JSONB array input specifying
-- block IDs and their new positions.
--
-- Implementation notes:
-- 1. Validates user permissions to modify blocks in the lesson
-- 2. Validates input presence and that all block IDs exist and belong to the lesson
-- 3. Temporarily shifts all block positions by a large offset to avoid unique constraint conflicts
-- 4. Updates each block with its new position and updates audit fields
-- 5. Ensures positions are consecutive starting from 1
--
-- @param p_lesson_id: UUID of the lesson containing blocks to reorder
-- @param block_positions: JSONB array of objects {id: uuid, position: int}
-- @param p_updated_by: UUID of user performing the reorder operation
create or replace function reorder_lesson_blocks(
  p_lesson_id uuid,
  block_positions jsonb, -- JSONB array of objects {id: uuid, position: int}
  p_updated_by uuid      -- User performing the operation
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  temp_offset int := 1000000;  -- large offset to avoid unique position conflicts during update
  v_course_id uuid;            -- to store the course_id for permission checking
begin
  -- Validate that block_positions array is not empty or null
  if block_positions is null or jsonb_array_length(block_positions) = 0 then
    raise exception 'block_positions array cannot be null or empty';
  end if;

  -- Get the course_id for the lesson to check permissions
  select l.course_id into v_course_id
  from public.lessons l
  where l.id = p_lesson_id;

  -- Check if lesson exists
  if v_course_id is null then
    raise exception 'Lesson does not exist';
  end if;

  -- Verify user has permission to modify blocks in this lesson
  if not exists (
    select 1 
    from public.courses c
    where c.id = v_course_id
      and (
        public.is_course_admin(c.id, p_updated_by) or
        public.is_course_editor(c.id, p_updated_by) or
        c.created_by = p_updated_by
      )
  ) then
    raise exception 'Insufficient permissions to reorder blocks in this lesson';
  end if;

  -- Validate that all block IDs exist and belong to the specified lesson
  if exists (
    select 1 
    from jsonb_array_elements(block_positions) as bp
    left join public.lesson_blocks lb on lb.id = (bp->>'id')::uuid
    where lb.id is null or lb.lesson_id != p_lesson_id
  ) then
    raise exception 'One or more block IDs do not exist or do not belong to the specified lesson';
  end if;

  -- Validate that position values are positive integers
  if exists (
    select 1
    from jsonb_array_elements(block_positions) as bp
    where (bp->>'position')::int <= 0
  ) then
    raise exception 'All position values must be positive integers';
  end if;

  -- Validate that we're not missing any blocks from the lesson
  if (
    select count(*)
    from public.lesson_blocks
    where lesson_id = p_lesson_id
  ) != jsonb_array_length(block_positions) then
    raise exception 'All blocks in the lesson must be included in the reorder operation';
  end if;

  -- Check for duplicate positions in the input
  if (
    select count(distinct (bp->>'position')::int)
    from jsonb_array_elements(block_positions) as bp
  ) != jsonb_array_length(block_positions) then
    raise exception 'Duplicate position values are not allowed';
  end if;

  -- Temporarily shift all block positions to avoid unique constraint conflicts
  update public.lesson_blocks
  set position = position + temp_offset
  where lesson_id = p_lesson_id;

  -- Apply new positions and update audit fields
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
-- Deletes a lesson block and automatically reorders remaining blocks to maintain
-- consecutive positions starting from 1.
--
-- Implementation notes:
-- 1. Validates user permissions to modify blocks in the lesson
-- 2. Validates that the block exists and belongs to the specified lesson
-- 3. Gets the position of the block being deleted
-- 4. Deletes the specified block
-- 5. Updates positions of all remaining blocks that were positioned after the deleted block
-- 6. Ensures positions remain consecutive starting from 1
--
-- @param p_block_id: UUID of the lesson block to delete
-- @param p_deleted_by: UUID of user performing the delete operation
create or replace function delete_lesson_block(
  p_block_id uuid,      -- ID of the block to delete
  p_deleted_by uuid     -- User performing the operation
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lesson_id uuid;        -- to store the lesson_id for the block
  v_course_id uuid;        -- to store the course_id for permission checking
  v_block_position int;    -- position of the block being deleted
begin
  -- Get the lesson_id and current position of the block to be deleted
  select lb.lesson_id, lb.position
  into v_lesson_id, v_block_position
  from public.lesson_blocks lb
  where lb.id = p_block_id;

  -- Check if block exists
  if v_lesson_id is null then
    raise exception 'Lesson block does not exist';
  end if;

  -- Get the course_id for the lesson to check permissions
  select l.course_id into v_course_id
  from public.lessons l
  where l.id = v_lesson_id;

  -- Check if lesson exists (should not happen if block exists, but safety check)
  if v_course_id is null then
    raise exception 'Associated lesson does not exist';
  end if;

  -- Verify user has permission to modify blocks in this lesson
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
    raise exception 'Insufficient permissions to delete blocks in this lesson';
  end if;

  -- Delete the specified block
  delete from public.lesson_blocks
  where id = p_block_id;

  -- Check if the delete was successful
  if not found then
    raise exception 'Failed to delete lesson block';
  end if;

  -- Reorder remaining blocks: shift down all blocks that were positioned after the deleted block
  update  public.lesson_blocks
  set position = position - 1000000
  where chapter_id = v_chapter_id
    and position > v_lesson_position;

  -- Step 2: Apply the final position update with metadata
  update  public.lesson_blocks
  set 
    position = position + 999999,
    updated_at = timezone('utc', now()),
    updated_by = p_deleted_by
  where chapter_id = v_chapter_id
    and position < 0;

end;
$$;