create or replace function public.get_user_lesson_blocks_progress(
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
  lesson_data jsonb;
  current_user_id uuid := auth.uid();
  total_blocks_count int;
  result jsonb;
begin
  -- === Permission check for safety ===
  if not has_column_privilege('public.published_course_structure_content', 'course_structure_content', 'SELECT') then
    raise exception 'Access denied to course content';
  end if;

  -- === Fetch the lesson JSON (from denormalized published structure) ===
  select lesson_obj
  into lesson_data
  from public.published_course_structure_content pcs,
       jsonb_path_query(
         pcs.course_structure_content,
         '$.chapters[*].lessons[*] ? (@.id == $lesson_id)',
         jsonb_build_object('lesson_id', p_lesson_id::text)
       ) as lesson_obj
  where pcs.id = p_course_id
  limit 1;

  -- === If the lesson was not found, return an error ===
  if lesson_data is null then
    return jsonb_build_object(
      'error', 'Lesson not found',
      'lesson_id', p_lesson_id
    );
  end if;

  -- === Count total number of blocks in lesson ===
  total_blocks_count := jsonb_array_length(lesson_data->'blocks');

  -- === Enriched block data with progress ===
  with enriched_blocks as (
    select 
      -- From lesson JSON array
      block_info as block,
      (block_info->>'id')::uuid as block_id,
      pos as position,

      -- Extract block-specific settings
      coalesce((block_info->'settings'->>'can_skip')::boolean, false) as can_skip,
      coalesce((block_info->'settings'->>'weight')::int, 1) as weight,
      (pos = total_blocks_count) as is_last_block,

      -- Progress information from block_progress table
      coalesce(bp.progress_data, '{}'::jsonb) as block_progress,
      coalesce(bp.is_completed, false) as is_completed,
      coalesce(bp.has_started, false) as has_started,

      -- For metrics
      coalesce(bp.time_spent, 0) as time_spent_seconds,
      bp.earned_score,
      bp.completed_at,

      -- For visibility logic
      lag(coalesce(bp.is_completed, false), 1, true) over (order by pos) as prev_completed

    from jsonb_array_elements(lesson_data->'blocks') with ordinality as blocks(block_info, pos)

    left join (
      -- Inline progress records for this lesson and user
      select 
        block_id,
        to_jsonb(bp.*) as progress_data,
        is_completed,
        started_at is not null as has_started,
        coalesce(time_spent_seconds, 0) as time_spent,
        earned_score,
        completed_at
      from public.block_progress bp
      where bp.user_id = current_user_id 
        and bp.published_course_id = p_course_id
        and bp.lesson_id = p_lesson_id
    ) bp on bp.block_id = (block_info->>'id')::uuid
  ),

  -- === Determine block visibility and active status ===
  final_blocks as (
    select 
      *,
      -- Determine whether the block is currently visible
      case 
        when position = 1 then true -- First block always visible
        when can_skip then true     -- Can skip overrides progression
        else prev_completed         -- Otherwise, check if previous block was completed
      end as is_visible,

      -- Determine whether the block is the currently "active" one
      case 
        when has_started and not is_completed then true
        when not has_started and position = 1 then true
        when not has_started and prev_completed then true
        else false
      end as is_active
    from enriched_blocks
  ),

  -- === Aggregate metrics and build response ===
  aggregated_data as (
    select 
      -- Reconstruct the full block list for output
      jsonb_agg(
        jsonb_build_object(
          'block', block,
          'block_progress', block_progress,
          'is_visible', is_visible,
          'is_last_block', is_last_block,
          'is_active', is_active
        )
        order by position
      ) as blocks,

      -- Metadata: lesson-level summaries
      count(*) as total_blocks,
      sum(weight) as total_weight,
      sum(weight) filter (where is_completed) as completed_weight,
      count(*) filter (where is_visible) as visible_blocks,
      count(*) filter (where is_completed) as completed_blocks,
      count(*) filter (where is_visible and not is_completed) as available_blocks,
      count(*) filter (where not is_visible) as locked_blocks,
      count(*) filter (where is_active) as active_blocks,
      (array_agg(block_id order by position) filter (where is_active))[1] as active_block_id,
      sum(time_spent_seconds) as total_time_spent,
      avg(earned_score) as average_score,
      max(completed_at) as last_completed_at,
      (sum(weight) filter (where is_completed) = sum(weight)) as is_fully_completed
    from final_blocks
  )

  -- === Build final JSON response ===
  select jsonb_build_object(
    'blocks', blocks,
    'metadata', jsonb_build_object(
      'total_blocks', total_blocks,
      'visible_blocks', visible_blocks,
      'completed_blocks', completed_blocks,
      'available_blocks', available_blocks,
      'locked_blocks', locked_blocks,
      'active_block_id', active_block_id,
      'total_time_spent', total_time_spent,
      'average_score', round(average_score, 2),
      'last_completed_at', last_completed_at,
      'is_fully_completed', is_fully_completed,
      'completion_percentage', case 
        when total_weight > 0 and completed_weight > 0 
          then round(completed_weight * 100.0 / total_weight, 1)
        else 0
      end
    )
  )
  into result
  from aggregated_data;

  return result;
end;
$$;
