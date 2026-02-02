-- =============================================
-- UPDATE PARTICIPANT STATISTICS
-- =============================================
-- Recalculates a participant's stats based on their responses

create or replace function update_participant_stats(p_participant_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update live_session_participants
  set
    total_responses = (
      select count(*)
      from live_session_responses
      where participant_id = p_participant_id
    ),
    correct_responses = (
      select count(*)
      from live_session_responses
      where participant_id = p_participant_id
        and status = 'correct'
    ),
    total_score = (
      select coalesce(sum(score_earned), 0)
      from live_session_responses
      where participant_id = p_participant_id
    ),
    average_response_time_ms = (
      select avg(response_time_ms)::int
      from live_session_responses
      where participant_id = p_participant_id
    ),
    updated_at = now()
  where id = p_participant_id;
end;
$$;

comment on function update_participant_stats is 'Recalculates participant statistics based on their responses';
