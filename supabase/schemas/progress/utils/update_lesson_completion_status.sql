-- ========================================================================
-- FUNCTION: update_lesson_completion_status
-- DESCRIPTION:
--   - Checks how many lesson blocks the current user has completed.
--   - Updates or inserts a row in the `lesson_progress` table accordingly.
--   - Optionally triggers course progress update if the lesson is fully completed.
--
-- NOTES:
--   - A block is "required" if `requires_completion` is true or missing (default true).
--   - Completion is determined by the number of completed required blocks.
-- ========================================================================
create or replace function public.update_lesson_completion_status(
  p_course_id uuid,
  p_lesson_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());  -- Authenticated user
  lesson_data jsonb;                            -- JSON structure of the lesson
  total_blocks int;                             -- Total number of blocks
  completed_blocks int;                         -- Number of completed blocks
  required_blocks int;                          -- Number of blocks required for lesson completion
  lesson_completed boolean := false;            -- Whether the lesson is considered completed
  result jsonb;                                 -- Final result to return
begin
  -- ============================================================
  -- STEP 1: Fetch the lesson's JSON structure using JSONPath
  -- ============================================================
  select lesson_obj into lesson_data
  from public.published_course_structure_content pcs,
  lateral (
    select lesson_obj
    from jsonb_path_query(
      pcs.course_structure_content,
      '$.chapters[*].lessons[*] ? (@.id == $lesson_id)',
      jsonb_build_object('lesson_id', p_lesson_id::text)
    ) as lesson_obj
  ) as extracted_lesson
  where pcs.id = p_course_id;

  -- Return early if lesson not found
  if lesson_data is null then
    return jsonb_build_object('error', 'Lesson not found');
  end if;

  -- ============================================================
  -- STEP 2: Compute block completion statistics
  -- ============================================================
  with block_stats as (
    select 
      -- Total number of blocks in the lesson
      count(*) as total,

      -- Required blocks (default to true if requires_completion is missing)
      count(*) filter (
        where coalesce((block->'settings'->>'requires_completion')::boolean, true) = true
      ) as required,

      -- Number of completed blocks by the user
      (
        select count(*)
        from public.block_progress bp
        where bp.user_id = current_user_id
          and bp.published_course_id = p_course_id
          and bp.lesson_id = p_lesson_id
          and bp.is_completed = true
      ) as completed
    from jsonb_array_elements(lesson_data->'blocks') as block
  )
  select total, required, completed, (completed >= required)
  into total_blocks, required_blocks, completed_blocks, lesson_completed
  from block_stats;

  -- ============================================================
  -- STEP 3: Upsert into `lesson_progress` with updated status
  -- ============================================================
  insert into public.lesson_progress (
    user_id, published_course_id, lesson_id,
    total_blocks, completed_blocks, completed_at
  )
  values (
    current_user_id, p_course_id, p_lesson_id,
    total_blocks, completed_blocks,
    case when lesson_completed then now() else null end
  )
  on conflict (user_id, published_course_id, lesson_id)
  do update set
    total_blocks = excluded.total_blocks,
    completed_blocks = excluded.completed_blocks,
    completed_at = case 
      -- If just completed, set timestamp
      when excluded.completed_blocks >= required_blocks and lesson_progress.completed_at is null
      then now()

      -- If progress fell below required threshold, reset timestamp
      when excluded.completed_blocks < required_blocks
      then null

      -- Otherwise retain existing timestamp
      else lesson_progress.completed_at
    end,
    updated_at = now();  -- Always refresh updated_at timestamp

  -- ============================================================
  -- STEP 4: Trigger course completion update if necessary
  -- ============================================================
  if lesson_completed then
    perform public.update_course_completion_status(p_course_id);
  end if;

  -- ============================================================
  -- STEP 5: Return a summary JSON object to the caller
  -- ============================================================
  return jsonb_build_object(
    'lesson_id', p_lesson_id,
    'is_completed', lesson_completed,
    'completed_blocks', completed_blocks,
    'required_blocks', required_blocks,
    'total_blocks', total_blocks,
    'completion_percentage', round(completed_blocks * 100.0 / greatest(required_blocks, 1), 2)
  );
end;
$$;
