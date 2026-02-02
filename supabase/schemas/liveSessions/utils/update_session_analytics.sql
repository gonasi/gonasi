-- =============================================
-- UPDATE SESSION ANALYTICS
-- =============================================
-- Updates or creates aggregate analytics for a session

create or replace function update_session_analytics(p_session_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_total_participants integer;
  v_total_responses integer;
  v_total_blocks integer;
begin
  -- Get counts
  select count(*) into v_total_participants
  from live_session_participants
  where live_session_id = p_session_id;

  select count(*) into v_total_responses
  from live_session_responses
  where live_session_id = p_session_id;

  select count(*) into v_total_blocks
  from live_session_blocks
  where live_session_id = p_session_id
    and status in ('closed', 'active');

  -- Upsert analytics
  insert into live_session_analytics (
    live_session_id,
    organization_id,
    total_participants,
    total_responses,
    participation_rate,
    average_response_time_ms,
    average_score,
    median_score,
    highest_score,
    lowest_score,
    accuracy_rate
  )
  select
    p_session_id,
    ls.organization_id,
    v_total_participants,
    v_total_responses,
    -- Participation rate: (responses / (participants * blocks)) * 100
    case
      when v_total_participants > 0 and v_total_blocks > 0
      then (v_total_responses::numeric / (v_total_participants * v_total_blocks)) * 100
      else null
    end,
    -- Average response time
    (select avg(response_time_ms)::int from live_session_responses where live_session_id = p_session_id),
    -- Average score
    (select avg(lsp.total_score) from live_session_participants lsp where lsp.live_session_id = p_session_id),
    -- Median score
    (select percentile_cont(0.5) within group (order by lsp.total_score)
     from live_session_participants lsp where lsp.live_session_id = p_session_id),
    -- Highest score
    (select max(lsp.total_score) from live_session_participants lsp where lsp.live_session_id = p_session_id),
    -- Lowest score
    (select min(lsp.total_score) from live_session_participants lsp where lsp.live_session_id = p_session_id),
    -- Accuracy rate: (correct responses / total responses) * 100
    case
      when v_total_responses > 0
      then (
        select count(*)::numeric / v_total_responses * 100
        from live_session_responses
        where live_session_id = p_session_id
          and status = 'correct'
      )
      else null
    end
  from live_sessions ls
  where ls.id = p_session_id
  on conflict (live_session_id)
  do update set
    total_participants = excluded.total_participants,
    total_responses = excluded.total_responses,
    participation_rate = excluded.participation_rate,
    average_response_time_ms = excluded.average_response_time_ms,
    average_score = excluded.average_score,
    median_score = excluded.median_score,
    highest_score = excluded.highest_score,
    lowest_score = excluded.lowest_score,
    accuracy_rate = excluded.accuracy_rate,
    updated_at = now();
end;
$$;

comment on function update_session_analytics is 'Updates aggregate analytics for a live session';
