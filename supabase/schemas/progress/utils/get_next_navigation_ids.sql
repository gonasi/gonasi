-- ================================================================================
-- function: get_next_navigation_ids
-- purpose: given a user and a published course, determine the next navigable
--          block, lesson, and chapter ids. if a current_block_id is provided,
--          it identifies the current chapter and lesson context.
--          additionally returns completion status for confetti celebrations.
-- 
-- inputs:
--   p_user_id             - the user making progress (uuid)
--   p_published_course_id - the id of the published course (uuid)
--   p_current_block_id    - the current block being viewed (optional, uuid)
-- 
-- returns:
--   jsonb object with the following structure:
--     {
--       next_block_id: uuid | null,
--       next_lesson_id: uuid | null,
--       next_chapter_id: uuid | null,
--       current_context: {
--         chapter_id: uuid | null,
--         lesson_id: uuid | null,
--         block_id: uuid | null
--       },
--       completion_status: {
--         is_lesson_complete: boolean,
--         is_chapter_complete: boolean,
--         is_course_complete: boolean
--       }
--     }
-- 
-- notes:
-- - determines the next available block by checking course structure and progress.
-- - supports skipping logic and handles completed courses gracefully.
-- - relies on published_course_structure_content, block_progress, and lesson_progress.
-- - includes completion status for confetti display logic.
-- ================================================================================

create or replace function public.get_next_navigation_ids(
  p_user_id uuid,
  p_published_course_id uuid,
  p_current_block_id uuid default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  course_structure jsonb;
  result jsonb;
  current_chapter_id uuid;
  current_lesson_id uuid;
  next_block_id uuid;
  next_lesson_id uuid;
  next_chapter_id uuid;
  is_lesson_complete boolean := false;
  is_chapter_complete boolean := false;
  is_course_complete boolean := false;
begin
  -- fetch the full course structure for the given published course
  select course_structure_content 
  into course_structure
  from public.published_course_structure_content 
  where id = p_published_course_id;

  -- if no structure found, return early with an error message
  if course_structure is null then
    return jsonb_build_object('error', 'course structure not found');
  end if;

  -- identify current chapter and lesson context if block_id is provided
  if p_current_block_id is not null then
    select 
      (chapter_obj ->> 'id')::uuid,
      (lesson_obj ->> 'id')::uuid
    into current_chapter_id, current_lesson_id
    from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
         jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj,
         jsonb_array_elements(lesson_obj -> 'blocks') as block_obj
    where (block_obj ->> 'id')::uuid = p_current_block_id;
  end if;

  -- construct a CTE to flatten blocks with position info and join with user progress
  with block_progress_status as (
    select 
      (chapter_obj ->> 'id')::uuid as chapter_id,
      (lesson_obj ->> 'id')::uuid as lesson_id,
      (block_obj ->> 'id')::uuid as block_id,
      row_number() over (
        order by chapter_pos, lesson_pos, block_pos
      ) as global_position,
      coalesce(bp.is_completed, false) as is_completed,
      coalesce((block_obj -> 'settings' ->> 'can_skip')::boolean, false) as can_skip,
      lag(coalesce(bp.is_completed, false), 1, true) over (
        order by chapter_pos, lesson_pos, block_pos
      ) as prev_block_completed
    from jsonb_array_elements(course_structure -> 'chapters') with ordinality as chapters(chapter_obj, chapter_pos),
         jsonb_array_elements(chapter_obj -> 'lessons') with ordinality as lessons(lesson_obj, lesson_pos),
         jsonb_array_elements(lesson_obj -> 'blocks') with ordinality as blocks(block_obj, block_pos)
    left join public.block_progress bp on (
      bp.user_id = p_user_id
      and bp.published_course_id = p_published_course_id
      and bp.block_id = (block_obj ->> 'id')::uuid
    )
  )
  -- select the next block that is either the first, has a completed predecessor, or is skippable
  select block_id, lesson_id, chapter_id
  into next_block_id, next_lesson_id, next_chapter_id
  from block_progress_status
  where not is_completed
    and (global_position = 1 or prev_block_completed or can_skip)
  order by global_position
  limit 1;

  -- fallback: if no next block found, try to find the next incomplete lesson
  if next_block_id is null then
    select 
      (lesson_obj ->> 'id')::uuid,
      (chapter_obj ->> 'id')::uuid
    into next_lesson_id, next_chapter_id
    from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
         jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj
    left join public.lesson_progress lp on (
      lp.user_id = p_user_id
      and lp.published_course_id = p_published_course_id
      and lp.lesson_id = (lesson_obj ->> 'id')::uuid
    )
    where lp.completed_at is null or lp.id is null
    order by 
      (chapter_obj ->> 'order_index')::integer,
      (lesson_obj ->> 'order_index')::integer
    limit 1;
  end if;

  -- only check completion status if we have a current block context
  -- and only if this might be the last block of lesson/chapter/course
  if p_current_block_id is not null and current_lesson_id is not null then
    -- check if this is the last block in the current lesson
    with lesson_blocks as (
      select (block_obj ->> 'id')::uuid as block_id,
             (block_obj ->> 'position')::integer as position
      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
           jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj,
           jsonb_array_elements(lesson_obj -> 'blocks') as block_obj
      where (lesson_obj ->> 'id')::uuid = current_lesson_id
    )
    select p_current_block_id = (
      select block_id 
      from lesson_blocks 
      order by position desc 
      limit 1
    ) into is_lesson_complete;
    
    -- only check if this is potentially the last block in the lesson
    if is_lesson_complete then
      -- verify lesson is actually complete by checking lesson_progress
      select exists(
        select 1 
        from public.lesson_progress lp
        where lp.user_id = p_user_id
          and lp.published_course_id = p_published_course_id
          and lp.lesson_id = current_lesson_id
          and lp.completed_at is not null
      ) into is_lesson_complete;
      
      -- if lesson is complete, check if this is the last lesson in chapter
      if is_lesson_complete and current_chapter_id is not null then
        with chapter_lessons as (
          select (lesson_obj ->> 'id')::uuid as lesson_id,
                 (lesson_obj ->> 'position')::integer as position
          from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
               jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj
          where (chapter_obj ->> 'id')::uuid = current_chapter_id
        )
        select current_lesson_id = (
          select lesson_id 
          from chapter_lessons 
          order by position desc 
          limit 1
        ) into is_chapter_complete;
        
        -- only check chapter completion if this is the last lesson
        if is_chapter_complete then
          -- verify chapter is complete by checking all lessons are complete
          with chapter_lessons as (
            select (lesson_obj ->> 'id')::uuid as lesson_id
            from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
                 jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj
            where (chapter_obj ->> 'id')::uuid = current_chapter_id
          ),
          completed_lessons as (
            select cl.lesson_id
            from chapter_lessons cl
            inner join public.lesson_progress lp on (
              lp.user_id = p_user_id
              and lp.published_course_id = p_published_course_id
              and lp.lesson_id = cl.lesson_id
              and lp.completed_at is not null
            )
          )
          select (
            select count(*) from chapter_lessons
          ) = (
            select count(*) from completed_lessons
          ) and (
            select count(*) from chapter_lessons
          ) > 0
          into is_chapter_complete;
          
          -- if chapter is complete, check if this is the last chapter in course
          if is_chapter_complete then
            with course_chapters as (
              select (chapter_obj ->> 'id')::uuid as chapter_id,
                     (chapter_obj ->> 'position')::integer as position
              from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj
            )
            select current_chapter_id = (
              select chapter_id 
              from course_chapters 
              order by position desc 
              limit 1
            ) into is_course_complete;
            
            -- only check course completion if this is the last chapter
            if is_course_complete then
              -- verify course is complete by checking all lessons are complete
              with all_course_lessons as (
                select (lesson_obj ->> 'id')::uuid as lesson_id
                from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
                     jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj
              ),
              all_completed_lessons as (
                select acl.lesson_id
                from all_course_lessons acl
                inner join public.lesson_progress lp on (
                  lp.user_id = p_user_id
                  and lp.published_course_id = p_published_course_id
                  and lp.lesson_id = acl.lesson_id
                  and lp.completed_at is not null
                )
              )
              select (
                select count(*) from all_course_lessons
              ) = (
                select count(*) from all_completed_lessons
              ) and (
                select count(*) from all_course_lessons
              ) > 0
              into is_course_complete;
            end if;
          end if;
        end if;
      end if;
    end if;
  end if;

  -- return the result as structured jsonb
  return jsonb_build_object(
    'next_block_id', next_block_id,
    'next_lesson_id', next_lesson_id,
    'next_chapter_id', next_chapter_id,
    'current_context', jsonb_build_object(
      'chapter_id', current_chapter_id,
      'lesson_id', current_lesson_id,
      'block_id', p_current_block_id
    ),
    'completion_status', jsonb_build_object(
      'is_lesson_complete', is_lesson_complete,
      'is_chapter_complete', is_chapter_complete,
      'is_course_complete', is_course_complete
    )
  );
end;
$$;