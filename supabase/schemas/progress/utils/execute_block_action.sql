-- ========================================================================
-- FUNCTION: execute_block_action
-- DESCRIPTION:
--   Handles execution of a user’s action on a lesson block, 
--   automatically updates lesson completion status, and 
--   suggests next content if the lesson is completed.
--
-- INPUTS:
--   p_course_id      - UUID of the published course
--   p_lesson_id      - UUID of the lesson being interacted with
--   p_block_id       - UUID of the specific block (e.g. quiz, explanation, etc.)
--   p_action         - Action performed by user ('submit', 'skip', etc.)
--   p_response_data  - Optional: User's response payload (e.g., answers to quiz)
--   p_score          - Optional: Score (if action yields a numeric result)
--
-- RETURNS:
--   JSONB with detailed result including:
--     - outcome of block action
--     - updated lesson status
--     - recommendation for next content (if applicable)
--     - progression metadata (lesson completed?, course completed?, etc.)
--
-- SECURITY:
--   - Invoker must have permission to update their own progress
-- ========================================================================
create or replace function public.execute_block_action(
  p_course_id uuid,
  p_lesson_id uuid,
  p_block_id uuid,
  p_action text,
  p_response_data jsonb default null,
  p_score numeric default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());

  -- Result of executing the block action (e.g., success/failure, feedback)
  block_result jsonb;

  -- JSONB with updated lesson-level progress data
  lesson_status jsonb;

  -- JSONB representing recommended next content if lesson is completed
  next_content jsonb;
begin
  -- ================================================================
  -- STEP 1: Perform the original block action using the core handler
  -- ================================================================
  select public.execute_block_action(
    p_course_id,
    p_lesson_id,
    p_block_id,
    p_action,
    p_response_data,
    p_score
  ) into block_result;

  -- If block execution failed (e.g. invalid input, already completed), return as-is
  if not (block_result->>'success')::boolean then
    return block_result;
  end if;

  -- ================================================================
  -- STEP 2: Update lesson-level completion status (based on block progress)
  -- ================================================================
  select public.update_lesson_completion_status(p_course_id, p_lesson_id)
  into lesson_status;

  -- ================================================================
  -- STEP 3: If the lesson is now complete, fetch the next recommended content
  -- ================================================================
  if (lesson_status->>'is_completed')::boolean then
    select public.get_next_available_content(p_course_id, p_lesson_id)
    into next_content;
  end if;

  -- ================================================================
  -- STEP 4: Return merged result with:
  --   - Block action outcome
  --   - Lesson completion status
  --   - Next content recommendation (if any)
  --   - Auto-progression metadata
  -- ================================================================
  return block_result || jsonb_build_object(
    'lesson_status', lesson_status,
    'next_content', next_content,
    'auto_progression', jsonb_build_object(
      'lesson_completed', coalesce((lesson_status->>'is_completed')::boolean, false),
      'has_next_content', next_content is not null and next_content->>'type' != 'course_completed',
      'recommendation', case
        when next_content->>'type' = 'course_completed' then 'Course completed! 🎉'
        when (lesson_status->>'is_completed')::boolean then 'Lesson completed! Ready for next lesson?'
        else 'Continue with current lesson'
      end
    )
  );
end;
$$;
