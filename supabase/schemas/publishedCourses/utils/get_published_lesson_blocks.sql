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
create or replace function public.get_published_lesson_blocks(
  p_course_id uuid,
  p_chapter_id uuid,
  p_lesson_id uuid
)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    -- Basic lesson metadata
    'id', l->>'id',
    'name', l->>'name',
    'position', (l->>'position')::int,
    'course_id', l->>'course_id',
    'chapter_id', l->>'chapter_id',
    'lesson_type_id', l->>'lesson_type_id',

    -- Additional lesson settings and type metadata
    'settings', l->'settings',
    'lesson_types', l->'lesson_types',
    'total_blocks', (l->>'total_blocks')::int,

    -- The full list of content blocks within the lesson
    'blocks', l->'blocks'
  )
  from public.published_courses,

  -- LATERAL join: extract the matching lesson from course_structure_content
  lateral (
    select l
    from
      -- Unnest chapters from the course content structure
      jsonb_array_elements(course_structure_content->'chapters') as c

      -- Unnest lessons from within each chapter
      join lateral jsonb_array_elements(c->'lessons') as l
        on (c->>'id')::uuid = p_chapter_id  -- Filter to the requested chapter
    where
      (l->>'id')::uuid = p_lesson_id        -- Filter to the requested lesson
  ) as result

  -- Restrict to the specified published course
  where id = p_course_id
$$;
