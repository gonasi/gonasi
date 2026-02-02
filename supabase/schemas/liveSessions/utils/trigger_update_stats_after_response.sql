-- =============================================
-- AUTO-UPDATE STATS AFTER RESPONSE
-- =============================================
-- Automatically updates all relevant statistics when a response is submitted

create or replace function trigger_update_stats_after_response()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Update block stats
  perform update_block_stats(new.live_session_block_id);

  -- Update participant stats
  perform update_participant_stats(new.participant_id);

  -- Recalculate leaderboard ranks
  perform calculate_leaderboard_ranks(new.live_session_id);

  -- Update session analytics
  perform update_session_analytics(new.live_session_id);

  return new;
end;
$$;

create trigger live_session_responses_update_stats_trigger
  after insert on live_session_responses
  for each row
  execute function trigger_update_stats_after_response();

comment on function trigger_update_stats_after_response is 'Trigger to update all stats when a participant submits a response';
