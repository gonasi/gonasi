-- =============================================
-- AUTO-UPDATE STATS AFTER RESPONSE
-- =============================================
-- Automatically updates all relevant statistics when a response is submitted

create or replace function public.trigger_update_stats_after_response()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Update block stats
  perform public.update_block_stats(new.live_session_block_id);

  -- Update participant stats
  perform public.update_participant_stats(new.participant_id);

  -- Recalculate leaderboard ranks
  perform public.calculate_leaderboard_ranks(new.live_session_id);

  -- Update session analytics
  perform public.update_session_analytics(new.live_session_id);

  return new;
end;
$$;

drop trigger if exists live_session_responses_update_stats_trigger
on public.live_session_responses;

create trigger live_session_responses_update_stats_trigger
  after insert on public.live_session_responses
  for each row
  execute function public.trigger_update_stats_after_response();

comment on function public.trigger_update_stats_after_response
is 'Trigger to update all stats when a participant submits a response';
