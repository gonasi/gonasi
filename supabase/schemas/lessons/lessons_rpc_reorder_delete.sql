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
  temp_offset int := 1000000;
  v_course_id uuid;
  v_org_id uuid;
begin
  if lesson_positions is null or jsonb_array_length(lesson_positions) = 0 then
    raise exception 'lesson_positions array cannot be null or empty';
  end if;

  select c.course_id, c.organization_id
  into v_course_id, v_org_id
  from public.chapters c
  where c.id = p_chapter_id;

  if v_course_id is null then
    raise exception 'Chapter does not exist';
  end if;

  if not public.has_org_role(v_org_id, 'editor', p_updated_by) then
    raise exception 'Insufficient permissions to reorder lessons in this chapter';
  end if;

  if exists (
    select 1 
    from jsonb_array_elements(lesson_positions) as lp
    left join public.lessons l on l.id = (lp->>'id')::uuid
    where l.id is null or l.chapter_id != p_chapter_id
  ) then
    raise exception 'One or more lesson IDs do not exist or do not belong to the specified chapter';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(lesson_positions) as lp
    where (lp->>'position')::int <= 0
  ) then
    raise exception 'All position values must be positive integers';
  end if;

  if (
    select count(*)
    from public.lessons
    where chapter_id = p_chapter_id
  ) != jsonb_array_length(lesson_positions) then
    raise exception 'All lessons in the chapter must be included in the reorder operation';
  end if;

  if (
    select count(distinct (lp->>'position')::int)
    from jsonb_array_elements(lesson_positions) as lp
  ) != jsonb_array_length(lesson_positions) then
    raise exception 'Duplicate position values are not allowed';
  end if;

  update public.lessons
  set position = position + temp_offset
  where chapter_id = p_chapter_id;

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
-- Permission rules:
-- - Org owners and admins can delete any lesson in the org
-- - Editors can only delete if they are the course creator
--
-- @param p_lesson_id: UUID of the lesson to delete
-- @param p_deleted_by: UUID of user performing the deletion operation

create or replace function delete_lesson(
  p_lesson_id uuid,
  p_deleted_by uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_chapter_id uuid;
  v_course_id uuid;
  v_org_id uuid;
  v_course_created_by uuid;
  v_lesson_position int;
begin
  -- Fetch the lesson's chapter, course, and org context
  select 
    l.chapter_id, 
    l.course_id, 
    c.organization_id, 
    c.created_by,
    l.position
  into 
    v_chapter_id, 
    v_course_id, 
    v_org_id, 
    v_course_created_by,
    v_lesson_position
  from public.lessons l
  join public.courses c on c.id = l.course_id
  where l.id = p_lesson_id;

  -- Ensure the lesson exists
  if v_course_id is null then
    raise exception 'Lesson does not exist';
  end if;

  -- Check org role and ownership
  if not (
    public.has_org_role(v_org_id, 'admin', p_deleted_by) or
    public.has_org_role(v_org_id, 'owner', p_deleted_by) or
    (public.has_org_role(v_org_id, 'editor', p_deleted_by) and v_course_created_by = p_deleted_by)
  ) then
    raise exception 'Insufficient permissions to delete this lesson';
  end if;

  -- Delete the lesson
  delete from public.lessons
  where id = p_lesson_id;

  if not found then
    raise exception 'Failed to delete lesson';
  end if;

  -- Step 1: Temporarily shift down positions of remaining lessons to avoid conflicts
  update public.lessons
  set position = position - 1000000
  where chapter_id = v_chapter_id
    and position > v_lesson_position;

  -- Step 2: Normalize final positions and update audit metadata
  update public.lessons
  set 
    position = position + 999999,
    updated_at = timezone('utc', now()),
    updated_by = p_deleted_by
  where chapter_id = v_chapter_id
    and position < 0;

end;
$$;
