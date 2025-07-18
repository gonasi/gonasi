-- ====================================================================================
-- FUNCTION: get_published_lesson_blocks
-- DESCRIPTION:
--   Returns a specific lesson (with all its nested blocks and metadata)
--   from the course_structure_content JSONB field in the published_courses table.
--   This is useful for rendering the full lesson view in the learner interface.
--
-- PARAMETERS:
--   - p_course_id   : UUID of the published course
--   - p_chapter_id  : UUID of the chapter within the course
--   - p_lesson_id   : UUID of the specific lesson to fetch
--
-- RETURNS:
--   A JSONB object representing the matched lesson with its blocks.
-- ====================================================================================
-- ====================================================================================
-- FUNCTION: public.get_published_lesson_blocks
-- DESCRIPTION: Returns structured lesson data from a published course.
--              Includes blocks only if the caller has access to course_structure_content.
--              Prevents anon or unauthorized users from reading deep course content.
-- ====================================================================================

create or replace function public.get_published_lesson_blocks(
  p_course_id uuid,
  p_chapter_id uuid,
  p_lesson_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  result jsonb;
begin
  -- Deny if caller lacks explicit column-level access
  if not has_column_privilege('public.published_courses', 'course_structure_content', 'SELECT') then
    raise exception 'Access denied to course content';
  end if;

  -- Fetch and return the lesson + blocks
  select jsonb_build_object(
    'id', l->>'id',
    'name', l->>'name',
    'position', (l->>'position')::int,
    'course_id', l->>'course_id',
    'chapter_id', l->>'chapter_id',
    'lesson_type_id', l->>'lesson_type_id',
    'settings', l->'settings',
    'lesson_types', l->'lesson_types',
    'total_blocks', (l->>'total_blocks')::int,
    'blocks', l->'blocks'
  )
  into result
  from public.published_courses,
  lateral (
    select l
    from
      jsonb_array_elements(course_structure_content->'chapters') as c
      join lateral jsonb_array_elements(c->'lessons') as l
        on (c->>'id')::uuid = p_chapter_id
    where
      (l->>'id')::uuid = p_lesson_id
  ) as result
  where id = p_course_id;

  return result;
end;
$$;
