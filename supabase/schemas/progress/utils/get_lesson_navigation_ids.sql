-- ================================================================================
-- function: get_lesson_navigation_ids
-- purpose: returns navigation ids for lesson-level navigation including:
--          - previous lesson (if exists)
--          - next lesson (if exists) 
--          - continue course (next incomplete lesson if current is complete)
--          - current lesson completion status
--
-- inputs:
--   p_user_id             - the authenticated user id (uuid)
--   p_published_course_id - the published course id (uuid)
--   p_current_lesson_id   - the current lesson id (uuid)
--
-- returns:
--   jsonb object with the following structure:
--     {
--       current_lesson: {
--         lesson_id: uuid,
--         chapter_id: uuid,
--         is_complete: boolean,
--         progress_percentage: numeric
--       },
--       previous_lesson: {
--         lesson_id: uuid | null,
--         chapter_id: uuid | null,
--         course_id: uuid
--       } | null,
--       next_lesson: {
--         lesson_id: uuid | null,
--         chapter_id: uuid | null,
--         course_id: uuid
--       } | null,
--       continue_course: {
--         lesson_id: uuid | null,
--         chapter_id: uuid | null,
--         course_id: uuid,
--         is_different_from_next: boolean
--       } | null,
--       course_info: {
--         course_id: uuid,
--         total_lessons: integer,
--         completed_lessons: integer,
--         is_course_complete: boolean
--       }
--     }
-- ================================================================================
create or replace function public.get_lesson_navigation_ids(
  p_user_id uuid,
  p_published_course_id uuid,
  p_current_lesson_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  course_structure jsonb;
  current_lesson_info record;
  previous_lesson_info record;
  next_lesson_info record;
  continue_lesson_info record;
  course_stats record;
  result jsonb;
begin
  -- =========================================================================
  -- step 1: get the course structure
  -- =========================================================================
  select course_structure_content 
  into course_structure
  from public.published_course_structure_content 
  where id = p_published_course_id;

  -- return error if course structure not found
  if course_structure is null then
    return jsonb_build_object('error', 'course structure not found');
  end if;

  -- =========================================================================
  -- step 2: get current lesson info and completion status
  -- =========================================================================
  with lesson_structure as (
    select 
      (chapter_obj ->> 'id')::uuid as chapter_id,
      (lesson_obj ->> 'id')::uuid as lesson_id,
      (chapter_obj ->> 'order_index')::integer as chapter_order,
      (lesson_obj ->> 'order_index')::integer as lesson_order,
      row_number() over (
        order by 
          (chapter_obj ->> 'order_index')::integer,
          (lesson_obj ->> 'order_index')::integer
      ) as global_order
    from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
        jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj
  )
  select 
    ls.chapter_id,
    ls.lesson_id,
    ls.global_order,
    coalesce(lp.completed_at is not null, false) as is_complete,
    coalesce(lp.progress_percentage, 0) as progress_percentage
  into current_lesson_info
  from lesson_structure ls
  left join public.lesson_progress lp on (
    lp.user_id = p_user_id
    and lp.published_course_id = p_published_course_id
    and lp.lesson_id = ls.lesson_id
  )
  where ls.lesson_id = p_current_lesson_id;

  -- return error if current lesson not found
  if current_lesson_info is null then
    return jsonb_build_object('error', 'current lesson not found in course structure');
  end if;

  -- =========================================================================
  -- step 3: get previous lesson (lesson with global_order = current - 1)
  -- =========================================================================
  with lesson_structure as (
    select 
      (chapter_obj ->> 'id')::uuid as chapter_id,
      (lesson_obj ->> 'id')::uuid as lesson_id,
      row_number() over (
        order by 
          (chapter_obj ->> 'order_index')::integer,
          (lesson_obj ->> 'order_index')::integer
      ) as global_order
    from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
        jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj
  )
  select 
    ls.chapter_id,
    ls.lesson_id
  into previous_lesson_info
  from lesson_structure ls
  where ls.global_order = current_lesson_info.global_order - 1;

  -- =========================================================================
  -- step 4: get next lesson (next incomplete lesson, not just sequential)
  -- =========================================================================
  with lesson_structure as (
    select 
      (chapter_obj ->> 'id')::uuid as chapter_id,
      (lesson_obj ->> 'id')::uuid as lesson_id,
      row_number() over (
        order by 
          (chapter_obj ->> 'order_index')::integer,
          (lesson_obj ->> 'order_index')::integer
      ) as global_order
    from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
        jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj
  )
  select 
    ls.chapter_id,
    ls.lesson_id
  into next_lesson_info
  from lesson_structure ls
  left join public.lesson_progress lp on (
    lp.user_id = p_user_id
    and lp.published_course_id = p_published_course_id
    and lp.lesson_id = ls.lesson_id
  )
  where ls.global_order > current_lesson_info.global_order
    and (lp.completed_at is null or lp.id is null)
  order by ls.global_order
  limit 1;

  -- =========================================================================
  -- step 5: get continue course lesson (next incomplete lesson)
  -- this is the same as next_lesson for smart navigation
  -- =========================================================================
  continue_lesson_info := next_lesson_info;

  -- =========================================================================
  -- step 6: get course completion statistics
  -- =========================================================================
  with all_lessons as (
    select 
      (lesson_obj ->> 'id')::uuid as lesson_id
    from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
        jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj
  ),
  completed_lessons as (
    select count(*) as count
    from all_lessons al
    inner join public.lesson_progress lp on (
      lp.user_id = p_user_id
      and lp.published_course_id = p_published_course_id
      and lp.lesson_id = al.lesson_id
      and lp.completed_at is not null
    )
  ),
  total_lessons as (
    select count(*) as count
    from all_lessons
  )
  select 
    tl.count as total_lessons,
    cl.count as completed_lessons,
    (cl.count = tl.count and tl.count > 0) as is_course_complete
  into course_stats
  from total_lessons tl, completed_lessons cl;

  -- =========================================================================
  -- step 7: build and return the result
  -- =========================================================================
  result := jsonb_build_object(
    'current_lesson', jsonb_build_object(
      'lesson_id', current_lesson_info.lesson_id,
      'chapter_id', current_lesson_info.chapter_id,
      'course_id', p_published_course_id,
      'is_complete', current_lesson_info.is_complete,
      'progress_percentage', current_lesson_info.progress_percentage
    ),
    'previous_lesson', case 
      when previous_lesson_info.lesson_id is not null then
        jsonb_build_object(
          'lesson_id', previous_lesson_info.lesson_id,
          'chapter_id', previous_lesson_info.chapter_id,
          'course_id', p_published_course_id
        )
      else null
    end,
    'next_lesson', case 
      when next_lesson_info.lesson_id is not null then
        jsonb_build_object(
          'lesson_id', next_lesson_info.lesson_id,
          'chapter_id', next_lesson_info.chapter_id,
          'course_id', p_published_course_id
        )
      else null
    end,
    'continue_course', case 
      when continue_lesson_info.lesson_id is not null then
        jsonb_build_object(
          'lesson_id', continue_lesson_info.lesson_id,
          'chapter_id', continue_lesson_info.chapter_id,
          'course_id', p_published_course_id,
          'is_different_from_next', (
            continue_lesson_info.lesson_id != coalesce(next_lesson_info.lesson_id, continue_lesson_info.lesson_id)
          )
        )
      else null
    end,
    'course_info', jsonb_build_object(
      'course_id', p_published_course_id,
      'total_lessons', course_stats.total_lessons,
      'completed_lessons', course_stats.completed_lessons,
      'is_course_complete', course_stats.is_course_complete
    )
  );

  return result;
end;
$$;