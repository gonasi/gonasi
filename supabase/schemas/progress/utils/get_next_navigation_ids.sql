-- ============================================================================
-- function: get_next_navigation_ids
-- ============================================================================
-- description:
--   smart navigation function to determine the next block, lesson, and chapter
--   after a user completes a block. it skips already completed items to find
--   the next incomplete one.
--
-- parameters:
--   p_user_id              uuid  - the id of the user
--   p_published_course_id  uuid  - the id of the published course
--   p_current_block_id     uuid  - the id of the completed block
--
-- returns:
--   jsonb object with the following structure:
--     {
--       next_block_id,
--       next_lesson_id,
--       next_chapter_id,
--       current_context: {
--         block_id,
--         lesson_id,
--         chapter_id
--       },
--       completion_status: {
--         is_course_complete,
--         is_lesson_complete,
--         is_chapter_complete
--       }
--     }
-- ============================================================================

create or replace function public.get_next_navigation_ids(
  p_user_id uuid,
  p_published_course_id uuid,
  p_current_block_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  course_structure jsonb;
  current_block_info record;
  next_block_info record;
  next_lesson_info record;
  completion_status record;
  result jsonb;
begin
  -- =========================================================================
  -- step 1: fetch course structure
  -- =========================================================================
  select course_structure_content
  into course_structure
  from public.published_course_structure_content
  where id = p_published_course_id;

  if course_structure is null then
    return jsonb_build_object('error', 'course structure not found');
  end if;

  -- =========================================================================
  -- step 2: locate current block in structure
  -- =========================================================================
  with block_structure as (
    select
      (chapter_obj ->> 'id')::uuid as chapter_id,
      (lesson_obj ->> 'id')::uuid as lesson_id,
      (block_obj ->> 'id')::uuid as block_id,
      (chapter_obj ->> 'order_index')::int as chapter_order,
      (lesson_obj ->> 'order_index')::int as lesson_order,
      (block_obj ->> 'order_index')::int as block_order,
      row_number() over (
        order by
          (chapter_obj ->> 'order_index')::int,
          (lesson_obj ->> 'order_index')::int,
          (block_obj ->> 'order_index')::int
      ) as global_block_order
    from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
          jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj,
          jsonb_array_elements(lesson_obj -> 'blocks') as block_obj
  )
  select
    chapter_id,
    lesson_id,
    block_id,
    global_block_order
  into current_block_info
  from block_structure
  where block_id = p_current_block_id;

  if current_block_info is null then
    return jsonb_build_object('error', 'current block not found in course structure');
  end if;

  -- =========================================================================
  -- step 3: find next incomplete block
  -- =========================================================================
  with block_structure as (
    select
      (chapter_obj ->> 'id')::uuid as chapter_id,
      (lesson_obj ->> 'id')::uuid as lesson_id,
      (block_obj ->> 'id')::uuid as block_id,
      row_number() over (
        order by
          (chapter_obj ->> 'order_index')::int,
          (lesson_obj ->> 'order_index')::int,
          (block_obj ->> 'order_index')::int
      ) as global_block_order
    from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
          jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj,
          jsonb_array_elements(lesson_obj -> 'blocks') as block_obj
  )
  select
    bs.chapter_id,
    bs.lesson_id,
    bs.block_id
  into next_block_info
  from block_structure bs
  left join public.block_progress bp on (
    bp.user_id = p_user_id
    and bp.published_course_id = p_published_course_id
    and bp.block_id = bs.block_id
  )
  where bs.global_block_order > current_block_info.global_block_order
    and (bp.is_completed is false or bp.id is null)
  order by bs.global_block_order
  limit 1;

  -- =========================================================================
  -- step 4: find next incomplete lesson
  -- =========================================================================
  with lesson_structure as (
    select
      (chapter_obj ->> 'id')::uuid as chapter_id,
      (lesson_obj ->> 'id')::uuid as lesson_id,
      row_number() over (
        order by
          (chapter_obj ->> 'order_index')::int,
          (lesson_obj ->> 'order_index')::int
      ) as global_lesson_order
    from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
          jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj
  ),
  current_lesson_order as (
    select global_lesson_order
    from lesson_structure
    where lesson_id = current_block_info.lesson_id
  )
  select
    ls.chapter_id,
    ls.lesson_id
  into next_lesson_info
  from lesson_structure ls
  cross join current_lesson_order clo
  left join public.lesson_progress lp on (
    lp.user_id = p_user_id
    and lp.published_course_id = p_published_course_id
    and lp.lesson_id = ls.lesson_id
  )
  where ls.global_lesson_order > clo.global_lesson_order
    and (lp.completed_at is null or lp.id is null)
  order by ls.global_lesson_order
  limit 1;

  -- =========================================================================
  -- step 5: determine completion status (lesson, chapter, course)
  -- =========================================================================
  with all_blocks as (
    select (block_obj ->> 'id')::uuid as block_id
    from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
          jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj,
          jsonb_array_elements(lesson_obj -> 'blocks') as block_obj
  ),
  all_lessons as (
    select (lesson_obj ->> 'id')::uuid as lesson_id
    from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
          jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj
  ),
  lesson_blocks as (
    select (block_obj ->> 'id')::uuid as block_id
    from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
          jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj,
          jsonb_array_elements(lesson_obj -> 'blocks') as block_obj
    where (lesson_obj ->> 'id')::uuid = current_block_info.lesson_id
  ),
  chapter_lessons as (
    select (lesson_obj ->> 'id')::uuid as lesson_id
    from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
          jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj
    where (chapter_obj ->> 'id')::uuid = current_block_info.chapter_id
  )
  select
    -- check if user completed all course blocks
    (select count(*) from all_blocks) =
    (select count(*) from all_blocks ab
      join public.block_progress bp on bp.block_id = ab.block_id
      where bp.user_id = p_user_id
        and bp.published_course_id = p_published_course_id
        and bp.is_completed = true) as is_course_complete,

    -- check if all blocks in lesson are complete
    (select count(*) from lesson_blocks) =
    (select count(*) from lesson_blocks lb
      join public.block_progress bp on bp.block_id = lb.block_id
      where bp.user_id = p_user_id
        and bp.published_course_id = p_published_course_id
        and bp.is_completed = true) as is_lesson_complete,

    -- check if all lessons in chapter are complete
    (select count(*) from chapter_lessons) =
    (select count(*) from chapter_lessons cl
      join public.lesson_progress lp on lp.lesson_id = cl.lesson_id
      where lp.user_id = p_user_id
        and lp.published_course_id = p_published_course_id
        and lp.completed_at is not null) as is_chapter_complete
  into completion_status;

  -- =========================================================================
  -- step 6: return final result
  -- =========================================================================
  return jsonb_build_object(
    'next_block_id', next_block_info.block_id,
    'next_lesson_id', next_lesson_info.lesson_id,
    'next_chapter_id', next_lesson_info.chapter_id,
    'current_context', jsonb_build_object(
      'block_id', current_block_info.block_id,
      'lesson_id', current_block_info.lesson_id,
      'chapter_id', current_block_info.chapter_id
    ),
    'completion_status', jsonb_build_object(
      'is_course_complete', completion_status.is_course_complete,
      'is_lesson_complete', completion_status.is_lesson_complete,
      'is_chapter_complete', completion_status.is_chapter_complete
    )
  );
end;
$$;
