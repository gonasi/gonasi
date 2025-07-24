-- =============================================================================
-- FUNCTION: get_continue_navigation_state (CONTEXT-AWARE)
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
  -- Context: BLOCK LEVEL
  if current_context.block_id is not null then
    -- Next incomplete block
    select
      bs.chapter_id, bs.lesson_id, bs.block_id
    into continue_block
    from (
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
    ) bs
    left join public.block_progress bp on (
      bp.user_id = p_user_id
      and bp.published_course_id = p_published_course_id
      and bp.block_id = bs.block_id
      and bp.is_completed = true
    )
    where bs.global_order > coalesce(current_context.block_global_order, 0)
      and bp.id is null
    order by bs.global_order
    limit 1;

    -- Next incomplete lesson
    select
      ls.chapter_id, ls.lesson_id
    into continue_lesson
    from (
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
    ) ls
    left join public.lesson_progress lp on (
      lp.user_id = p_user_id
      and lp.published_course_id = p_published_course_id
      and lp.lesson_id = ls.lesson_id
      and lp.completed_at is not null
    )
    where ls.global_order > coalesce(current_context.lesson_global_order, 0)
      and lp.id is null
    order by ls.global_order
    limit 1;

    -- Next incomplete chapter
    select
      cs.chapter_id
    into continue_chapter
    from (
      select
        (chapter_obj ->> 'id')::uuid as chapter_id,
        row_number() over (
          order by (chapter_obj ->> 'order_index')::int
        ) as global_order
      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj
    ) cs
    left join public.chapter_progress cp on (
      cp.user_id = p_user_id
      and cp.published_course_id = p_published_course_id
      and cp.chapter_id = cs.chapter_id
      and cp.completed_at is not null
    )
    where cs.global_order > coalesce(current_context.chapter_global_order, 0)
      and cp.id is null
    order by cs.global_order
    limit 1;

    return jsonb_build_object(
      'block', case when continue_block.block_id is not null then
        jsonb_build_object(
          'id', continue_block.block_id,
          'lesson_id', continue_block.lesson_id,
          'chapter_id', continue_block.chapter_id,
          'course_id', p_published_course_id
        ) else null end,
      'lesson', case when continue_lesson.lesson_id is not null then
        jsonb_build_object(
          'id', continue_lesson.lesson_id,
          'chapter_id', continue_lesson.chapter_id,
          'course_id', p_published_course_id
        ) else null end,
      'chapter', case when continue_chapter.chapter_id is not null then
        jsonb_build_object(
          'id', continue_chapter.chapter_id,
          'course_id', p_published_course_id
        ) else null end
    );

  -- Context: LESSON LEVEL
  elsif current_context.lesson_id is not null then
    -- Next incomplete lesson
    select
      ls.chapter_id, ls.lesson_id
    into continue_lesson
    from (
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
    ) ls
    left join public.lesson_progress lp on (
      lp.user_id = p_user_id
      and lp.published_course_id = p_published_course_id
      and lp.lesson_id = ls.lesson_id
      and lp.completed_at is not null
    )
    where ls.global_order > coalesce(current_context.lesson_global_order, 0)
      and lp.id is null
    order by ls.global_order
    limit 1;

    -- Next incomplete chapter
    select
      cs.chapter_id
    into continue_chapter
    from (
      select
        (chapter_obj ->> 'id')::uuid as chapter_id,
        row_number() over (
          order by (chapter_obj ->> 'order_index')::int
        ) as global_order
      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj
    ) cs
    left join public.chapter_progress cp on (
      cp.user_id = p_user_id
      and cp.published_course_id = p_published_course_id
      and cp.chapter_id = cs.chapter_id
      and cp.completed_at is not null
    )
    where cs.global_order > coalesce(current_context.chapter_global_order, 0)
      and cp.id is null
    order by cs.global_order
    limit 1;

    return jsonb_build_object(
      'block', null,
      'lesson', case when continue_lesson.lesson_id is not null then
        jsonb_build_object(
          'id', continue_lesson.lesson_id,
          'chapter_id', continue_lesson.chapter_id,
          'course_id', p_published_course_id
        ) else null end,
      'chapter', case when continue_chapter.chapter_id is not null then
        jsonb_build_object(
          'id', continue_chapter.chapter_id,
          'course_id', p_published_course_id
        ) else null end
    );

  -- Context: CHAPTER LEVEL
  elsif current_context.chapter_id is not null then
    -- Next incomplete chapter
    select
      cs.chapter_id
    into continue_chapter
    from (
      select
        (chapter_obj ->> 'id')::uuid as chapter_id,
        row_number() over (
          order by (chapter_obj ->> 'order_index')::int
        ) as global_order
      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj
    ) cs
    left join public.chapter_progress cp on (
      cp.user_id = p_user_id
      and cp.published_course_id = p_published_course_id
      and cp.chapter_id = cs.chapter_id
      and cp.completed_at is not null
    )
    where cs.global_order > coalesce(current_context.chapter_global_order, 0)
      and cp.id is null
    order by cs.global_order
    limit 1;

    return jsonb_build_object(
      'block', null,
      'lesson', null,
      'chapter', case when continue_chapter.chapter_id is not null then
        jsonb_build_object(
          'id', continue_chapter.chapter_id,
          'course_id', p_published_course_id
        ) else null end
    );
  end if;

  -- Fallback (should not reach here)
  return jsonb_build_object('block', null, 'lesson', null, 'chapter', null);
end;
$$;
