/*
  Function: get_user_lesson_blocks_progress
  Purpose : Returns progress data for a user's lesson blocks within a published course
  Params  :
    - p_course_id  : UUID of the published course
    - p_chapter_id : UUID of the chapter (unused in this function but part of signature)
    - p_lesson_id  : UUID of the lesson to fetch progress for
  Returns : JSONB object containing enriched lesson blocks and metadata for progress tracking
  Security: SECURITY INVOKER, checks column privileges explicitly
*/
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
  lesson_data jsonb;             -- Holds the extracted lesson object from published structure
  current_user_id uuid := auth.uid(); -- Authenticated user's ID
  total_blocks_count int;        -- Total number of blocks in the lesson
  result jsonb;                  -- Final JSON result to return
begin
  -- Check if the user has access to the published course structure
  if not has_column_privilege('public.published_course_structure_content', 'course_structure_content', 'SELECT') then
    raise exception 'Access denied to course content';
  end if;

  -- Extract the JSONB representation of the lesson object from the published course structure
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

  -- If lesson is not found, return an error object
  if lesson_data is null then
    return jsonb_build_object(
      'error', 'Lesson not found',
      'lesson_id', p_lesson_id
    );
  end if;

  -- Get number of blocks in the lesson
  total_blocks_count := jsonb_array_length(lesson_data->'blocks');

  with enriched_blocks as (
    select 
      block_info as block,
      (block_info->>'id')::uuid as block_id,
      pos as position,

      coalesce((block_info->'settings'->>'can_skip')::boolean, false) as can_skip,
      coalesce((block_info->'settings'->>'weight')::int, 1) as weight,
      (pos = total_blocks_count) as is_last_block,

      bp.progress_data as block_progress,
      coalesce(bp.is_completed, false) as is_completed,
      coalesce(bp.has_started, false) as has_started,
      coalesce(bp.time_spent, 0) as time_spent_seconds,
      bp.earned_score,
      bp.completed_at,

      lag(coalesce(bp.is_completed, false), 1, true) over (order by pos) as prev_completed

    from jsonb_array_elements(lesson_data->'blocks') with ordinality as blocks(block_info, pos)

    left join (
      select 
        block_id,
        jsonb_build_object(
          'id', bp.id,
          'user_id', bp.user_id,
          'block_id', bp.block_id,
          'lesson_id', bp.lesson_id,
          'chapter_id', bp.chapter_id,
          'created_at', case when bp.created_at is not null then date_trunc('milliseconds', bp.created_at at time zone 'UTC')::timestamptz else null end,
          'started_at', case when bp.started_at is not null then date_trunc('milliseconds', bp.started_at at time zone 'UTC')::timestamptz else null end,
          'updated_at', case when bp.updated_at is not null then date_trunc('milliseconds', bp.updated_at at time zone 'UTC')::timestamptz else null end,
          'completed_at', case when bp.completed_at is not null then date_trunc('milliseconds', bp.completed_at at time zone 'UTC')::timestamptz else null end,
          'earned_score', bp.earned_score,
          'is_completed', bp.is_completed,
          'attempt_count', bp.attempt_count,
          'last_response', bp.last_response,
          'organization_id', bp.organization_id,
          'interaction_data', bp.interaction_data,
          'time_spent_seconds', bp.time_spent_seconds,
          'published_course_id', bp.published_course_id
        ) as progress_data,
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

  final_blocks as (
    select 
      *,
      case 
        when position = 1 then true
        when can_skip then true
        else prev_completed
      end as is_visible,

      case 
        when has_started and not is_completed then true
        when not has_started and position = 1 then true
        when not has_started and prev_completed then true
        else false
      end as is_active
    from enriched_blocks
  ),

  aggregated_data as (
    select 
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
      case 
        when max(completed_at) is not null 
        then date_trunc('milliseconds', max(completed_at) at time zone 'UTC')::timestamptz
        else null
      end as last_completed_at,
      (sum(weight) filter (where is_completed) = sum(weight)) as is_fully_completed
    from final_blocks
  )

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
