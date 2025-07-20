-- =============================================================================
-- FUNCTION: get_published_lesson_blocks_with_progressive_reveal
-- DESCRIPTION: 
--   Returns a single lesson with intelligent block visibility and progression.
--   Supports Brilliant.org-style "progressive reveal" where blocks unlock based
--   on user progress. Supports different reveal strategies: 'progressive', 
--   'all', and 'linear'. Computes lesson-level metrics and weighted progress.
--
-- PARAMETERS:
--   p_course_id   - ID of the published course
--   p_chapter_id  - ID of the chapter (currently unused but may be useful)
--   p_lesson_id   - ID of the lesson to fetch
--   p_reveal_mode - Optional override for reveal strategy
--
-- SECURITY: Uses `auth.uid()` and enforces column-level access via RLS
-- =============================================================================
create or replace function public.get_published_lesson_blocks_with_progressive_reveal(
  p_course_id uuid,
  p_chapter_id uuid,
  p_lesson_id uuid,
  p_reveal_mode text default 'progressive'
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  result jsonb;
  lesson_data jsonb;
  blocks_with_reveal jsonb;
  current_user_id uuid := (select auth.uid());
  lesson_settings jsonb;
  reveal_strategy text;
begin
  if not has_column_privilege('public.published_course_structure_content', 'course_structure_content', 'SELECT') then
    raise exception 'Access denied to course content';
  end if;

  select lesson_obj
  into lesson_data
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

  if lesson_data is null then
    return jsonb_build_object(
      'error', 'Lesson not found',
      'lesson_id', p_lesson_id
    );
  end if;

  lesson_settings := lesson_data->'settings';
  reveal_strategy := coalesce(lesson_settings->>'reveal_strategy', p_reveal_mode);

  with
  lesson_blocks as (
    select 
      block_info,
      (block_info->>'id')::uuid as block_id,
      (block_info->>'position')::int as position,
      block_info->>'plugin_type' as plugin_type,
      coalesce((block_info->'settings'->>'requires_completion')::boolean, true) as requires_completion,
      coalesce((block_info->'settings'->>'can_skip')::boolean, false) as can_skip,
      coalesce((block_info->'settings'->>'weight')::int, 1) as weight
    from jsonb_array_elements(lesson_data->'blocks') as block_info
  ),

  progress_data as (
    select 
      bp.block_id,
      bp.is_completed,
      bp.started_at,
      bp.completed_at,
      bp.time_spent_seconds,
      bp.score,
      bp.attempts,
      bp.state,
      bp.last_response,
      bp.feedback,
      case 
        when bp.score >= 0.8 then 'excellent'
        when bp.score >= 0.6 then 'good'
        when bp.score >= 0.4 then 'fair'
        when bp.score is not null then 'needs_improvement'
        else null
      end as completion_quality,
      bp.completed_at > (now() - interval '1 hour') as recently_completed
    from public.block_progress bp
    where bp.user_id = current_user_id 
      and bp.published_course_id = p_course_id
      and bp.lesson_id = p_lesson_id
  ),

  blocks_with_visibility as (
    select 
      lb.*,
      pd.is_completed,
      pd.started_at,
      pd.completed_at,
      pd.time_spent_seconds,
      pd.score,
      pd.attempts,
      pd.state,
      pd.last_response,
      pd.feedback,
      pd.completion_quality,
      pd.recently_completed,
      case 
        when reveal_strategy = 'all' then true
        when lb.position = 1 then true
        when reveal_strategy = 'linear' then 
          exists (
            select 1 from lesson_blocks lb2 
            join progress_data pd2 on pd2.block_id = lb2.block_id
            where lb2.position = lb.position - 1 
              and pd2.is_completed = true
          )
        when reveal_strategy = 'progressive' then
          case
            when lb.position = 1 then true
            when lb.can_skip then true
            else exists (
              select 1 from lesson_blocks lb2 
              join progress_data pd2 on pd2.block_id = lb2.block_id
              where lb2.position < lb.position 
                and (
                  pd2.is_completed = true 
                  or (not lb2.requires_completion and pd2.started_at is not null)
                )
                and not exists (
                  select 1 from lesson_blocks lb3
                  where lb3.position < lb.position 
                    and lb3.position > lb2.position
                    and lb3.requires_completion = true
                    and not exists (
                      select 1 from progress_data pd3 
                      where pd3.block_id = lb3.block_id 
                        and pd3.is_completed = true
                    )
                )
            )
          end
        else true
      end as is_visible,
      case 
        when pd.is_completed then 'completed'
        when pd.started_at is not null then 'in_progress'
        when lb.position = 1 then 'available'
        else 'locked'
      end as interaction_state
    from lesson_blocks lb
    left join progress_data pd on pd.block_id = lb.block_id
  ),

  blocks_with_actions as (
    select 
      bwv.*,
      case 
        when bwv.interaction_state = 'completed' then 
          jsonb_build_array('review', 'skip') ||
          case when bwv.completion_quality in ('fair', 'needs_improvement') then jsonb_build_array('retry') else '[]'::jsonb end
        when bwv.interaction_state = 'in_progress' then 
          jsonb_build_array('continue', 'restart')
        when bwv.interaction_state = 'available' then 
          jsonb_build_array('start') ||
          case when bwv.can_skip then jsonb_build_array('skip') else '[]'::jsonb end
        else jsonb_build_array()
      end as available_actions
    from blocks_with_visibility bwv
  )

  select jsonb_agg(
    bwv.block_info ||
    jsonb_build_object(
      'is_visible', bwv.is_visible,
      'interaction_state', bwv.interaction_state,
      'available_actions', bwv.available_actions,
      'progress', jsonb_build_object(
        'is_completed', coalesce(bwv.is_completed, false),
        'started_at', bwv.started_at,
        'completed_at', bwv.completed_at,
        'time_spent_seconds', bwv.time_spent_seconds,
        'score', bwv.score,
        'attempts', coalesce(bwv.attempts, 0),
        'state', bwv.state,
        'last_response', bwv.last_response,
        'feedback', bwv.feedback,
        'completion_quality', bwv.completion_quality,
        'recently_completed', coalesce(bwv.recently_completed, false)
      ),
      'reveal_info', jsonb_build_object(
        'requires_completion', bwv.requires_completion,
        'can_skip', bwv.can_skip,
        'unlock_reason', case 
          when bwv.is_visible and bwv.position = 1 then 'first_block'
          when bwv.is_visible and bwv.can_skip then 'skippable'
          when bwv.is_visible then 'prerequisites_met'
          else 'locked'
        end
      )
    )
    order by bwv.position
  )
  into blocks_with_reveal
  from blocks_with_actions bwv;

  with lesson_metrics as (
    select 
      count(*) as total_blocks,
      sum(coalesce((block->'settings'->>'weight')::int, 1)) as total_weight,
      sum(coalesce((block->'settings'->>'weight')::int, 1)) 
        filter (where (block->'is_visible')::boolean = true) as visible_weight,
      sum(coalesce((block->'settings'->>'weight')::int, 1)) 
        filter (where (block->'progress'->>'is_completed')::boolean = true) as completed_weight,
      count(*) filter (where (block->'is_visible')::boolean = true) as visible_blocks,
      count(*) filter (where (block->'progress'->>'is_completed')::boolean = true) as completed_blocks,
      count(*) filter (where block->>'interaction_state' = 'available') as available_blocks,
      count(*) filter (where block->>'interaction_state' = 'in_progress') as in_progress_blocks,
      count(*) filter (where block->>'interaction_state' = 'locked') as locked_blocks,
      coalesce(sum((block->'progress'->>'time_spent_seconds')::int), 0) as total_time_spent,
      avg((block->'progress'->>'score')::numeric) as average_score,
      max((block->'progress'->>'completed_at')::timestamptz) as last_completed_at,
      (array_agg(
        jsonb_build_object(
          'block_id', block->>'id',
          'action', (block->'available_actions'->0)::text,
          'position', (block->>'position')::int
        ) 
        order by (block->>'position')::int
      ) filter (where jsonb_array_length(block->'available_actions') > 0))[1] as next_action
    from jsonb_array_elements(blocks_with_reveal) as block
  )

  select 
    lesson_data || jsonb_build_object(
      'blocks', blocks_with_reveal,
      'reveal_settings', jsonb_build_object(
        'strategy', reveal_strategy,
        'total_blocks', lm.total_blocks,
        'visible_blocks', lm.visible_blocks,
        'unlock_percentage', case 
          when lm.total_weight > 0 then round(lm.visible_weight * 100.0 / lm.total_weight, 1)
          else 0
        end
      ),
      'lesson_progress', jsonb_build_object(
        'total_blocks', lm.total_blocks,
        'visible_blocks', lm.visible_blocks,
        'completed_blocks', lm.completed_blocks,
        'available_blocks', lm.available_blocks,
        'in_progress_blocks', lm.in_progress_blocks,
        'locked_blocks', lm.locked_blocks,
        'completion_percentage', case 
          when lm.visible_weight > 0 and lm.completed_weight > 0 then round(lm.completed_weight * 100.0 / lm.visible_weight, 2)
          else 0.0
        end,
        'overall_completion_percentage', case 
          when lm.total_weight > 0 and lm.completed_weight > 0 then round(lm.completed_weight * 100.0 / lm.total_weight, 2)
          else 0.0
        end,
        'is_fully_completed', coalesce(lm.completed_weight = lm.total_weight, false),
        'total_time_spent', lm.total_time_spent,
        'average_score', round(lm.average_score, 2),
        'last_completed_at', lm.last_completed_at,
        'next_action', lm.next_action,
        'recommended_next_step', case
          when lm.available_blocks > 0 then 'continue_learning'
          when lm.in_progress_blocks > 0 then 'complete_current'
          when lm.locked_blocks > 0 then 'unlock_more_content'
          when lm.completed_weight = lm.total_weight then 'lesson_complete'
          else 'start_learning'
        end
      )
    )
  into result
  from lesson_metrics lm;

  return result;
end;
$$;
