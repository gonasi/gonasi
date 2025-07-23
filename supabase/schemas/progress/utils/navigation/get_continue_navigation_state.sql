-- =============================================================================
-- FUNCTION: get_continue_navigation_state
-- =============================================================================
-- Description:
--   Returns the "smart" continue navigation targets: the next incomplete block,
--   lesson, and chapter, in that order of priority. Skips completed content.
--
-- Parameters:
--   p_user_id              - UUID of the user
--   p_published_course_id  - UUID of the published course
--   course_structure       - JSONB structure of the published course
--   current_context        - Record with current IDs and global order indexes
--
-- Returns:
--   A JSONB object containing the next incomplete block, lesson, or chapter,
--   or nulls if everything has been completed.
-- =============================================================================

create or replace function public.get_continue_navigation_state(
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
  continue_block record;
  continue_lesson record;
  continue_chapter record;
begin
  -- ===========================================================================
  -- Get the next incomplete block (after current block global order)
  -- ===========================================================================
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
  select bs.chapter_id, bs.lesson_id, bs.block_id
  into continue_block
  from block_structure bs
  left join public.block_progress bp on (
    bp.user_id = p_user_id
    and bp.published_course_id = p_published_course_id
    and bp.block_id = bs.block_id
  )
  where bs.global_order > coalesce(current_context.block_global_order, 0)
    and (bp.is_completed is false or bp.id is null)
  order by bs.global_order
  limit 1;

  -- Get the next incomplete lesson (after current lesson global order)
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
    select ls.chapter_id, ls.lesson_id
    into continue_lesson
    from lesson_structure ls
    left join public.lesson_progress lp on (
      lp.user_id = p_user_id
      and lp.published_course_id = p_published_course_id
      and lp.lesson_id = ls.lesson_id
    )
    where ls.global_order > coalesce(current_context.lesson_global_order, 0)
      and (lp.completed_at is null)
    order by ls.global_order
    limit 1;

    -- Get the next incomplete chapter (after current chapter global order)
    with chapter_structure as (
      select
        (chapter_obj ->> 'id')::uuid as chapter_id,
        row_number() over (
          order by (chapter_obj ->> 'order_index')::int
        ) as global_order
      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj
    )
    select cs.chapter_id
    into continue_chapter
    from chapter_structure cs
    left join public.chapter_progress cp on (
      cp.user_id = p_user_id
      and cp.published_course_id = p_published_course_id
      and cp.chapter_id = cs.chapter_id
    )
    where cs.global_order > coalesce(current_context.chapter_global_order, 0)
      and (cp.completed_at is null)
    order by cs.global_order
    limit 1;

  -- ===========================================================================
  -- Build the return JSONB object with next incomplete targets
  -- ===========================================================================
  return jsonb_build_object(
    'block', case
      when continue_block.block_id is not null then
        jsonb_build_object(
          'id', continue_block.block_id,
          'lesson_id', continue_block.lesson_id,
          'chapter_id', continue_block.chapter_id,
          'course_id', p_published_course_id
        )
      else null
    end,
    'lesson', case
      when continue_lesson.lesson_id is not null then
        jsonb_build_object(
          'id', continue_lesson.lesson_id,
          'chapter_id', continue_lesson.chapter_id,
          'course_id', p_published_course_id
        )
      else null
    end,
    'chapter', case
      when continue_chapter.chapter_id is not null then
        jsonb_build_object(
          'id', continue_chapter.chapter_id,
          'course_id', p_published_course_id
        )
      else null
    end
  );
end;
$$;
