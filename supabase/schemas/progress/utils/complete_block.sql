-- =================================================================================
-- HELPER FUNCTION: Mark block as completed (convenience function)
-- =================================================================================
CREATE OR REPLACE FUNCTION public.complete_block(
  p_user_id uuid,
  p_published_course_id uuid,
  p_chapter_id uuid,
  p_lesson_id uuid,
  p_block_id uuid,
  p_earned_score numeric DEFAULT NULL,
  p_time_spent_seconds integer DEFAULT 0,
  p_interaction_data jsonb DEFAULT NULL,
  p_last_response jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  organization_id uuid;
  result jsonb;
  next_ids jsonb;
BEGIN
  -- Get organization_id from published_course
  SELECT pc.organization_id 
  INTO organization_id
  FROM public.published_courses pc
  WHERE pc.id = p_published_course_id;
  
  IF organization_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Published course not found');
  END IF;
  
  -- Insert or update block progress
  INSERT INTO public.block_progress (
    user_id,
    published_course_id,
    chapter_id,
    lesson_id,
    block_id,
    organization_id,
    is_completed,
    completed_at,
    time_spent_seconds,
    earned_score,
    attempt_count,
    interaction_data,
    last_response
  )
  VALUES (
    p_user_id,
    p_published_course_id,
    p_chapter_id,
    p_lesson_id,
    p_block_id,
    organization_id,
    true,
    timezone('utc', now()),
    p_time_spent_seconds,
    p_earned_score,
    COALESCE((SELECT attempt_count + 1 FROM public.block_progress 
              WHERE user_id = p_user_id 
                AND published_course_id = p_published_course_id 
                AND block_id = p_block_id), 1),
    p_interaction_data,
    p_last_response
  )
  ON CONFLICT (user_id, published_course_id, block_id)
  DO UPDATE SET
    is_completed = true,
    completed_at = timezone('utc', now()),
    time_spent_seconds = block_progress.time_spent_seconds + EXCLUDED.time_spent_seconds,
    earned_score = COALESCE(EXCLUDED.earned_score, block_progress.earned_score),
    attempt_count = COALESCE(block_progress.attempt_count + 1, 1),
    interaction_data = COALESCE(EXCLUDED.interaction_data, block_progress.interaction_data),
    last_response = COALESCE(EXCLUDED.last_response, block_progress.last_response),
    updated_at = timezone('utc', now());
  
  -- Get next navigation IDs
  SELECT public.get_next_navigation_ids(p_user_id, p_published_course_id, p_block_id)
  INTO next_ids;
  
  RETURN jsonb_build_object(
    'success', true,
    'block_id', p_block_id,
    'completed_at', to_char(timezone('utc', now()), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'navigation', next_ids
  );
END;
$$;