-- =============================================================================
-- FUNCTION: resolve_current_context
-- =============================================================================
-- Resolves the current context (block, lesson, chapter) from provided identifiers
-- and returns a structured record with global ordering for each level.
-- If no identifiers are provided, returns the first chapter as default context.
--
-- Parameters:
--   course_structure  - JSONB structure of the published course
--   p_block_id        - UUID of the current block (optional)
--   p_lesson_id       - UUID of the current lesson (optional)
--   p_chapter_id      - UUID of the current chapter (optional)
--
-- Returns TABLE:
--   block_id             - UUID of the resolved block (nullable)
--   lesson_id            - UUID of the resolved lesson (nullable)
--   chapter_id           - UUID of the resolved chapter
--   block_global_order   - Global order index for the block (nullable)
--   lesson_global_order  - Global order index for the lesson (nullable)
--   chapter_global_order - Global order index for the chapter
-- =============================================================================

create or replace function public.resolve_current_context(
  course_structure jsonb,
  p_block_id uuid default null,
  p_lesson_id uuid default null,
  p_chapter_id uuid default null
)
returns table(
  block_id uuid,
  lesson_id uuid,
  chapter_id uuid,
  block_global_order integer,
  lesson_global_order integer,
  chapter_global_order integer
)
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- =========================================================================
  -- CASE 1: Resolve context from block_id (most granular level)
  -- =========================================================================
  if p_block_id is not null then
    return query
    with structure as (
      select
        (chapter_obj ->> 'id')::uuid as chap_id,
        (lesson_obj ->> 'id')::uuid as less_id,
        (block_obj ->> 'id')::uuid as block_id,

        -- Compute global ordering
        row_number() over (
          order by 
            (chapter_obj ->> 'order_index')::int,
            (lesson_obj ->> 'order_index')::int,
            (block_obj ->> 'order_index')::int
        ) as block_order,

        row_number() over (
          order by 
            (chapter_obj ->> 'order_index')::int,
            (lesson_obj ->> 'order_index')::int
        ) as lesson_order,

        row_number() over (
          order by 
            (chapter_obj ->> 'order_index')::int
        ) as chapter_order

      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
            jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj,
            jsonb_array_elements(lesson_obj -> 'blocks') as block_obj
    )
    select
      s.block_id,
      s.less_id,
      s.chap_id,
      s.block_order::int,
      s.lesson_order::int,
      s.chapter_order::int
    from structure s
    where s.block_id = p_block_id;

  -- =========================================================================
  -- CASE 2: Resolve context from lesson_id
  -- =========================================================================
  elsif p_lesson_id is not null then
    return query
    with structure as (
      select
        (chapter_obj ->> 'id')::uuid as chap_id,
        (lesson_obj ->> 'id')::uuid as less_id,
        null::uuid as block_id,
        null::int as block_order,

        row_number() over (
          order by 
            (chapter_obj ->> 'order_index')::int,
            (lesson_obj ->> 'order_index')::int
        ) as lesson_order,

        row_number() over (
          order by 
            (chapter_obj ->> 'order_index')::int
        ) as chapter_order

      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
           jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj
    )
    select
      s.block_id,
      s.less_id,
      s.chap_id,
      s.block_order,
      s.lesson_order::int,
      s.chapter_order::int
    from structure s
    where s.less_id = p_lesson_id;

  -- =========================================================================
  -- CASE 3: Resolve context from chapter_id (coarsest level)
  -- =========================================================================
  elsif p_chapter_id is not null then
    return query
    with structure as ( 
      select
        (chapter_obj ->> 'id')::uuid as chap_id,
        null::uuid as less_id,
        null::uuid as block_id,
        null::int as block_order,
        null::int as lesson_order,

        row_number() over (
          order by 
            (chapter_obj ->> 'order_index')::int
        ) as chapter_order

      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj
    )
    select
      s.block_id,
      s.less_id,
      s.chap_id,
      s.block_order,
      s.lesson_order,
      s.chapter_order::int
    from structure s
    where s.chap_id = p_chapter_id;

  -- =========================================================================
  -- CASE 4: No specific context provided - return first chapter as default
  -- This handles scenarios like "user completed course" where we need a 
  -- navigation context but don't have a specific current position.
  -- =========================================================================
  else
    return query
    with structure as ( 
      select
        (chapter_obj ->> 'id')::uuid as chap_id,
        null::uuid as less_id,
        null::uuid as block_id,
        null::int as block_order,
        null::int as lesson_order,

        row_number() over (
          order by 
            (chapter_obj ->> 'order_index')::int
        ) as chapter_order

      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj
    )
    select
      s.block_id,
      s.less_id,
      s.chap_id,
      s.block_order,
      s.lesson_order,
      s.chapter_order::int
    from structure s
    where s.chapter_order = 1  -- Return the first chapter
    limit 1;
  end if;
end;
$$;