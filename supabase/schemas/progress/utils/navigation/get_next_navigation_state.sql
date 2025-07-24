-- =============================================================================
-- FUNCTION: get_next_navigation_state (CONTEXT-AWARE, FIXED CHAPTER ORDER)
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
  current_chapter_order integer;
begin
  -- Robustly get the current chapter's global order for reference
  with chapter_orders as (
    select
      (chapter_obj ->> 'id')::uuid as chapter_id,
      row_number() over (order by (chapter_obj ->> 'order_index')::int) as chapter_order
    from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj
  )
  select chapter_order
  into current_chapter_order
  from chapter_orders
  where chapter_id = current_context.chapter_id;

  -- Context: BLOCK LEVEL
  if current_context.block_id is not null then
    -- Next block
    select
      bs.chapter_id, bs.lesson_id, bs.block_id
    into next_block
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
    where bs.global_order = current_context.block_global_order + 1;

    -- Next lesson
    select
      ls.chapter_id, ls.lesson_id
    into next_lesson
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
    where ls.global_order = current_context.lesson_global_order + 1;

    -- Next chapter
    select
      cs.chapter_id
    into next_chapter
    from (
      select
        (chapter_obj ->> 'id')::uuid as chapter_id,
        row_number() over (
          order by (chapter_obj ->> 'order_index')::int
        ) as global_order
      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj
    ) cs
    where cs.global_order = current_chapter_order + 1;

    return jsonb_build_object(
      'block', case when next_block.block_id is not null then
        jsonb_build_object(
          'id', next_block.block_id,
          'lesson_id', next_block.lesson_id,
          'chapter_id', next_block.chapter_id,
          'course_id', p_published_course_id
        ) else null end,
      'lesson', case when next_lesson.lesson_id is not null then
        jsonb_build_object(
          'id', next_lesson.lesson_id,
          'chapter_id', next_lesson.chapter_id,
          'course_id', p_published_course_id
        ) else null end,
      'chapter', case when next_chapter.chapter_id is not null then
        jsonb_build_object(
          'id', next_chapter.chapter_id,
          'course_id', p_published_course_id
        ) else null end
    );

  -- Context: LESSON LEVEL
  elsif current_context.lesson_id is not null then
    -- Next lesson
    select
      ls.chapter_id, ls.lesson_id
    into next_lesson
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
    where ls.global_order = current_context.lesson_global_order + 1;

    -- Next chapter
    select
      cs.chapter_id
    into next_chapter
    from (
      select
        (chapter_obj ->> 'id')::uuid as chapter_id,
        row_number() over (
          order by (chapter_obj ->> 'order_index')::int
        ) as global_order
      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj
    ) cs
    where cs.global_order = current_chapter_order + 1;

    return jsonb_build_object(
      'block', null,
      'lesson', case when next_lesson.lesson_id is not null then
        jsonb_build_object(
          'id', next_lesson.lesson_id,
          'chapter_id', next_lesson.chapter_id,
          'course_id', p_published_course_id
        ) else null end,
      'chapter', case when next_chapter.chapter_id is not null then
        jsonb_build_object(
          'id', next_chapter.chapter_id,
          'course_id', p_published_course_id
        ) else null end
    );

  -- Context: CHAPTER LEVEL
  elsif current_context.chapter_id is not null then
    -- Next chapter
    select
      cs.chapter_id
    into next_chapter
    from (
      select
        (chapter_obj ->> 'id')::uuid as chapter_id,
        row_number() over (
          order by (chapter_obj ->> 'order_index')::int
        ) as global_order
      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj
    ) cs
    where cs.global_order = current_chapter_order + 1;

    return jsonb_build_object(
      'block', null,
      'lesson', null,
      'chapter', case when next_chapter.chapter_id is not null then
        jsonb_build_object(
          'id', next_chapter.chapter_id,
          'course_id', p_published_course_id
        ) else null end
    );
  end if;

  -- Fallback (should not reach here)
  return jsonb_build_object('block', null, 'lesson', null, 'chapter', null);
end;
$$;