-- =============================================================================
-- FUNCTION: complete_block
-- =============================================================================
-- Description:
-- Marks a block as completed for a given user and updates progress metadata.
-- Performs the following:
--   1. Validates the block weight from the course structure.
--   2. Inserts or updates block progress.
--   3. Triggers lesson and course progress updates.
--   4. Returns navigation metadata for next content.
--
-- Parameters:
--   p_user_id              - UUID of the user completing the block
--   p_published_course_id  - UUID of the published course
--   p_chapter_id           - UUID of the chapter containing the block
--   p_lesson_id            - UUID of the lesson containing the block
--   p_block_id             - UUID of the completed block
--   p_block_weight         - Weight of the block (optional; validated against structure)
--   p_earned_score         - Score earned in the block (optional)
--   p_time_spent_seconds   - Time spent on the block in seconds (default: 0)
--   p_interaction_data     - JSONB payload of interaction metadata (optional)
--   p_last_response        - JSONB payload of final user submission (optional)
--
-- Returns:
--   JSONB object with completion status, block metadata, and next navigation targets.
-- =============================================================================

create or replace function public.complete_block(
  p_user_id uuid,
  p_published_course_id uuid,
  p_chapter_id uuid,
  p_lesson_id uuid,
  p_block_id uuid,
  p_block_weight numeric,
  p_earned_score numeric default null,
  p_time_spent_seconds integer default 0,
  p_interaction_data jsonb default null,
  p_last_response jsonb default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  organization_id uuid;
  structure_weight numeric;
  final_weight numeric;
  result jsonb;
  next_ids jsonb;
  was_already_completed boolean := false;
begin
  -- =========================================================================
  -- STEP 1: Get organization_id for this course
  -- =========================================================================
  select pc.organization_id
    into organization_id
    from public.published_courses pc
   where pc.id = p_published_course_id;

  -- Abort if course not found or not associated with an organization
  if organization_id is null then
    return jsonb_build_object('error', 'published course not found');
  end if;

  -- =========================================================================
  -- STEP 2: Validate block weight using course structure
  -- =========================================================================
  select coalesce((block_obj->>'weight')::numeric, 1.0)
    into structure_weight
    from public.published_course_structure_content pcsc,
         jsonb_path_query(
           pcsc.course_structure_content,
           '$.chapters[*].lessons[*].blocks[*] ? (@.id == $block_id)',
           jsonb_build_object('block_id', p_block_id::text)
         ) as block_obj
   where pcsc.id = p_published_course_id;

  -- Use structure weight if available; otherwise use provided or default to 1.0
  final_weight := coalesce(structure_weight, p_block_weight, 1.0);

  -- =========================================================================
  -- STEP 3: Check if the block was already marked as completed
  -- =========================================================================
  select bp.is_completed
    into was_already_completed
    from public.block_progress bp
   where bp.user_id = p_user_id
     and bp.published_course_id = p_published_course_id
     and bp.block_id = p_block_id;

  was_already_completed := coalesce(was_already_completed, false);

  -- =========================================================================
  -- STEP 4: Insert or update block progress record
  -- =========================================================================
  insert into public.block_progress (
    user_id,
    published_course_id,
    chapter_id,
    lesson_id,
    block_id,
    organization_id,
    block_weight,
    is_completed,
    completed_at,
    time_spent_seconds,
    earned_score,
    attempt_count,
    interaction_data,
    last_response
  )
  values (
    p_user_id,
    p_published_course_id,
    p_chapter_id,
    p_lesson_id,
    p_block_id,
    organization_id,
    final_weight,
    true,
    timezone('utc', now()),
    p_time_spent_seconds,
    p_earned_score,
    1,
    p_interaction_data,
    p_last_response
  )
  on conflict (user_id, published_course_id, block_id)
  do update set
    is_completed = true,
    completed_at = case
                     when block_progress.is_completed then block_progress.completed_at
                     else timezone('utc', now())
                   end,
    time_spent_seconds = block_progress.time_spent_seconds + excluded.time_spent_seconds,
    earned_score = coalesce(excluded.earned_score, block_progress.earned_score),
    attempt_count = coalesce(block_progress.attempt_count + 1, 1),
    interaction_data = coalesce(excluded.interaction_data, block_progress.interaction_data),
    last_response = coalesce(excluded.last_response, block_progress.last_response),
    block_weight = excluded.block_weight,
    updated_at = timezone('utc', now());

  -- =========================================================================
  -- STEP 5: Trigger lesson and course progress updates if newly completed
  -- =========================================================================
  if not was_already_completed then
    -- Recalculate lesson-level progress
    perform public.update_lesson_progress_for_user(
      p_user_id,
      p_published_course_id,
      p_lesson_id
    );

    -- Recalculate course-level progress
    perform public.update_course_progress_for_user(
      p_user_id,
      p_published_course_id
    );
  end if;

  -- =========================================================================
  -- STEP 6: Determine next navigation targets
  -- =========================================================================
  select public.get_next_navigation_ids(
    p_user_id,
    p_published_course_id,
    p_block_id
  )
  into next_ids;

  -- =========================================================================
  -- STEP 7: Return final status with metadata
  -- =========================================================================
  return jsonb_build_object(
    'success', true,
    'block_id', p_block_id,
    'block_weight', final_weight,
    'weight_source', case
      when structure_weight is not null then 'structure'
      else 'provided'
    end,
    'was_already_completed', was_already_completed,
    'completed_at', to_char(timezone('utc', now()), 'yyyy-mm-dd"T"hh24:mi:ss.ms"Z"'),
    'navigation', next_ids
  );
end;
$$;
