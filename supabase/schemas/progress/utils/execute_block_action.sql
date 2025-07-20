-- ========================================================================
-- FUNCTION: execute_block_action
-- DESCRIPTION: 
--   Executes actions on blocks (start, continue, complete, skip, retry)
--   and returns updated lesson state with new reveal information.
-- ========================================================================
create or replace function public.execute_block_action(
  p_course_id uuid,
  p_lesson_id uuid,
  p_block_id uuid,
  p_action text, -- 'start', 'continue', 'complete', 'skip', 'retry', 'review'
  p_response_data jsonb default null,
  p_score numeric default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  org_id uuid;
  chapter_id uuid;
  result jsonb;
begin
  -- Get organization and chapter info
  select 
    pc.organization_id,
    (jsonb_path_query_first(
      pcs.course_structure_content,
      '$.chapters[*] ? (@.lessons[*].id == $lesson_id)',
      jsonb_build_object('lesson_id', p_lesson_id::text)
    )->>'id')::uuid
  into org_id, chapter_id
  from public.published_courses pc
  join public.published_course_structure_content pcs on pcs.id = pc.id
  where pc.id = p_course_id;

  -- Execute the action
  case p_action
    when 'start' then
      insert into public.block_progress (
        organization_id, published_course_id, chapter_id, lesson_id, block_id,
        user_id, is_completed, started_at, attempts
      ) values (
        org_id, p_course_id, chapter_id, p_lesson_id, p_block_id,
        current_user_id, false, now(), 1
      )
      on conflict (user_id, published_course_id, block_id) 
      do update set 
        started_at = coalesce(block_progress.started_at, now()),
        attempts = block_progress.attempts + 1,
        updated_at = now();

    when 'complete' then
      insert into public.block_progress (
        organization_id, published_course_id, chapter_id, lesson_id, block_id,
        user_id, is_completed, started_at, completed_at, score, last_response, attempts
      ) values (
        org_id, p_course_id, chapter_id, p_lesson_id, p_block_id,
        current_user_id, true, now(), now(), p_score, p_response_data, 1
      )
      on conflict (user_id, published_course_id, block_id) 
      do update set 
        is_completed = true,
        completed_at = now(),
        score = coalesce(excluded.score, block_progress.score),
        last_response = coalesce(excluded.last_response, block_progress.last_response),
        attempts = block_progress.attempts + 1,
        updated_at = now();

    when 'skip' then
      insert into public.block_progress (
        organization_id, published_course_id, chapter_id, lesson_id, block_id,
        user_id, is_completed, started_at, completed_at, state, attempts
      ) values (
        org_id, p_course_id, chapter_id, p_lesson_id, p_block_id,
        current_user_id, true, now(), now(), '{"skipped": true}'::jsonb, 1
      )
      on conflict (user_id, published_course_id, block_id) 
      do update set 
        is_completed = true,
        completed_at = now(),
        state = '{"skipped": true}'::jsonb,
        updated_at = now();

    when 'retry' then
      update public.block_progress set
        is_completed = false,
        completed_at = null,
        started_at = now(),
        attempts = attempts + 1,
        score = null,
        last_response = null,
        updated_at = now()
      where user_id = current_user_id 
        and published_course_id = p_course_id 
        and block_id = p_block_id;

    when 'continue' then
      update public.block_progress set
        started_at = coalesce(started_at, now()),
        state = coalesce(p_response_data, state),
        updated_at = now()
      where user_id = current_user_id 
        and published_course_id = p_course_id 
        and block_id = p_block_id;

    else
      raise exception 'Invalid action: %. Valid actions are: start, complete, skip, retry, continue', p_action;
  end case;

  -- Return updated lesson state
  select public.get_published_lesson_blocks_with_progressive_reveal(
    p_course_id, chapter_id, p_lesson_id, 'progressive'
  ) into result;

  return jsonb_build_object(
    'success', true,
    'action_executed', p_action,
    'block_id', p_block_id,
    'lesson_state', result
  );

exception
  when others then
    return jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'action_attempted', p_action,
      'block_id', p_block_id
    );
end;
$$;
