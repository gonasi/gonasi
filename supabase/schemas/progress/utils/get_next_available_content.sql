-- ========================================================================
-- FUNCTION: get_next_available_content
-- DESCRIPTION:
--   Given a course ID and an optional current lesson ID, this function returns
--   the next available lesson or indicates course completion.
--   - If `p_current_lesson_id` is NULL, it returns the first lesson of the course.
--   - If `p_current_lesson_id` is provided, it returns the next lesson in the same chapter,
--     or the first lesson in the next chapter, or signals course completion.
-- ACCESS CONTROL:
--   - The function uses the current authenticated user's ID but currently does not
--     personalize output based on user progress. This can be extended.
-- ========================================================================
create or replace function public.get_next_available_content(
  p_course_id uuid,
  p_current_lesson_id uuid default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid()); -- Authenticated user ID
  course_structure jsonb;                      -- Full JSON structure of the course
  result jsonb;                                -- Result object to return
  current_chapter_id uuid;
  current_lesson_position int;
  current_chapter_position int;
begin
  -- ============================================================
  -- STEP 1: Retrieve the course structure as JSON
  -- ============================================================
  select course_structure_content into course_structure
  from public.published_course_structure_content
  where id = p_course_id;

  -- Return an error if the course does not exist
  if course_structure is null then
    return jsonb_build_object('error', 'Course not found');
  end if;

  -- ============================================================
  -- STEP 2: If no current lesson is given, return the first lesson
  -- ============================================================
  if p_current_lesson_id is null then
    return jsonb_build_object(
      'type', 'lesson',
      'course_id', p_course_id,
      'chapter_id', (course_structure->'chapters'->0->>'id')::uuid,
      'lesson_id', (course_structure->'chapters'->0->'lessons'->0->>'id')::uuid,
      'is_first_lesson', true
    );
  end if;

  -- ============================================================
  -- STEP 3: Flatten the course structure into lesson positions
  --         and identify the current lesson's chapter and position
  -- ============================================================
  with lesson_positions as (
    select 
      (chapter->>'id')::uuid as chapter_id,
      (chapter->>'position')::int as chapter_position,
      (lesson->>'id')::uuid as lesson_id,
      (lesson->>'position')::int as lesson_position
    from jsonb_array_elements(course_structure->'chapters') as chapter,
        jsonb_array_elements(chapter->'lessons') as lesson
  ),

  -- Get the current lesson’s chapter and position
  current_position as (
    select chapter_id, chapter_position, lesson_position
    from lesson_positions
    where lesson_id = p_current_lesson_id
  ),

  -- Attempt to find the next lesson in the same chapter
  next_lesson_in_chapter as (
    select lp.lesson_id, lp.chapter_id
    from lesson_positions lp, current_position cp
    where lp.chapter_id = cp.chapter_id
      and lp.lesson_position = cp.lesson_position + 1
  ),

  -- Attempt to find the first lesson of the next chapter
  next_chapter as (
    select 
      (chapter->>'id')::uuid as chapter_id,
      (chapter->'lessons'->0->>'id')::uuid as first_lesson_id
    from jsonb_array_elements(course_structure->'chapters') as chapter,
         current_position cp
    where (chapter->>'position')::int = cp.chapter_position + 1
  )

  -- ============================================================
  -- STEP 4: Determine the next available content
  -- ============================================================
  select case
    -- If there is a next lesson in the same chapter, return it
    when exists (select 1 from next_lesson_in_chapter) then
      jsonb_build_object(
        'type', 'lesson',
        'course_id', p_course_id,
        'chapter_id', (select chapter_id from next_lesson_in_chapter),
        'lesson_id', (select lesson_id from next_lesson_in_chapter),
        'is_same_chapter', true
      )

    -- Otherwise, if there's a next chapter, return its first lesson
    when exists (select 1 from next_chapter) then
      jsonb_build_object(
        'type', 'lesson',
        'course_id', p_course_id,
        'chapter_id', (select chapter_id from next_chapter),
        'lesson_id', (select first_lesson_id from next_chapter),
        'is_new_chapter', true
      )

    -- Otherwise, we've reached the end of the course
    else
      jsonb_build_object(
        'type', 'course_completed',
        'course_id', p_course_id,
        'completion_status', 'all_content_completed'
      )
  end into result;

  return result;
end;
$$;
