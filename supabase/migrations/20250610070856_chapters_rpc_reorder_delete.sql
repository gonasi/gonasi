-- ====================================================================================
-- Function: reorder_chapters
-- ====================================================================================
-- Reorders chapters within a course using a JSONB array input specifying
-- chapter IDs and their new positions.
--
-- Implementation notes:
-- 1. Validates user permissions to modify chapters in the course
-- 2. Validates input presence and that all chapter IDs exist and belong to the course
-- 3. Temporarily shifts all chapter positions by a large offset to avoid unique constraint conflicts
-- 4. Updates each chapter with its new position and updates audit fields
-- 5. Ensures positions are consecutive starting from 1
--
-- @param p_course_id: UUID of the course containing chapters to reorder
-- @param chapter_positions: JSONB array of objects {id: uuid, position: int}
-- @param p_updated_by: UUID of user performing the reorder operation
create or replace function reorder_chapters(
  p_course_id uuid,
  chapter_positions jsonb, -- JSONB array of objects {id: uuid, position: int}
  p_updated_by uuid        -- User performing the operation
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  temp_offset int := 1000000;  -- large offset to avoid unique position conflicts during update
begin
  -- Validate that chapter_positions array is not empty or null
  if chapter_positions is null or jsonb_array_length(chapter_positions) = 0 then
    raise exception 'chapter_positions array cannot be null or empty';
  end if;

  -- Verify user has permission to modify chapters in this course
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
    raise exception 'Insufficient permissions to reorder chapters in this course';
  end if;

  -- Validate that all chapter IDs exist and belong to the specified course
  if exists (
    select 1 
    from jsonb_array_elements(chapter_positions) as cp
    left join public.chapters ch on ch.id = (cp->>'id')::uuid
    where ch.id is null or ch.course_id != p_course_id
  ) then
    raise exception 'One or more chapter IDs do not exist or do not belong to the specified course';
  end if;

  -- Validate that position values are positive integers
  if exists (
    select 1
    from jsonb_array_elements(chapter_positions) as cp
    where (cp->>'position')::int <= 0
  ) then
    raise exception 'All position values must be positive integers';
  end if;

  -- Validate that we're not missing any chapters from the course
  if (
    select count(*)
    from public.chapters
    where course_id = p_course_id
  ) != jsonb_array_length(chapter_positions) then
    raise exception 'All chapters in the course must be included in the reorder operation';
  end if;

  -- Check for duplicate positions in the input
  if (
    select count(distinct (cp->>'position')::int)
    from jsonb_array_elements(chapter_positions) as cp
  ) != jsonb_array_length(chapter_positions) then
    raise exception 'Duplicate position values are not allowed';
  end if;

  -- Temporarily shift all chapter positions to avoid unique constraint conflicts
  update public.chapters
  set position = position + temp_offset
  where course_id = p_course_id;

  -- Apply new positions and update audit fields
  update public.chapters
  set 
    position = new_positions.position,
    updated_at = timezone('utc', now()),
    updated_by = p_updated_by
  from (
    select 
      (cp->>'id')::uuid as id,
      row_number() over (order by (cp->>'position')::int) as position
    from jsonb_array_elements(chapter_positions) as cp
  ) as new_positions
  where public.chapters.id = new_positions.id
    and public.chapters.course_id = p_course_id;

end;
$$;



-- ====================================================================================
-- Function: delete_chapter
-- ====================================================================================
-- Deletes a chapter from a course and reorders remaining chapters to maintain
-- consecutive positioning.
--
-- Implementation notes:
-- 1. Validates chapter existence and retrieves course context
-- 2. Verifies user has appropriate permissions (admin, editor, or course owner)
-- 3. Deletes the chapter (cascade delete handles related lessons and blocks)
-- 4. Reorders remaining chapters by shifting positions down to fill the gap
-- 5. Updates audit fields for all reordered chapters
--
-- @param p_chapter_id: UUID of the chapter to delete
-- @param p_deleted_by: UUID of user performing the deletion operation
create or replace function delete_chapter(
  p_chapter_id uuid,    -- ID of the chapter to delete
  p_deleted_by uuid     -- User performing the operation
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_course_id uuid;        -- to store the course_id for permission checking
  v_chapter_position int;  -- position of the chapter being deleted
begin
  -- Get the course_id and current position of the chapter to be deleted
  select c.course_id, c.position
  into v_course_id, v_chapter_position
  from public.chapters c
  where c.id = p_chapter_id;

  -- Check if chapter exists
  if v_course_id is null then
    raise exception 'Chapter does not exist';
  end if;

  -- Verify user has permission to modify chapters in this course
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
    raise exception 'Insufficient permissions to delete chapters in this course';
  end if;

  -- Delete the specified chapter (this will cascade delete all related lessons and blocks)
  delete from public.chapters
  where id = p_chapter_id;

  -- Check if the delete was successful
  if not found then
    raise exception 'Failed to delete chapter';
  end if;

  -- Reorder remaining chapters: shift down all chapters that were positioned after the deleted chapter
  update public.chapters
  set 
    position = position - 1,
    updated_at = timezone('utc', now()),
    updated_by = p_deleted_by
  where course_id = v_course_id
    and position > v_chapter_position;

end;
$$;