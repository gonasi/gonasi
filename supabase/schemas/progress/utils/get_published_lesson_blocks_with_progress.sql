-- ========================================================================
-- FUNCTION: get_published_lesson_blocks_with_progress
-- DESCRIPTION: 
--   Returns a single lesson with its associated blocks and per-user progress,
--   augmented with calculated lesson-level progress statistics.
--
-- ACCESS CONTROL:
--   - Caller must have SELECT privilege on course content column.
--   - Progress data is scoped to the currently authenticated user.
-- ========================================================================
create or replace function public.get_published_lesson_blocks_with_progress(
  p_course_id uuid,
  p_chapter_id uuid,
  p_lesson_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  result jsonb;                 -- Final result JSON combining lesson + blocks + stats
  lesson_data jsonb;            -- Single lesson data extracted from nested JSON
  blocks_with_progress jsonb;   -- List of blocks with per-user progress data
  current_user_id uuid := (select auth.uid()); -- Authenticated user ID from Supabase JWT
begin
  -- ----------------------------------------------------------------------
  -- ACCESS CHECK: Ensure caller can SELECT course content column
  -- ----------------------------------------------------------------------
  if not has_column_privilege(
    'public.published_course_structure_content',
    'course_structure_content',
    'SELECT'
  ) then
    raise exception 'Access denied to course content';
  end if;

  -- ----------------------------------------------------------------------
  -- STEP 1: Extract the specific lesson object from deeply nested JSONB
  -- ----------------------------------------------------------------------
  select lesson_obj
  into lesson_data
  from public.published_course_structure_content pcs,
  lateral (
    select lesson_obj
    from jsonb_path_query(
      pcs.course_structure_content,
      '$.chapters[*].lessons[*] ? (@.id == $lesson_id)',  -- Search for lesson by ID
      jsonb_build_object('lesson_id', p_lesson_id::text) -- Bind parameter
    ) as lesson_obj
  ) as extracted_lesson
  where pcs.id = p_course_id;

  -- Exit early if lesson was not found
  if lesson_data is null then
    return null;
  end if;

  -- ----------------------------------------------------------------------
  -- STEP 2: Collect all blocks and their progress for this lesson
  -- ----------------------------------------------------------------------
  with lesson_blocks as (
    -- Unnest lesson blocks from JSONB and assign UUIDs
    select 
      block_info,
      (block_info->>'id')::uuid as block_id
    from jsonb_array_elements(lesson_data->'blocks') as block_info
  ),
  progress_data as (
    -- Collect all user progress rows for those blocks in a single query
    select 
      bp.block_id,
      jsonb_build_object(
        'is_completed', bp.is_completed,
        'started_at', bp.started_at,
        'completed_at', bp.completed_at,
        'time_spent_seconds', bp.time_spent_seconds,
        'score', bp.score,
        'attempts', bp.attempts,
        'state', bp.state,
        'last_response', bp.last_response,
        'feedback', bp.feedback
      ) as progress_obj
    from public.block_progress bp
    where bp.user_id = current_user_id 
      and bp.published_course_id = p_course_id
      and bp.block_id in (
        -- Get only block_ids from the current lesson
        select (jsonb_array_elements(lesson_data->'blocks')->>'id')::uuid
      )
  )
  -- Combine blocks and their progress into one JSON array
  select jsonb_agg(
    lb.block_info ||  -- Original block info
    jsonb_build_object(
      'progress', coalesce(
        pd.progress_obj, -- Merge user progress if available
        -- Fallback progress object (for unseen blocks)
        jsonb_build_object(
          'is_completed', false,
          'started_at', null,
          'completed_at', null,
          'time_spent_seconds', null,
          'score', null,
          'attempts', 0,
          'state', null,
          'last_response', null,
          'feedback', null
        )
      )
    )
    order by (lb.block_info->>'position')::int -- Sort blocks by position
  )
  into blocks_with_progress
  from lesson_blocks lb
  left join progress_data pd on pd.block_id = lb.block_id;

  -- ----------------------------------------------------------------------
  -- STEP 3: Compute lesson-level progress metrics
  -- ----------------------------------------------------------------------
  with progress_stats as (
    select 
      count(*) as total_blocks,
      count(*) filter (where (block->'progress'->>'is_completed')::boolean = true) as completed_blocks,
      coalesce(sum((block->'progress'->>'time_spent_seconds')::int) filter (where block->'progress'->>'time_spent_seconds' is not null), 0) as total_time_spent,
      avg((block->'progress'->>'score')::numeric) filter (where block->'progress'->>'score' is not null) as average_score,
      max((block->'progress'->>'completed_at')::timestamptz) filter (where block->'progress'->>'completed_at' is not null) as last_completed_at,
      -- Find the first incomplete block by position
      (array_agg(block->>'id' order by (block->>'position')::int) filter (where (block->'progress'->>'is_completed')::boolean = false))[1] as next_incomplete_block_id,
      -- Find the first block (always useful as fallback)
      (array_agg(block->>'id' order by (block->>'position')::int))[1] as first_block_id
    from jsonb_array_elements(blocks_with_progress) as block
  )
  -- Merge everything into one final JSON result
  select 
    lesson_data || 
    jsonb_build_object(
      'blocks', blocks_with_progress,
      'lesson_progress', jsonb_build_object(
        'total_blocks', ps.total_blocks,
        'completed_blocks', ps.completed_blocks,
        'completion_percentage', case 
          when ps.total_blocks > 0 then round(ps.completed_blocks * 100.0 / ps.total_blocks, 2)
          else 0 
        end,
        'is_fully_completed', ps.completed_blocks = ps.total_blocks,
        'total_time_spent', ps.total_time_spent,
        'average_score', round(ps.average_score, 2),
        'last_completed_at', ps.last_completed_at,
        'next_incomplete_block_id', ps.next_incomplete_block_id,
        -- Suggest next block (fallback to first if all complete)
        'suggested_next_block_id', case
          when ps.completed_blocks = ps.total_blocks then ps.first_block_id
          else ps.next_incomplete_block_id
        end
      )
    )
  into result
  from progress_stats ps;

  return result;
end;
$$;
