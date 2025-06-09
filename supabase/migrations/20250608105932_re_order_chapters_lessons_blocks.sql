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
  select l.course_id into v_course_id
  from public.lessons l
  where l.chapter_id = p_chapter_id
  limit 1;

  -- If no lessons found for this chapter, still need to validate chapter exists
  if v_course_id is null then
    -- Check if chapter exists by looking at chapters table
    -- Assuming chapters table exists with course_id reference
    select c.course_id into v_course_id
    from public.chapters c
    where c.id = p_chapter_id;
    
    if v_course_id is null then
      raise exception 'Chapter does not exist';
    end if;
  end if;

  -- Verify user has permission to modify lessons in this chapter
  if not exists (
    select 1 
    from public.courses c
    where c.id = v_course_id
      and (
        is_course_admin(c.id, p_updated_by) or
        is_course_editor(c.id, p_updated_by) or
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
  -- (Optional: Remove this check if partial reordering should be allowed)
  if (
    select count(*)
    from public.lessons
    where chapter_id = p_chapter_id
  ) != jsonb_array_length(lesson_positions) then
    raise exception 'All lessons in the chapter must be included in the reorder operation';
  end if;

  -- Temporarily shift all lesson positions to avoid unique constraint conflicts
  update public.lessons
  set position = position + temp_offset
  where chapter_id = p_chapter_id;

  -- Set lessons to their new positions (normalized to consecutive positions starting from 1)
  -- and update audit fields
  update public.lessons
  set 
    position = row_number() over (order by (lp->>'position')::int),
    updated_at = timezone('utc', now()),
    updated_by = p_updated_by
  from jsonb_array_elements(lesson_positions) as lp
  where public.lessons.id = (lp->>'id')::uuid
    and public.lessons.chapter_id = p_chapter_id;

end;
$$;

-- ====================================================================================
-- Usage Examples
-- ====================================================================================
/*
-- Example 1: Reorder lessons with consecutive positions (recommended)
select reorder_lessons(
  'chapter-uuid-here',
  '[
    {"id": "lesson-1-uuid", "position": 1},
    {"id": "lesson-2-uuid", "position": 2},
    {"id": "lesson-3-uuid", "position": 3}
  ]'::jsonb,
  'user-uuid-here'
);

-- Example 2: Reorder lessons preserving exact positions (allows gaps)
select reorder_lessons_preserve_positions(
  'chapter-uuid-here',
  '[
    {"id": "lesson-1-uuid", "position": 1},
    {"id": "lesson-2-uuid", "position": 5},
    {"id": "lesson-3-uuid", "position": 10}
  ]'::jsonb,
  'user-uuid-here'
);
*/