-- =============================================================================
-- FUNCTION: get_previous_navigation_state
-- =============================================================================
-- Returns previous navigation targets for the current context.
-- Supports fallback at the block, lesson, and chapter level based on global order.
--
-- Parameters:
--   p_user_id             - UUID of the user
--   p_published_course_id - UUID of the published course
--   course_structure      - JSONB structure of the published course
--   current_context       - Record including resolved block, lesson, and chapter
--
-- Returns: JSONB object with optional keys:
-- {
--   block:   { id, lesson_id, chapter_id, course_id } | null,
--   lesson:  { id, chapter_id, course_id } | null,
--   chapter: { id, course_id } | null
-- }
-- =============================================================================

create or replace function public.get_previous_navigation_state(
  p_user_id uuid,
  p_published_course_id uuid,
  course_structure jsonb,
  current_context record
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  prev_block record;
  prev_lesson record;
  prev_chapter record;
begin
  -- =========================================================================
  -- STEP 1: Find the previous block (based on global order index)
  -- =========================================================================
  if current_context.block_id is not null then
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
        ) as global_order
      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
           jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj,
           jsonb_array_elements(lesson_obj -> 'blocks') as block_obj
    )
    select chapter_id, lesson_id, block_id
    into prev_block
    from block_structure
    where global_order = current_context.block_global_order - 1;
  end if;


-- Find the previous lesson (based on global order index)
  if current_context.lesson_id is not null then
    with lesson_structure as (
      select
        (chapter_obj ->> 'id')::uuid as chapter_id,
        (lesson_obj ->> 'id')::uuid as lesson_id,
        row_number() over (
          order by 
            (chapter_obj ->> 'order_index')::int,
            (lesson_obj ->> 'order_index')::int
        ) as global_order
      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
           jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj
    )
    select chapter_id, lesson_id
    into prev_lesson
    from lesson_structure
    where global_order = current_context.lesson_global_order - 1;
  else
    -- If no current lesson, find previous lesson before current block's lesson
    with lesson_structure as (
      select
        (chapter_obj ->> 'id')::uuid as chapter_id,
        (lesson_obj ->> 'id')::uuid as lesson_id,
        row_number() over (
          order by 
            (chapter_obj ->> 'order_index')::int,
            (lesson_obj ->> 'order_index')::int
        ) as global_order
      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
           jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj
    )
    select chapter_id, lesson_id
    into prev_lesson
    from lesson_structure
    where global_order < coalesce(current_context.lesson_global_order, 999999)
    order by global_order desc
    limit 1;
  end if;

  -- Find the previous chapter (based on global order index)
  if current_context.chapter_id is not null then
    with chapter_structure as (
      select
        (chapter_obj ->> 'id')::uuid as chapter_id,
        row_number() over (
          order by (chapter_obj ->> 'order_index')::int
        ) as global_order
      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj
    )
    select chapter_id
    into prev_chapter
    from chapter_structure
    where global_order = current_context.chapter_global_order - 1;
  else
    -- If no current chapter, find previous chapter before current block's chapter
    with chapter_structure as (
      select
        (chapter_obj ->> 'id')::uuid as chapter_id,
        row_number() over (
          order by (chapter_obj ->> 'order_index')::int
        ) as global_order
      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj
    )
    select chapter_id
    into prev_chapter
    from chapter_structure
    where global_order < coalesce(current_context.chapter_global_order, 999999)
    order by global_order desc
    limit 1;
  end if;

  -- =========================================================================
  -- STEP 4: Return unified JSONB result with previous navigation pointers
  -- =========================================================================
  return jsonb_build_object(
    'block', case when prev_block.block_id is not null then
      jsonb_build_object(
        'id', prev_block.block_id,
        'lesson_id', prev_block.lesson_id,
        'chapter_id', prev_block.chapter_id,
        'course_id', p_published_course_id
      )
      else null end,

    'lesson', case when prev_lesson.lesson_id is not null then
      jsonb_build_object(
        'id', prev_lesson.lesson_id,
        'chapter_id', prev_lesson.chapter_id,
        'course_id', p_published_course_id
      )
      else null end,

    'chapter', case when prev_chapter.chapter_id is not null then
      jsonb_build_object(
        'id', prev_chapter.chapter_id,
        'course_id', p_published_course_id
      )
      else null end
  );
end;
$$;
