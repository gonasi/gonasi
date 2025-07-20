-- ========================================================================
-- FUNCTION: handle_completed_content_interaction
-- DESCRIPTION:
--   Handles user interaction with already completed content in a course.
--   This includes:
--     - Reviewing completed lessons or courses
--     - Restarting/resetting progress
--     - Skipping to the next available content
-- 
-- PARAMETERS:
--   p_course_id   - UUID of the course the user is interacting with
--   p_lesson_id   - Optional UUID of the specific lesson (nullable)
--   p_action      - Action type ('review', 'restart', 'skip_to_next')
--
-- RETURNS:
--   JSONB object representing the result of the interaction, including:
--     - The resolved action
--     - A user-facing message
--     - Any relevant next content
--     - A snapshot of the prior content state
--     - A timestamp of the interaction
-- ========================================================================
create or replace function public.handle_completed_content_interaction(
  p_course_id uuid,
  p_lesson_id uuid default null,
  p_action text default 'review' -- valid values: 'review', 'restart', 'skip_to_next'
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());       -- Get the current authenticated user's ID
  content_state jsonb;                               -- Stores the current state of the lesson/course
  next_content jsonb;                                -- Stores next available content if skipping forward
  result jsonb;                                      -- Final result object to return
begin
  -- STEP 1: Fetch current completion state
  if p_lesson_id is not null then
    -- If lesson ID is provided, fetch specific lesson progress
    select to_jsonb(lp.*) into content_state
    from public.lesson_progress lp
    where lp.user_id = current_user_id
      and lp.published_course_id = p_course_id
      and lp.lesson_id = p_lesson_id;
  else
    -- Otherwise, fetch entire course progress
    select to_jsonb(cp.*) into content_state
    from public.course_progress cp
    where cp.user_id = current_user_id
      and cp.published_course_id = p_course_id;
  end if;

  -- STEP 2: Handle user-selected action
  case p_action
    when 'review' then
      -- User wants to review content without resetting progress
      result := jsonb_build_object(
        'action', 'review_mode',
        'message', 'Reviewing completed content',
        'content_unlocked', true,
        'show_solutions', true
      );

    when 'restart' then
      -- User wants to restart and reset progress
      if p_lesson_id is not null then
        -- Reset all block progress within the lesson
        delete from public.block_progress 
        where user_id = current_user_id 
          and published_course_id = p_course_id 
          and lesson_id = p_lesson_id;

        -- Remove lesson-level completion record
        delete from public.lesson_progress
        where user_id = current_user_id
          and published_course_id = p_course_id
          and lesson_id = p_lesson_id;
      else
        -- Reset entire course progress (blocks, lessons, course)
        delete from public.block_progress 
        where user_id = current_user_id and published_course_id = p_course_id;

        delete from public.lesson_progress
        where user_id = current_user_id and published_course_id = p_course_id;

        delete from public.course_progress
        where user_id = current_user_id and published_course_id = p_course_id;
      end if;

      result := jsonb_build_object(
        'action', 'content_reset',
        'message', 'Progress reset. You can start fresh!',
        'reset_completed', true
      );

    when 'skip_to_next' then
      -- User wants to skip past completed content
      select public.get_next_available_content(p_course_id, p_lesson_id) into next_content;

      result := jsonb_build_object(
        'action', 'navigate_next',
        'next_content', next_content,
        'message', case
          when next_content->>'type' = 'course_completed' 
            then 'You have completed all available content!'
          else 'Navigating to next available content'
        end
      );

    else
      -- Catch unhandled action
      raise exception 'Unsupported action: %', p_action;
  end case;

  -- STEP 3: Return combined result
  return result || jsonb_build_object(
    'content_state', content_state,              -- Include the original progress state
    'interaction_timestamp', now()               -- Timestamp the interaction
  );
end;
$$;
