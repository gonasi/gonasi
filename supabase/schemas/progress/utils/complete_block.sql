-- ============================================================================
-- helper function: mark a block as completed and update progress metadata (with weight support)
-- ============================================================================
create or replace function public.complete_block(
  p_user_id uuid,
  p_published_course_id uuid,
  p_chapter_id uuid,
  p_lesson_id uuid,
  p_block_id uuid,
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
  block_weight numeric;
  course_structure jsonb;
  result jsonb;
  next_ids jsonb;
begin
  -- ============================================================================
  -- step 1: retrieve the organization_id for the published course
  -- ============================================================================
  select pc.organization_id
  into organization_id
  from public.published_courses pc
  where pc.id = p_published_course_id;

  -- if the course does not exist or is not linked to an organization, abort
  if organization_id is null then
    return jsonb_build_object('error', 'published course not found');
  end if;

  -- ============================================================================
  -- step 2: get the block weight from course structure
  -- ============================================================================
  select course_structure_content 
  into course_structure
  from public.published_course_structure_content 
  where id = p_published_course_id;

  if course_structure is null then
    return jsonb_build_object('error', 'course structure not found');
  end if;

  -- extract block weight from course structure
  select coalesce(
    (select (block_obj->>'weight')::numeric
     from jsonb_path_query(
       course_structure,
       '$.chapters[*].lessons[*].blocks[*] ? (@.id == $block_id)',
       jsonb_build_object('block_id', p_block_id::text)
     ) as block_obj
     limit 1),
    1.0 -- default weight if not specified
  ) into block_weight;

  -- ============================================================================
  -- step 3: insert or update block progress with weight information
  -- ============================================================================
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
    block_weight,
    true, -- mark as completed
    timezone('utc', now()),
    p_time_spent_seconds,
    p_earned_score,
    coalesce((
      select bp.attempt_count + 1
      from public.block_progress bp
      where bp.user_id = p_user_id
        and bp.published_course_id = p_published_course_id
        and bp.block_id = p_block_id
    ), 1), -- default to first attempt
    p_interaction_data,
    p_last_response
  )
  on conflict (user_id, published_course_id, block_id)
  do update set
    is_completed = true,
    completed_at = timezone('utc', now()),
    time_spent_seconds = block_progress.time_spent_seconds + excluded.time_spent_seconds,
    earned_score = coalesce(excluded.earned_score, block_progress.earned_score),
    attempt_count = coalesce(block_progress.attempt_count + 1, 1),
    interaction_data = coalesce(excluded.interaction_data, block_progress.interaction_data),
    last_response = coalesce(excluded.last_response, block_progress.last_response),
    block_weight = excluded.block_weight, -- update weight in case it changed
    updated_at = timezone('utc', now());

  -- ============================================================================
  -- step 4: fetch next navigation target (e.g., next block or lesson)
  -- ============================================================================
  select public.get_next_navigation_ids(
    p_user_id,
    p_published_course_id,
    p_block_id
  )
  into next_ids;

  -- ============================================================================
  -- step 5: return a success object including next navigation info
  -- ============================================================================
  return jsonb_build_object(
    'success', true,
    'block_id', p_block_id,
    'block_weight', block_weight,
    'completed_at', to_char(timezone('utc', now()), 'yyyy-mm-dd"T"hh24:mi:ss.ms"Z"'),
    'navigation', next_ids
  );
end;
$$;