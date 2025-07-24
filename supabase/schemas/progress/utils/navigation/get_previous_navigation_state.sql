-- =============================================================================
-- FUNCTION: get_previous_navigation_state (CONTEXT-AWARE, FIXED CHAPTER ORDER)
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
    -- Previous block
    select
      bs.chapter_id, bs.lesson_id, bs.block_id
    into prev_block
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
    where bs.global_order = current_context.block_global_order - 1;

    -- Previous lesson
    select
      ls.chapter_id, ls.lesson_id
    into prev_lesson
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
    where ls.global_order = current_context.lesson_global_order - 1;

    -- Previous chapter
    select
      cs.chapter_id
    into prev_chapter
    from (
      select
        (chapter_obj ->> 'id')::uuid as chapter_id,
        row_number() over (
          order by (chapter_obj ->> 'order_index')::int
        ) as global_order
      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj
    ) cs
    where cs.global_order = current_chapter_order - 1;

    return jsonb_build_object(
      'block', case when prev_block.block_id is not null then
        jsonb_build_object(
          'id', prev_block.block_id,
          'lesson_id', prev_block.lesson_id,
          'chapter_id', prev_block.chapter_id,
          'course_id', p_published_course_id
        ) else null end,
      'lesson', case when prev_lesson.lesson_id is not null then
        jsonb_build_object(
          'id', prev_lesson.lesson_id,
          'chapter_id', prev_lesson.chapter_id,
          'course_id', p_published_course_id
        ) else null end,
      'chapter', case when prev_chapter.chapter_id is not null then
        jsonb_build_object(
          'id', prev_chapter.chapter_id,
          'course_id', p_published_course_id
        ) else null end
    );

  -- Context: LESSON LEVEL
  elsif current_context.lesson_id is not null then
    -- Previous lesson
    select
      ls.chapter_id, ls.lesson_id
    into prev_lesson
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
    where ls.global_order = current_context.lesson_global_order - 1;

    -- Previous chapter
    select
      cs.chapter_id
    into prev_chapter
    from (
      select
        (chapter_obj ->> 'id')::uuid as chapter_id,
        row_number() over (
          order by (chapter_obj ->> 'order_index')::int
        ) as global_order
      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj
    ) cs
    where cs.global_order = current_chapter_order - 1;

    return jsonb_build_object(
      'block', null,
      'lesson', case when prev_lesson.lesson_id is not null then
        jsonb_build_object(
          'id', prev_lesson.lesson_id,
          'chapter_id', prev_lesson.chapter_id,
          'course_id', p_published_course_id
        ) else null end,
      'chapter', case when prev_chapter.chapter_id is not null then
        jsonb_build_object(
          'id', prev_chapter.chapter_id,
          'course_id', p_published_course_id
        ) else null end
    );

  -- Context: CHAPTER LEVEL
  elsif current_context.chapter_id is not null then
    -- Previous chapter
    select
      cs.chapter_id
    into prev_chapter
    from (
      select
        (chapter_obj ->> 'id')::uuid as chapter_id,
        row_number() over (
          order by (chapter_obj ->> 'order_index')::int
        ) as global_order
      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj
    ) cs
    where cs.global_order = current_chapter_order - 1;

    return jsonb_build_object(
      'block', null,
      'lesson', null,
      'chapter', case when prev_chapter.chapter_id is not null then
        jsonb_build_object(
          'id', prev_chapter.chapter_id,
          'course_id', p_published_course_id
        ) else null end
    );
  end if;

  -- Fallback (should not reach here)
  return jsonb_build_object('block', null, 'lesson', null, 'chapter', null);
end;
$$;