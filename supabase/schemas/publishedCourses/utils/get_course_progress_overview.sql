-- =====================================================================================================
-- FUNCTION: get_course_progress_overview (UPDATED VERSION)
-- DESCRIPTION:
--   Returns a full JSON overview of the current authenticated user's progress in a published course,
--   including:
--     - Course metadata with category and subcategory names
--     - Organization information
--     - User progress metrics (if enrolled) with active chapter/lesson IDs
--     - Chapter and lesson structure with per-lesson progress and active flags
--     - Recent activity (recently completed blocks)
--     - Additional statistics like total time spent, average score, and first activity timestamp
--
-- NOTES:
--   - Uses auth.uid() to determine the authenticated user.
--   - If the user is not enrolled, progress will be excluded from the response.
--   - All timestamp fields are formatted as ISO 8601 strings with timezone for Zod validation
--   - UPDATED: Now includes active_chapter_id and active_lesson_id in overall_progress
--   - UPDATED: Now includes is_active flags for chapters and lessons
-- =====================================================================================================
create or replace function public.get_published_chapters_with_progress(p_published_course_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();
  v_user_enrolled boolean;
  v_active_lesson_id uuid;
  result jsonb;
begin
  -- Check if user is enrolled in the course
  select exists (
    select 1
    from public.course_enrollments ce
    where ce.published_course_id = p_published_course_id
      and ce.user_id = v_user_id
  )
  into v_user_enrolled;

  -- Get user's current active lesson
  if v_user_enrolled then
    select cal.lesson_id
    into v_active_lesson_id
    from public.current_active_lesson cal
    where cal.user_id = v_user_id
      and cal.published_course_id = p_published_course_id;
  end if;

  -- Fetch structured data with progress
  select jsonb_agg(
    jsonb_build_object(
      'id', (chapter->>'id')::uuid,
      'name', chapter->>'name',
      'position', (chapter->>'position')::integer,
      'total_lessons', (chapter->>'total_lessons')::integer,
      'lessons', (
        select jsonb_agg(
          jsonb_build_object(
            'id', (lesson->>'id')::uuid,
            'name', lesson->>'name',
            'position', (lesson->>'position')::integer,
            'total_blocks', (lesson->>'total_blocks')::integer,
            'lesson_type', lesson->'lesson_types',
            'is_active', case
              when v_user_enrolled then ((lesson->>'id')::uuid = v_active_lesson_id)
              else false
            end,
            'is_completed', case
              when v_user_enrolled then coalesce(lp_data.is_completed, false)
              else false
            end,
            'progress', case
              when v_user_enrolled then
                coalesce(lp_data.progress_data, jsonb_build_object(
                  'total_blocks', (lesson->>'total_blocks')::integer,
                  'completed_blocks', 0,
                  'total_weight', 0,
                  'completed_weight', 0,
                  'progress_percentage', 0,
                  'completed_at', null,
                  'updated_at', null,
                  'is_completed', false
                ))
              else null
            end
          )
        )
        from jsonb_array_elements(chapter->'lessons') as lesson
        left join lateral (
          select 
            lp.is_completed,
            jsonb_build_object(
              'total_blocks', lp.total_blocks,
              'completed_blocks', lp.completed_blocks,
              'total_weight', lp.total_weight,
              'completed_weight', lp.completed_weight,
              'progress_percentage', lp.progress_percentage,
              'completed_at', case 
                when lp.completed_at is not null then 
                  to_char(lp.completed_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
                else null end,
              'updated_at', case 
                when lp.updated_at is not null then 
                  to_char(lp.updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
                else null end,
              'is_completed', lp.is_completed
            ) as progress_data
          from public.lesson_progress lp
          where v_user_enrolled
            and lp.user_id = v_user_id
            and lp.published_course_id = p_published_course_id
            and lp.lesson_id = (lesson->>'id')::uuid
        ) lp_data on true
      )
    )
  )
  into result
  from (
    select chapter
    from public.published_courses pc,
          jsonb_array_elements(pc.course_data->'chapters') as chapter
    where pc.id = p_published_course_id
  ) as chapters;

  return coalesce(result, '[]'::jsonb);
end;
$$;
