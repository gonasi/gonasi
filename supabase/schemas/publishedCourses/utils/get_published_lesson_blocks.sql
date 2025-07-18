-- ====================================================================================
-- FUNCTION: public.get_published_lesson_blocks
--
-- PURPOSE:
--   Securely retrieves a specific lesson (and all its nested blocks and metadata)
--   from the `course_structure_content` JSONB column of the `published_course_structure_content` table.
--   Used primarily to render a full lesson view in the learner interface.
--
-- SECURITY:
--   - SECURITY INVOKER: Checks the caller's permissions.
--   - Enforces column-level access via `has_column_privilege` to prevent unauthorized
--     users (including anonymous or partially privileged accounts) from accessing deep
--     course content.
--
-- PARAMETERS:
--   - p_course_id   UUID  : The ID of the published course.
--   - p_chapter_id  UUID  : The ID of the chapter containing the lesson.
--   - p_lesson_id   UUID  : The ID of the specific lesson to retrieve.
--
-- RETURNS:
--   A `jsonb` object representing the selected lesson with its metadata and associated blocks.
--
-- SAMPLE RETURN STRUCTURE:
-- {
--   "id": "...",
--   "name": "...",
--   "position": 1,
--   "course_id": "...",
--   "chapter_id": "...",
--   "lesson_type_id": "...",
--   "settings": { ... },
--   "lesson_types": [ ... ],
--   "total_blocks": 3,
--   "blocks": [ ... ]
-- }
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
  if not has_column_privilege('public.published_course_structure_content', 'course_structure_content', 'SELECT') then
    raise exception 'Access denied to course content';
  end if;

  -- Fetch and return the lesson + blocks from the correct table
  select jsonb_build_object(
    'id', l->>'id',
    'name', l->>'name',
    'position', (l->>'position')::int,
    'course_id', l->>'course_id',
    'chapter_id', l->>'chapter_id',
    'lesson_type_id', l->>'lesson_type_id',
    'settings', l->'settings',
    'lesson_types', l->'lesson_types',
    'total_blocks', jsonb_array_length(l->'blocks'),
    'blocks', l->'blocks'
  )
  into result
  from public.published_course_structure_content pcs,
  lateral (
    select l
    from
      jsonb_array_elements(pcs.course_structure_content->'chapters') as c
      join lateral jsonb_array_elements(c->'lessons') as l
        on (c->>'id')::uuid = p_chapter_id
    where
      (l->>'id')::uuid = p_lesson_id
  ) as result
  where pcs.id = p_course_id;

  return result;
end;
$$;
