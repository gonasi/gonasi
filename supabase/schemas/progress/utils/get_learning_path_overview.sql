-- ========================================================================
-- FUNCTION: get_learning_path_overview
-- DESCRIPTION:
--   Returns a structured overview of the user's progress across all chapters
--   and lessons in a published course. Includes chapter-level and lesson-level
--   progress, and calculates overall learning path completion.
--
-- SECURITY:
--   - Authenticated user context is determined using `auth.uid()`.
--   - Function is marked as `security invoker` with empty `search_path`.
--
-- RETURN FORMAT (JSONB):
--   {
--     course_id,
--     learning_path: [chapter_overviews...],
--     overall_progress: {
--       total_chapters,
--       completed_chapters,
--       in_progress_chapters,
--       not_started_chapters,
--       overall_completion_percentage
--     }
--   }
-- ========================================================================
create or replace function public.get_learning_path_overview(
  p_course_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  course_structure jsonb;
  result jsonb;
begin
  -- STEP 1: Fetch the published course structure
  select course_structure_content into course_structure
  from public.published_course_structure_content
  where id = p_course_id;

  -- STEP 2: Generate chapter-level progress details
  with chapter_progress as (
    select 
      -- Basic chapter info
      (chapter->>'id')::uuid as chapter_id,
      chapter->>'title' as chapter_title,
      (chapter->>'position')::int as chapter_position,
      jsonb_array_length(chapter->'lessons') as total_lessons,

      -- Count how many lessons in this chapter the user has completed
      (
        select count(*)
        from jsonb_array_elements(chapter->'lessons') as lesson
        where exists (
          select 1 from public.lesson_progress lp
          where lp.user_id = current_user_id
            and lp.published_course_id = p_course_id
            and lp.lesson_id = (lesson->>'id')::uuid
            and lp.completed_at is not null
        )
      ) as completed_lessons,

      -- Check if the user has started any lesson in this chapter
      (
        select count(*) > 0
        from jsonb_array_elements(chapter->'lessons') as lesson
        where exists (
          select 1 from public.lesson_progress lp
          where lp.user_id = current_user_id
            and lp.published_course_id = p_course_id
            and lp.lesson_id = (lesson->>'id')::uuid
        )
      ) as has_started,

      -- Build lesson array with embedded progress per lesson
      (
        select jsonb_agg(
          lesson || jsonb_build_object(
            'progress', coalesce(lesson_progress_data.progress, jsonb_build_object(
              'is_completed', false,
              'completed_blocks', 0,
              'completion_percentage', 0
            )),
            'is_current', lesson_progress_data.is_current,
            'is_next', lesson_progress_data.is_next
          )
          order by (lesson->>'position')::int
        )
        from jsonb_array_elements(chapter->'lessons') as lesson
        left join lateral (
          select 
            -- Fetch lesson progress metrics
            jsonb_build_object(
              'is_completed', lp.completed_at is not null,
              'completed_blocks', lp.completed_blocks,
              'total_blocks', lp.total_blocks,
              'completion_percentage', case 
                when lp.total_blocks > 0 then round(lp.completed_blocks * 100.0 / lp.total_blocks, 2)
                else 0 
              end,
              'last_activity', lp.updated_at
            ) as progress,

            -- Mark if this is the user's currently active lesson (latest activity)
            exists (
              select 1
              from public.block_progress bp
              where bp.user_id = current_user_id
                and bp.published_course_id = p_course_id
                and bp.lesson_id = (lesson->>'id')::uuid
                and bp.updated_at = (
                  select max(bp2.updated_at)
                  from public.block_progress bp2
                  where bp2.user_id = current_user_id
                    and bp2.published_course_id = p_course_id
                )
            ) as is_current,

            -- Placeholder: can be updated later with actual "is_next" logic
            false as is_next
          from public.lesson_progress lp
          where lp.user_id = current_user_id
            and lp.published_course_id = p_course_id
            and lp.lesson_id = (lesson->>'id')::uuid
        ) lesson_progress_data on true
      ) as lessons_with_progress

    from jsonb_array_elements(course_structure->'chapters') as chapter
  )

  -- STEP 3: Aggregate full learning path and compute overall course progress
  select jsonb_build_object(
    'course_id', p_course_id,
    'learning_path', jsonb_agg(
      jsonb_build_object(
        'chapter_id', cp.chapter_id,
        'title', cp.chapter_title,
        'position', cp.chapter_position,
        'progress', jsonb_build_object(
          'total_lessons', cp.total_lessons,
          'completed_lessons', cp.completed_lessons,
          'completion_percentage', case 
            when cp.total_lessons > 0 then round(cp.completed_lessons * 100.0 / cp.total_lessons, 2)
            else 0 
          end,
          'status', case
            when cp.completed_lessons = cp.total_lessons then 'completed'
            when cp.has_started then 'in_progress'
            else 'not_started'
          end
        ),
        'lessons', cp.lessons_with_progress
      )
      order by cp.chapter_position
    ),

    'overall_progress', (
      select jsonb_build_object(
        'total_chapters', count(*),
        'completed_chapters', count(*) filter (where completed_lessons = total_lessons),
        'in_progress_chapters', count(*) filter (where has_started and completed_lessons < total_lessons),
        'not_started_chapters', count(*) filter (where not has_started),
        'overall_completion_percentage', round(
          avg(case when total_lessons > 0 then completed_lessons * 100.0 / total_lessons else 0 end), 2
        )
      )
      from chapter_progress
    )
  ) into result
  from chapter_progress cp;

  return result;
end;
$$;
