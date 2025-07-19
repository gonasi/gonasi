-- ========================================================================
-- FUNCTION: get_published_lesson_blocks_with_progress
-- DESCRIPTION: 
--   Returns a single lesson with its associated blocks and per-user progress
--   augmented with calculated lesson-level progress stats.
--   
-- ACCESS CONTROL:
--   - Caller must have explicit column-level SELECT access to course content.
--   - Progress data is scoped to the current authenticated user.
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
  result jsonb;                 -- Final JSON response
  lesson_data jsonb;            -- Raw lesson data (structure only)
  blocks_with_progress jsonb;   -- Blocks augmented with per-user progress
  current_user_id uuid := (select auth.uid());  -- Current user (from JWT/session)
begin
  -- ----------------------------------------------------------------------
  -- SAFETY: Prevent access unless user has column-level read permissions
  -- ----------------------------------------------------------------------
  if not has_column_privilege(
    'public.published_course_structure_content',
    'course_structure_content',
    'SELECT'
  ) then
    raise exception 'Access denied to course content';
  end if;

  -- ----------------------------------------------------------------------
  -- STEP 1: Extract the lesson JSON from the published course structure
  -- ----------------------------------------------------------------------
  select jsonb_build_object(
    'id', l->>'id',
    'course_id', l->>'course_id',
    'chapter_id', l->>'chapter_id',
    'lesson_type_id', l->>'lesson_type_id',
    'name', l->>'name',
    'position', (l->>'position')::int,
    'settings', l->'settings',
    'lesson_types', l->'lesson_types',
    'total_blocks', (l->>'total_blocks')::int,
    'blocks', l->'blocks'
  )
  into lesson_data
  from public.published_course_structure_content pcs,
  lateral (
    select l
    from
      jsonb_array_elements(pcs.course_structure_content->'chapters') as c
      join lateral jsonb_array_elements(c->'lessons') as l
        on (c->>'id')::uuid = p_chapter_id
    where (l->>'id')::uuid = p_lesson_id
  ) as result
  where pcs.id = p_course_id;

  -- If lesson not found, return null
  if lesson_data is null then
    return null;
  end if;

  -- ----------------------------------------------------------------------
  -- STEP 2: Enhance each block with user's progress data from block_progress
  -- ----------------------------------------------------------------------
  select jsonb_agg(
    jsonb_build_object(
      'id', block_info->>'id',
      'lesson_id', block_info->>'lesson_id',
      'chapter_id', block_info->>'chapter_id',
      'name', block_info->>'name',
      'position', (block_info->>'position')::int,
      'block_type', block_info->>'block_type',
      'plugin_type', block_info->>'plugin_type',
      'content', block_info->'content',
      'settings', block_info->'settings',
      'progress', case 
        when bp.id is not null then jsonb_build_object(
          'is_completed', bp.is_completed,
          'started_at', bp.started_at,
          'completed_at', bp.completed_at,
          'time_spent_seconds', bp.time_spent_seconds,
          'score', bp.score,
          'attempts', bp.attempts,
          'state', bp.state,
          'last_response', bp.last_response,
          'feedback', bp.feedback
        )
        else jsonb_build_object(
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
      end
    )
    order by (block_info->>'position')::int
  )
  into blocks_with_progress
  from jsonb_array_elements(lesson_data->'blocks') as block_info
  left join public.block_progress bp 
    on bp.user_id = current_user_id 
    and bp.published_course_id = p_course_id 
    and bp.block_id = (block_info->>'id')::uuid;

  -- ----------------------------------------------------------------------
  -- STEP 3: Build final result: lesson + enhanced blocks + progress metrics
  -- ----------------------------------------------------------------------
  result := jsonb_build_object(
    -- Basic lesson fields
    'id', lesson_data->>'id',
    'course_id', lesson_data->>'course_id',
    'chapter_id', lesson_data->>'chapter_id',
    'lesson_type_id', lesson_data->>'lesson_type_id',
    'name', lesson_data->>'name',
    'position', lesson_data->'position',
    'settings', lesson_data->'settings',
    'lesson_types', lesson_data->'lesson_types',
    'total_blocks', lesson_data->'total_blocks',
    'blocks', blocks_with_progress,

    -- Aggregated lesson-level progress
    'lesson_progress', jsonb_build_object(
      'total_blocks', lesson_data->'total_blocks',
      'completed_blocks', (
        select count(*)
        from jsonb_array_elements(blocks_with_progress) as block
        where (block->'progress'->>'is_completed')::boolean = true
      ),
      'completion_percentage', round(
        (
          select count(*)::numeric
          from jsonb_array_elements(blocks_with_progress) as block
          where (block->'progress'->>'is_completed')::boolean = true
        ) * 100.0 / (lesson_data->>'total_blocks')::numeric,
        2
      ),
      'is_fully_completed', (
        select count(*)
        from jsonb_array_elements(blocks_with_progress) as block
        where (block->'progress'->>'is_completed')::boolean = true
      ) = (lesson_data->>'total_blocks')::int,
      'total_time_spent', (
        select coalesce(sum((block->'progress'->>'time_spent_seconds')::int), 0)
        from jsonb_array_elements(blocks_with_progress) as block
        where block->'progress'->>'time_spent_seconds' is not null
      ),
      'average_score', (
        select round(avg((block->'progress'->>'score')::numeric), 2)
        from jsonb_array_elements(blocks_with_progress) as block
        where block->'progress'->>'score' is not null
      ),
      'last_completed_at', (
        select max((block->'progress'->>'completed_at')::timestamptz)
        from jsonb_array_elements(blocks_with_progress) as block
        where block->'progress'->>'completed_at' is not null
      ),
      'next_incomplete_block_id', (
        select block->>'id'
        from jsonb_array_elements(blocks_with_progress) as block
        where (block->'progress'->>'is_completed')::boolean = false
        order by (block->>'position')::int
        limit 1
      ),
      'suggested_next_block_id', case
        when (
          select count(*)
          from jsonb_array_elements(blocks_with_progress) as block
          where (block->'progress'->>'is_completed')::boolean = true
        ) = (lesson_data->>'total_blocks')::int
        then (
          -- All blocks completed → suggest first block for review
          select block->>'id'
          from jsonb_array_elements(blocks_with_progress) as block
          order by (block->>'position')::int
          limit 1
        )
        else (
          -- Some blocks incomplete → suggest next incomplete one
          select block->>'id'
          from jsonb_array_elements(blocks_with_progress) as block
          where (block->'progress'->>'is_completed')::boolean = false
          order by (block->>'position')::int
          limit 1
        )
      end
    )
  );

  return result;
end;
$$;
