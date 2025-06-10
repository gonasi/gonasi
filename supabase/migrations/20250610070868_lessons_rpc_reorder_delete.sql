-- ====================================================================================
-- Function: reorder_lessons
-- ====================================================================================
-- Reorders lessons within a chapter using a JSONB array input specifying
-- lesson IDs and their new positions.
--
-- Implementation notes:
-- 1. Validates user permissions to modify lessons in the chapter
-- 2. Validates input presence and that all lesson IDs exist and belong to the chapter
-- 3. Temporarily shifts all lesson positions by a large offset to avoid unique constraint conflicts
-- 4. Updates each lesson with its new position and updates audit fields
-- 5. Ensures positions are consecutive starting from 1
--
-- @param p_chapter_id: UUID of the chapter containing lessons to reorder
-- @param lesson_positions: JSONB array of objects {id: uuid, position: int}
-- @param p_updated_by: UUID of user performing the reorder operation
create or replace function reorder_lessons(
  p_chapter_id uuid,
  lesson_positions jsonb, -- JSONB array of objects {id: uuid, position: int}
  p_updated_by uuid       -- User performing the operation
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
  -- Validate that lesson_positions array is not empty or null
  if lesson_positions is null or jsonb_array_length(lesson_positions) = 0 then
    raise exception 'lesson_positions array cannot be null or empty';
  end if;

  -- Get the course_id for the chapter to check permissions
  select c.course_id into v_course_id
  from public.chapters c
  where c.id = p_chapter_id;

  -- Check if chapter exists
  if v_course_id is null then
    raise exception 'Chapter does not exist';
  end if;

  -- Verify user has permission to modify lessons in this chapter
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
    raise exception 'Insufficient permissions to reorder lessons in this chapter';
  end if;

  -- Validate that all lesson IDs exist and belong to the specified chapter
  if exists (
    select 1 
    from jsonb_array_elements(lesson_positions) as lp
    left join public.lessons l on l.id = (lp->>'id')::uuid
    where l.id is null or l.chapter_id != p_chapter_id
  ) then
    raise exception 'One or more lesson IDs do not exist or do not belong to the specified chapter';
  end if;

  -- Validate that position values are positive integers
  if exists (
    select 1
    from jsonb_array_elements(lesson_positions) as lp
    where (lp->>'position')::int <= 0
  ) then
    raise exception 'All position values must be positive integers';
  end if;

  -- Validate that we're not missing any lessons from the chapter
  if (
    select count(*)
    from public.lessons
    where chapter_id = p_chapter_id
  ) != jsonb_array_length(lesson_positions) then
    raise exception 'All lessons in the chapter must be included in the reorder operation';
  end if;

  -- Check for duplicate positions in the input
  if (
    select count(distinct (lp->>'position')::int)
    from jsonb_array_elements(lesson_positions) as lp
  ) != jsonb_array_length(lesson_positions) then
    raise exception 'Duplicate position values are not allowed';
  end if;

  -- Temporarily shift all lesson positions to avoid unique constraint conflicts
  update public.lessons
  set position = position + temp_offset
  where chapter_id = p_chapter_id;

  -- Apply new positions and update audit fields
  update public.lessons
  set 
    position = new_positions.position,
    updated_at = timezone('utc', now()),
    updated_by = p_updated_by
  from (
    select 
      (lp->>'id')::uuid as id,
      row_number() over (order by (lp->>'position')::int) as position
    from jsonb_array_elements(lesson_positions) as lp
  ) as new_positions
  where public.lessons.id = new_positions.id
    and public.lessons.chapter_id = p_chapter_id;

end;
$$;

-- ====================================================================================
-- Function: delete_lesson
-- ====================================================================================
-- Deletes a lesson from a chapter and reorders remaining lessons to maintain
-- consecutive positioning within the chapter.
--
-- Implementation notes:
-- 1. Validates lesson exists and retrieves chapter/course context for permissions
-- 2. Verifies user has appropriate permissions (admin, editor, or course owner)
-- 3. Deletes the lesson (cascade delete handles related lesson blocks)
-- 4. Reorders remaining lessons within the chapter by shifting positions down
-- 5. Updates audit fields for all reordered lessons
--
-- @param p_lesson_id: UUID of the lesson to delete
-- @param p_deleted_by: UUID of user performing the deletion operation

create or replace function delete_lesson(
  p_lesson_id uuid,     -- ID of the lesson to delete
  p_deleted_by uuid     -- User performing the operation
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_course_id uuid;        -- to store the course_id for permission checking
  v_chapter_id uuid;       -- to store the chapter_id for lesson reordering
  v_lesson_position int;   -- position of the lesson being deleted
begin
  -- Get the course_id, chapter_id, and current position of the lesson to be deleted
  select l.course_id, l.chapter_id, l.position
  into v_course_id, v_chapter_id, v_lesson_position
  from public.lessons l
  where l.id = p_lesson_id;

  -- Check if lesson exists
  if v_course_id is null then
    raise exception 'Lesson does not exist';
  end if;

  -- Verify user has permission to modify lessons in this course
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
    raise exception 'Insufficient permissions to delete lessons in this course';
  end if;

  -- Delete the specified lesson (this will cascade delete all related lesson blocks)
  delete from public.lessons
  where id = p_lesson_id;

  -- Check if the delete was successful
  if not found then
    raise exception 'Failed to delete lesson';
  end if;

  -- Reorder remaining lessons: shift down all lessons that were positioned after the deleted lesson within the same chapter
  update public.lessons
  set 
    position = position - 1,
    updated_at = timezone('utc', now()),
    updated_by = p_deleted_by
  where chapter_id = v_chapter_id
    and position > v_lesson_position;

end;
$$;