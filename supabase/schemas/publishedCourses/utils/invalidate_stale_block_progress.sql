-- ====================================================================================
-- FUNCTION: invalidate_stale_block_progress
-- PURPOSE: Invalidates block progress for blocks that have changed between versions
--          and triggers recalculation of parent progress (lesson, chapter, course)
-- ====================================================================================
create or replace function public.invalidate_stale_block_progress(
  p_published_course_id uuid,
  p_changed_blocks jsonb
)
returns table (
  invalidated_count integer,
  affected_users uuid[],
  affected_lessons uuid[],
  recalculated_lessons integer,
  recalculated_chapters integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invalidated_count integer := 0;
  v_affected_users uuid[];
  v_affected_lessons uuid[];
  v_recalculated_lessons integer := 0;
  v_recalculated_chapters integer := 0;
  v_user_id uuid;
  v_lesson_id uuid;
  v_chapter_id uuid;
begin
  -- ============================================================================
  -- STEP 1: Collect affected users and lessons before deletion
  -- ============================================================================
  select
    array_agg(distinct bp.user_id),
    array_agg(distinct bp.lesson_id)
  into v_affected_users, v_affected_lessons
  from public.block_progress bp
  where bp.published_course_id = p_published_course_id
    and bp.block_id in (
      select (block->>'block_id')::uuid
      from jsonb_array_elements(p_changed_blocks) as block
    );

  -- If no progress to invalidate, return early
  if v_affected_users is null then
    return query select 0, '{}'::uuid[], '{}'::uuid[], 0, 0;
    return;
  end if;

  -- ============================================================================
  -- STEP 2: Delete block_progress for changed blocks
  -- ============================================================================
  with deleted_rows as (
    delete from public.block_progress
    where published_course_id = p_published_course_id
      and block_id in (
        select (block->>'block_id')::uuid
        from jsonb_array_elements(p_changed_blocks) as block
      )
    returning *
  )
  select count(*)::integer
  into v_invalidated_count
  from deleted_rows;

  -- ============================================================================
  -- STEP 3: Recalculate lesson progress for all affected user-lesson combinations
  -- ============================================================================
  -- For each unique combination of user and lesson that had progress deleted,
  -- recalculate the lesson progress
  for v_user_id, v_lesson_id in
    select distinct unnest(v_affected_users), unnest(v_affected_lessons)
  loop
    -- Call the existing lesson progress update function
    perform public.update_lesson_progress_for_user(
      v_user_id,
      p_published_course_id,
      v_lesson_id
    );

    v_recalculated_lessons := v_recalculated_lessons + 1;
  end loop;

  -- ============================================================================
  -- STEP 4: Recalculate chapter progress for affected chapters
  -- ============================================================================
  -- Get unique chapters from the affected lessons
  with affected_chapters as (
    select distinct
      (block->>'chapter_id')::uuid as chapter_id
    from jsonb_array_elements(p_changed_blocks) as block
    where (block->>'chapter_id')::uuid is not null
  )
  select count(distinct chapter_id)::integer
  into v_recalculated_chapters
  from affected_chapters;

  -- Recalculate chapter progress for each affected user-chapter combination
  for v_user_id, v_chapter_id in
    select distinct
      u.user_id,
      (block->>'chapter_id')::uuid as chapter_id
    from jsonb_array_elements(p_changed_blocks) as block
    cross join unnest(v_affected_users) as u(user_id)
    where (block->>'chapter_id')::uuid is not null
  loop
    -- Call the existing chapter progress update function
    perform public.update_chapter_progress_for_user(
      v_user_id,
      p_published_course_id,
      v_chapter_id
    );
  end loop;

  -- ============================================================================
  -- STEP 5: Recalculate course progress for all affected users
  -- ============================================================================
  -- The chapter progress update should trigger course progress update,
  -- but we can call it explicitly to ensure consistency
  for v_user_id in
    select distinct unnest(v_affected_users)
  loop
    perform public.update_course_progress_for_user(
      v_user_id,
      p_published_course_id
    );
  end loop;

  -- ============================================================================
  -- STEP 6: Return summary statistics
  -- ============================================================================
  return query select
    v_invalidated_count,
    coalesce(v_affected_users, '{}'::uuid[]),
    coalesce(v_affected_lessons, '{}'::uuid[]),
    v_recalculated_lessons,
    v_recalculated_chapters;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.invalidate_stale_block_progress(uuid, jsonb) to authenticated;

-- Add comment for documentation
comment on function public.invalidate_stale_block_progress(uuid, jsonb) is
  'Invalidates block progress for changed blocks and recalculates parent progress (lesson, chapter, course). Takes a JSONB array of changed blocks with their IDs and metadata.';
