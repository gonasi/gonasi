-- =============================================================================
-- FUNCTION: get_previous_navigation_state (FIXED)
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
  current_chapter_order integer;
begin
  -- Get the current chapter's global order for reference
  select
    row_number() over (order by (chapter_obj ->> 'order_index')::int) as chapter_order
  into current_chapter_order
  from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj
  where (chapter_obj ->> 'id')::uuid = current_context.chapter_id;

  -- Always assign prev_block record (with defaults)
  select
    coalesce(bs.chapter_id, null::uuid) as chapter_id,
    coalesce(bs.lesson_id, null::uuid) as lesson_id,
    coalesce(bs.block_id, null::uuid) as block_id
  into prev_block
  from (
    select null::uuid as chapter_id, null::uuid as lesson_id, null::uuid as block_id
  ) as defaults
  left join (
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
  ) bs on (
    current_context.block_id is not null 
    and bs.global_order = current_context.block_global_order - 1
  );

  -- Always assign prev_lesson record (with defaults)
  select
    coalesce(ls.chapter_id, null::uuid) as chapter_id,
    coalesce(ls.lesson_id, null::uuid) as lesson_id
  into prev_lesson
  from (
    select null::uuid as chapter_id, null::uuid as lesson_id
  ) as defaults
  left join (
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
  ) ls on (
    current_context.lesson_global_order is not null 
    and ls.global_order = current_context.lesson_global_order - 1
  );

  -- FIXED: Always assign prev_chapter record based on current chapter's position
  select
    coalesce(cs.chapter_id, null::uuid) as chapter_id
  into prev_chapter
  from (
    select null::uuid as chapter_id
  ) as defaults
  left join (
    select
      (chapter_obj ->> 'id')::uuid as chapter_id,
      row_number() over (
        order by (chapter_obj ->> 'order_index')::int
      ) as global_order
    from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj
  ) cs on (
    current_chapter_order is not null 
    and cs.global_order = current_chapter_order - 1
  );

  -- Return unified JSONB result
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