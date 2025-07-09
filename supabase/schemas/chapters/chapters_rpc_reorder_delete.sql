-- ====================================================================================
-- SQL File: chapters_rpc_reorder_delete.sql
-- Purpose: Reorder and delete chapters with proper organization-level permissions.
-- Rules:
--   - Admins, Owners, and Org Creators can always perform the action.
--   - Editors can only do so if they originally created the course.
-- Dependencies:
--   - has_org_role(org_id UUID, role TEXT, user_id UUID) RETURNS BOOLEAN
-- ====================================================================================

-- ====================================================================================
-- Function: reorder_chapters
-- ====================================================================================
-- Reorders chapters within a course using a JSONB array input specifying
-- chapter IDs and their new positions.
--
-- Permission rules:
-- - Organization owners and admins always allowed.
-- - Editors only allowed if they are the creator of the course.
-- ====================================================================================

create or replace function reorder_chapters(
  p_course_id uuid,
  chapter_positions jsonb,
  p_updated_by uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  temp_offset int := 1000000;
  v_org_id uuid;
  v_created_by uuid;
begin
  -- Step 1: Ensure input is present
  if chapter_positions is null or jsonb_array_length(chapter_positions) = 0 then
    raise exception 'chapter_positions array cannot be null or empty';
  end if;

  -- Step 2: Get org ID and course creator
  select organization_id, created_by
  into v_org_id, v_created_by
  from public.courses
  where id = p_course_id;

  if v_org_id is null then
    raise exception 'Course does not exist';
  end if;

  -- Step 3: Permission check
  if not (
    public.has_org_role(v_org_id, 'admin', p_updated_by) or
    v_created_by = p_updated_by
  ) then
    raise exception 'You do not have permission to reorder chapters in this course';
  end if;

  -- Step 4: Validate that all chapter IDs exist and belong to the given course
  if exists (
    select 1 
    from jsonb_array_elements(chapter_positions) as cp
    left join public.chapters ch on ch.id = (cp->>'id')::uuid
    where ch.id is null or ch.course_id != p_course_id
  ) then
    raise exception 'One or more chapter IDs do not exist or do not belong to the specified course';
  end if;

  -- Step 5: Ensure all position values are positive integers
  if exists (
    select 1
    from jsonb_array_elements(chapter_positions) as cp
    where (cp->>'position')::int <= 0
  ) then
    raise exception 'All position values must be positive integers';
  end if;

  -- Step 6: Validate that all chapters in the course are included
  if (
    select count(*) from public.chapters where course_id = p_course_id
  ) != jsonb_array_length(chapter_positions) then
    raise exception 'All chapters in the course must be included in the reorder operation';
  end if;

  -- Step 7: Check for duplicate position values
  if (
    select count(distinct (cp->>'position')::int)
    from jsonb_array_elements(chapter_positions) as cp
  ) != jsonb_array_length(chapter_positions) then
    raise exception 'Duplicate position values are not allowed';
  end if;

  -- Step 8: Shift positions to avoid conflict
  update public.chapters
  set position = position + temp_offset
  where course_id = p_course_id;

  -- Step 9: Apply new positions
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
-- Deletes a chapter and reorders remaining chapters.
--
-- Permission rules:
-- - Organization owners and admins always allowed.
-- - Editors can only delete if they created the course.
-- ====================================================================================

create or replace function delete_chapter(
  p_chapter_id uuid,
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
  v_course_creator uuid;
  v_chapter_position int;
begin
  -- Step 1: Fetch chapter's course/org context and its position
  select c.course_id, cr.organization_id, cr.created_by, c.position
  into v_course_id, v_org_id, v_course_creator, v_chapter_position
  from public.chapters c
  join public.courses cr on c.course_id = cr.id
  where c.id = p_chapter_id;

  if v_course_id is null then
    raise exception 'Chapter does not exist';
  end if;

  -- Step 2: Permission check
  if not (
    public.has_org_role(v_org_id, 'admin', p_deleted_by) or
    v_course_creator = p_deleted_by
  ) then
    raise exception 'You do not have permission to delete this chapter';
  end if;

  -- Step 3: Delete the chapter
  delete from public.chapters
  where id = p_chapter_id;

  if not found then
    raise exception 'Failed to delete chapter';
  end if;

  -- Step 4: Shift positions to close gap
  update public.chapters
  set position = position - 1000000
  where course_id = v_course_id
    and position > v_chapter_position;

  update public.chapters
  set 
    position = position + 999999,
    updated_at = timezone('utc', now()),
    updated_by = p_deleted_by
  where course_id = v_course_id
    and position < 0;

end;
$$;
