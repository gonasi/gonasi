-- ========================================================================
-- FUNCTION: get_user_course_state
-- DESCRIPTION:
--   Returns a comprehensive snapshot of a user's current state in a course.
--   This includes:
--     - Course progress (lessons, blocks, completion status)
--     - Last activity (most recent block interaction)
--     - Next content (where to go next)
--     - Smart recommendations (start, continue, or finish the course)
--
--   This function powers dashboards and learning paths.
-- ========================================================================
create or replace function public.get_user_course_state(
  p_course_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());  -- Currently logged-in user
  course_progress_data jsonb;                   -- User's course progress summary
  last_activity jsonb;                          -- Most recent block activity
  next_content jsonb;                           -- What should user learn next
  result jsonb;                                 -- Final output
begin
  -- ============================================================
  -- STEP 1: Fetch user's overall course progress if available
  -- ============================================================
  select to_jsonb(cp.*) into course_progress_data
  from public.course_progress cp
  where cp.user_id = current_user_id
    and cp.published_course_id = p_course_id;

  -- ============================================================
  -- STEP 2: Fetch user's most recent block-level activity
  -- ============================================================
  select jsonb_build_object(
    'last_lesson_id', bp.lesson_id,
    'last_block_id', bp.block_id,
    'last_activity_at', bp.updated_at,
    'was_completed', bp.is_completed
  ) into last_activity
  from public.block_progress bp
  where bp.user_id = current_user_id
    and bp.published_course_id = p_course_id
  order by bp.updated_at desc
  limit 1;

  -- ============================================================
  -- STEP 3: Determine what content should be shown next
  --   - If last activity exists, use it to find next content
  --   - Otherwise, return the first lesson of the course
  -- ============================================================
  if last_activity is not null then
    select public.get_next_available_content(
      p_course_id, 
      (last_activity->>'last_lesson_id')::uuid
    ) into next_content;
  else
    select public.get_next_available_content(p_course_id) into next_content;
  end if;

  -- ============================================================
  -- STEP 4: Build a comprehensive JSON response including:
  --   - progress
  --   - last activity
  --   - next content
  --   - recommendations based on state
  -- ============================================================
  select jsonb_build_object(
    'course_id', p_course_id,
    'user_id', current_user_id,

    -- Fallback for first-time learners
    'progress', coalesce(course_progress_data, jsonb_build_object(
      'total_lessons', 0,
      'completed_lessons', 0,
      'total_blocks', 0,
      'completed_blocks', 0,
      'completion_percentage', 0,
      'is_started', false
    )),

    -- Last block interaction by the user
    'last_activity', last_activity,

    -- Next thing to learn
    'next_content', next_content,

    -- Smart recommendation engine
    'recommendations', case
      -- User has never started
      when course_progress_data is null then 
        jsonb_build_object(
          'action', 'start_course',
          'message', 'Ready to begin your learning journey!'
        )

      -- Course is marked as completed
      when (course_progress_data->>'completed_at') is not null then
        jsonb_build_object(
          'action', 'course_completed',
          'message', 'Congratulations! You have completed this course.',
          'next_steps', jsonb_build_array(
            'review_content',
            'explore_related_courses',
            'apply_knowledge'
          )
        )

      -- All content completed, but not yet marked as course completed
      when next_content->>'type' = 'course_completed' then
        jsonb_build_object(
          'action', 'course_completed',
          'message', 'You have completed all available content!'
        )

      -- User left off in a block that wasn't completed
      when last_activity is not null and not (last_activity->>'was_completed')::boolean then
        jsonb_build_object(
          'action', 'continue_lesson',
          'message', 'Continue where you left off',
          'lesson_id', last_activity->>'last_lesson_id'
        )

      -- Default recommendation: move to next lesson
      else
        jsonb_build_object(
          'action', 'next_lesson',
          'message', 'Ready for the next lesson',
          'next_content', next_content
        )
    end

  ) into result;

  return result;
end;
$$;
