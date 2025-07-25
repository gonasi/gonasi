-- =============================================================================
-- FUNCTION: complete_block
-- =============================================================================
-- Description:
-- Marks a block as completed for the authenticated user and updates progress metadata.
-- Performs the following:
--   1. Validates the block weight from the course structure.
--   2. Ensures all cascading progress records exist (course -> chapter -> lesson).
--   3. Inserts or updates block progress with proper lesson_progress_id reference.
--   4. Triggers lesson, chapter, and course progress updates.
--   5. Returns navigation metadata for next content using unified navigation system.
--
-- Parameters:
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
--   JSONB object with completion status, block metadata, progress record IDs, and unified navigation data.
-- =============================================================================

create or replace function public.complete_block(
  p_published_course_id uuid,
  p_chapter_id uuid,
  p_lesson_id uuid,
  p_block_id uuid,
  p_block_weight numeric default null,
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
  current_user_id uuid;
  organization_id uuid;
  structure_weight numeric;
  final_weight numeric;
  result jsonb;
  unified_navigation jsonb;
  was_already_completed boolean := false;
  
  -- Progress record IDs for cascading relationships
  v_course_progress_id uuid;
  v_chapter_progress_id uuid;
  v_lesson_progress_id uuid;
  
  -- Course structure data for validation and initialization
  v_course_structure jsonb;
  v_total_chapters integer;
  v_total_lessons integer;
  v_total_blocks integer;
  v_total_course_weight numeric;
  v_total_lesson_weight numeric;
  
  -- Chapter structure data
  v_chapter_lessons integer;
  v_chapter_blocks integer;
  v_chapter_weight numeric;
  v_chapter_lesson_weight numeric;
  
  -- Lesson structure data
  v_lesson_blocks integer;
  v_lesson_weight numeric;
begin
  -- =========================================================================
  -- STEP 1: Get current authenticated user ID
  -- =========================================================================
  current_user_id := (select auth.uid());
  
  -- Abort if no authenticated user
  if current_user_id is null then
    return jsonb_build_object('error', 'user not authenticated');
  end if;

  -- =========================================================================
  -- STEP 2: Get organization_id and course structure for this course
  -- =========================================================================
  select pc.organization_id, pcsc.course_structure_content
    into organization_id, v_course_structure
    from public.published_courses pc
    left join public.published_course_structure_content pcsc on pcsc.id = pc.id
    where pc.id = p_published_course_id;

  -- Abort if course not found or not associated with an organization
  if organization_id is null then
    return jsonb_build_object('error', 'published course not found');
  end if;

  -- =========================================================================
  -- STEP 3: Validate block weight and extract structure metadata
  -- =========================================================================
  select coalesce((block_obj->>'weight')::numeric, 1.0)
    into structure_weight
    from jsonb_path_query(
      v_course_structure,
      '$.chapters[*].lessons[*].blocks[*] ? (@.id == $block_id)',
      jsonb_build_object('block_id', p_block_id::text)
    ) as block_obj;

  -- Use structure weight if available; otherwise use provided or default to 1.0
  final_weight := coalesce(structure_weight, p_block_weight, 1.0);

  -- Extract course-level totals from structure
  select 
    jsonb_array_length(v_course_structure->'chapters'),
    (select count(*)::integer from jsonb_path_query(v_course_structure, '$.chapters[*].lessons[*]')),
    (select count(*)::integer from jsonb_path_query(v_course_structure, '$.chapters[*].lessons[*].blocks[*]')),
    coalesce((select sum((block_obj->>'weight')::numeric) from jsonb_path_query(v_course_structure, '$.chapters[*].lessons[*].blocks[*]') as block_obj), 0),
    coalesce((select sum((lesson_obj->>'weight')::numeric) from jsonb_path_query(v_course_structure, '$.chapters[*].lessons[*]') as lesson_obj), 0)
  into v_total_chapters, v_total_lessons, v_total_blocks, v_total_course_weight, v_total_lesson_weight;

  -- Extract chapter-level totals
  select 
    jsonb_array_length(chapter_obj->'lessons'),
    (select count(*)::integer from jsonb_path_query(chapter_obj, '$.lessons[*].blocks[*]')),
    coalesce((select sum((block_obj->>'weight')::numeric) from jsonb_path_query(chapter_obj, '$.lessons[*].blocks[*]') as block_obj), 0),
    coalesce((select sum((lesson_obj->>'weight')::numeric) from jsonb_path_query(chapter_obj, '$.lessons[*]') as lesson_obj), 0)
  into v_chapter_lessons, v_chapter_blocks, v_chapter_weight, v_chapter_lesson_weight
  from jsonb_path_query(
    v_course_structure,
    '$.chapters[*] ? (@.id == $chapter_id)',
    jsonb_build_object('chapter_id', p_chapter_id::text)
  ) as chapter_obj;

  -- Extract lesson-level totals
  select 
    jsonb_array_length(lesson_obj->'blocks'),
    coalesce((select sum((block_obj->>'weight')::numeric) from jsonb_path_query(lesson_obj, '$.blocks[*]') as block_obj), 0)
  into v_lesson_blocks, v_lesson_weight
  from jsonb_path_query(
    v_course_structure,
    '$.chapters[*].lessons[*] ? (@.id == $lesson_id)',
    jsonb_build_object('lesson_id', p_lesson_id::text)
  ) as lesson_obj;

  -- =========================================================================
  -- STEP 4: Ensure course progress record exists
  -- =========================================================================
  v_course_progress_id := null;
  insert into public.course_progress (
    user_id,
    published_course_id,
    total_blocks,
    total_lessons,
    total_chapters,
    total_weight,
    total_lesson_weight
  )
  values (
    current_user_id,
    p_published_course_id,
    v_total_blocks,
    v_total_lessons,
    v_total_chapters,
    v_total_course_weight,
    v_total_lesson_weight
  )
  on conflict (user_id, published_course_id)
  do nothing
  returning id into v_course_progress_id;

  if v_course_progress_id is null then
    select id into v_course_progress_id
    from public.course_progress
    where user_id = current_user_id
      and published_course_id = p_published_course_id;
  end if;

  if v_course_progress_id is null then
    return jsonb_build_object('error', 'Could not create or find course_progress');
  end if;

  -- =========================================================================
  -- STEP 5: Ensure chapter progress record exists
  -- =========================================================================
  v_chapter_progress_id := null;
  insert into public.chapter_progress (
    course_progress_id,
    user_id,
    published_course_id,
    chapter_id,
    total_lessons,
    total_blocks,
    total_weight,
    total_lesson_weight
  )
  values (
    v_course_progress_id,
    current_user_id,
    p_published_course_id,
    p_chapter_id,
    v_chapter_lessons,
    v_chapter_blocks,
    v_chapter_weight,
    v_chapter_lesson_weight
  )
  on conflict (user_id, published_course_id, chapter_id)
  do nothing
  returning id into v_chapter_progress_id;

  if v_chapter_progress_id is null then
    select id into v_chapter_progress_id
    from public.chapter_progress
    where user_id = current_user_id
      and published_course_id = p_published_course_id
      and chapter_id = p_chapter_id;
  end if;

  if v_chapter_progress_id is null then
    return jsonb_build_object('error', 'Could not create or find chapter_progress');
  end if;

  -- =========================================================================
  -- STEP 6: Ensure lesson progress record exists
  -- =========================================================================
  v_lesson_progress_id := null;
  insert into public.lesson_progress (
    chapter_progress_id,
    user_id,
    published_course_id,
    lesson_id,
    total_blocks,
    total_weight
  )
  values (
    v_chapter_progress_id,
    current_user_id,
    p_published_course_id,
    p_lesson_id,
    v_lesson_blocks,
    v_lesson_weight
  )
  on conflict (user_id, published_course_id, lesson_id)
  do nothing
  returning id into v_lesson_progress_id;

  if v_lesson_progress_id is null then
    select id into v_lesson_progress_id
    from public.lesson_progress
    where user_id = current_user_id
      and published_course_id = p_published_course_id
      and lesson_id = p_lesson_id;
  end if;

  if v_lesson_progress_id is null then
    return jsonb_build_object('error', 'Could not create or find lesson_progress');
  end if;

  -- =========================================================================
  -- STEP 7: Check if the block was already marked as completed
  -- =========================================================================
  select bp.is_completed
    into was_already_completed
    from public.block_progress bp
    where bp.user_id = current_user_id
      and bp.published_course_id = p_published_course_id
      and bp.block_id = p_block_id;

  was_already_completed := coalesce(was_already_completed, false);

  -- =========================================================================
  -- STEP 8: Insert or update block progress record with lesson_progress_id
  -- =========================================================================
  insert into public.block_progress (
    lesson_progress_id,
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
    v_lesson_progress_id,
    current_user_id,
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
    lesson_progress_id = excluded.lesson_progress_id,
    updated_at = timezone('utc', now());

  -- =========================================================================
  -- STEP 9: Trigger lesson, chapter, and course progress updates if newly completed
  -- =========================================================================
  if not was_already_completed then
    begin
      -- Recalculate lesson-level progress
      perform public.update_lesson_progress_for_user(
        current_user_id,
        p_published_course_id,
        p_lesson_id
      );
    exception when others then
      return jsonb_build_object('error', 'Failed to update lesson progress for user', 'details', sqlerrm);
    end;

    begin
      -- Recalculate chapter-level progress
      perform public.update_chapter_progress_for_user(
        current_user_id,
        p_published_course_id,
        p_chapter_id
      );
    exception when others then
      return jsonb_build_object('error', 'Failed to update chapter progress for user');
    end;

    begin
      -- Recalculate course-level progress
      perform public.update_course_progress_for_user(
        current_user_id,
        p_published_course_id
      );
    exception when others then
      return jsonb_build_object('error', 'Failed to update course progress for user');
    end;
  end if;

  -- =========================================================================
  -- STEP 10: Get unified navigation data using the new navigation system
  -- =========================================================================
  select public.get_unified_navigation(
    current_user_id,
    p_published_course_id,
    p_block_id,
    p_lesson_id,
    p_chapter_id
  )
  into unified_navigation;

  -- =========================================================================
  -- STEP 11: Return final status with metadata, progress IDs, and enhanced navigation
  -- =========================================================================
  return jsonb_build_object(
    'success', true,
    'user_id', current_user_id,
    'block_id', p_block_id,
    'lesson_id', p_lesson_id,
    'chapter_id', p_chapter_id,
    'block_weight', final_weight,
    'weight_source', case
      when structure_weight is not null then 'structure'
      else 'provided'
    end,
    'was_already_completed', was_already_completed,
    'completed_at', date_trunc('second', timezone('utc', now()))::timestamptz,
    'lesson_progress_id', v_lesson_progress_id,
    'chapter_progress_id', v_chapter_progress_id,
    'course_progress_id', v_course_progress_id,
    'navigation', unified_navigation
  );
end;
$$;