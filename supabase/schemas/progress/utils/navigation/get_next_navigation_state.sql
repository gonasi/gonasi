-- =============================================================================
-- FUNCTION: get_next_navigation_state
-- =============================================================================
-- Description:
--   Returns the next sequential navigation targets (block, lesson, chapter)
--   based on the current position within a published course structure.
--
-- Parameters:
--   p_user_id              - UUID of the user (currently unused but kept for symmetry)
--   p_published_course_id  - UUID of the published course
--   course_structure       - JSONB object describing the ordered structure of the course
--   current_context        - Record with current chapter, lesson, block IDs and global order indexes
--
-- Returns:
--   A JSONB object containing the next block, lesson, and chapter, if any.
-- =============================================================================

create or replace function public.get_next_navigation_state(
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
  next_block record;
  next_lesson record;
  next_chapter record;
begin
  -- ===========================================================================
  -- Determine the next block (based on global sequential order of blocks)
  -- ===========================================================================
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
    into next_block
    from block_structure
    where global_order = current_context.block_global_order + 1;
  end if;


-- Determine the next lesson (based on global sequential order of lessons)
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
    into next_lesson
    from lesson_structure
    where global_order = current_context.lesson_global_order + 1;
  else
    -- If no current lesson, find next lesson after current block's lesson
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
    into next_lesson
    from lesson_structure
    where global_order > coalesce(current_context.lesson_global_order, 0);
  end if;

  -- Determine the next chapter (based on global sequential order of chapters)
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
    into next_chapter
    from chapter_structure
    where global_order = current_context.chapter_global_order + 1;
  else
    -- If no current chapter, find next chapter after current block's chapter
    with chapter_structure as (
      select
        (chapter_obj ->> 'id')::uuid as chapter_id,
        row_number() over (
          order by (chapter_obj ->> 'order_index')::int
        ) as global_order
      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj
    )
    select chapter_id
    into next_chapter
    from chapter_structure
    where global_order > coalesce(current_context.chapter_global_order, 0);
  end if;
  
  -- ===========================================================================
  -- Return a JSONB object containing the next navigable block, lesson, chapter
  -- ===========================================================================
  return jsonb_build_object(
    'block', case
      when next_block.block_id is not null then
        jsonb_build_object(
          'id', next_block.block_id,
          'lesson_id', next_block.lesson_id,
          'chapter_id', next_block.chapter_id,
          'course_id', p_published_course_id
        )
      else null
    end,
    'lesson', case
      when next_lesson.lesson_id is not null then
        jsonb_build_object(
          'id', next_lesson.lesson_id,
          'chapter_id', next_lesson.chapter_id,
          'course_id', p_published_course_id
        )
      else null
    end,
    'chapter', case
      when next_chapter.chapter_id is not null then
        jsonb_build_object(
          'id', next_chapter.chapter_id,
          'course_id', p_published_course_id
        )
      else null
    end
  );
end;
$$;
