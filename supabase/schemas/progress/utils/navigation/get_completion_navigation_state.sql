-- =============================================================================
-- function: get_completion_navigation_state
-- =============================================================================
-- description:
--   Returns completion stats for a user's progress within a course:
--   total and completed counts, percentages, and overall completion flags
--   for blocks, lessons, chapters, and the course itself.
--
-- parameters:
--   p_user_id              - uuid of the user
--   p_published_course_id  - uuid of the published course
--   course_structure       - jsonb representation of the course
--   current_context        - record (not used here, but kept for consistency)
--
-- returns:
--   jsonb object with detailed progress breakdown
-- =============================================================================

create or replace function public.get_completion_navigation_state(
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
  completion_stats record;
begin
  with
  -- extract all block ids from course structure
  all_blocks as (
    select (block_obj ->> 'id')::uuid as block_id
    from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
          jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj,
          jsonb_array_elements(lesson_obj -> 'blocks') as block_obj
  ),

  -- extract all lesson ids
  all_lessons as (
    select (lesson_obj ->> 'id')::uuid as lesson_id
    from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
         jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj
  ),

  -- extract all chapter ids
  all_chapters as (
    select (chapter_obj ->> 'id')::uuid as chapter_id
    from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj
  ),

  -- count of completed blocks for the user
  completed_blocks as (
    select count(*) as count
    from all_blocks ab
    inner join public.block_progress bp on bp.block_id = ab.block_id
    where bp.user_id = p_user_id
      and bp.published_course_id = p_published_course_id
      and bp.is_completed = true
  ),

  -- count of completed lessons for the user
  completed_lessons as (
    select count(*) as count
    from all_lessons al
    inner join public.lesson_progress lp on lp.lesson_id = al.lesson_id
    where lp.user_id = p_user_id
      and lp.published_course_id = p_published_course_id
      and lp.completed_at is not null
  ),

  -- count of completed chapters for the user
  completed_chapters as (
    select count(*) as count
    from all_chapters ac
    inner join public.chapter_progress cp on cp.chapter_id = ac.chapter_id
    where cp.user_id = p_user_id
      and cp.published_course_id = p_published_course_id
      and cp.completed_at is not null
  )

  -- fetch total and completed counts into a single row
  select
    (select count(*) from all_blocks) as total_blocks,
    (select count from completed_blocks) as completed_blocks,
    (select count(*) from all_lessons) as total_lessons,
    (select count from completed_lessons) as completed_lessons,
    (select count(*) from all_chapters) as total_chapters,
    (select count from completed_chapters) as completed_chapters
  into completion_stats;

  -- build and return a detailed jsonb completion object
  return jsonb_build_object(
    'blocks', jsonb_build_object(
      'total', completion_stats.total_blocks,
      'completed', completion_stats.completed_blocks,
      'percentage', case
        when completion_stats.total_blocks > 0 then
          round((completion_stats.completed_blocks::numeric / completion_stats.total_blocks) * 100, 2)
        else 0
      end,
      'is_complete', (
        completion_stats.completed_blocks = completion_stats.total_blocks
        and completion_stats.total_blocks > 0
      )
    ),
    'lessons', jsonb_build_object(
      'total', completion_stats.total_lessons,
      'completed', completion_stats.completed_lessons,
      'percentage', case
        when completion_stats.total_lessons > 0 then
          round((completion_stats.completed_lessons::numeric / completion_stats.total_lessons) * 100, 2)
        else 0
      end,
      'is_complete', (
        completion_stats.completed_lessons = completion_stats.total_lessons
        and completion_stats.total_lessons > 0
      )
    ),
    'chapters', jsonb_build_object(
      'total', completion_stats.total_chapters,
      'completed', completion_stats.completed_chapters,
      'percentage', case
        when completion_stats.total_chapters > 0 then
          round((completion_stats.completed_chapters::numeric / completion_stats.total_chapters) * 100, 2)
        else 0
      end,
      'is_complete', (
        completion_stats.completed_chapters = completion_stats.total_chapters
        and completion_stats.total_chapters > 0
      )
    ),
    'course', jsonb_build_object(
      'is_complete', (
        completion_stats.completed_blocks = completion_stats.total_blocks
        and completion_stats.total_blocks > 0
      )
    )
  );
end;
$$;
