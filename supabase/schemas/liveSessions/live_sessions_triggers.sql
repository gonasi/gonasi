-- =============================================
-- LIVE SESSIONS TRIGGERS
-- =============================================

-- =============================================
-- TIMESTAMP UPDATE TRIGGERS
-- =============================================

-- Trigger to update timestamps on live_sessions
create trigger live_sessions_update_timestamp_trigger
  before update on live_sessions
  for each row
  execute function update_updated_at_column();

-- Trigger to update timestamps on live_session_blocks
create trigger live_session_blocks_update_timestamp_trigger
  before update on live_session_blocks
  for each row
  execute function update_updated_at_column();

-- Trigger to update timestamps on live_session_participants
create trigger live_session_participants_update_timestamp_trigger
  before update on live_session_participants
  for each row
  execute function update_updated_at_column();

-- Trigger to update timestamps on live_session_analytics
create trigger live_session_analytics_update_timestamp_trigger
  before update on live_session_analytics
  for each row
  execute function update_updated_at_column();

-- =============================================
-- RESPONSE STATISTICS UPDATE TRIGGERS
-- =============================================

-- Function to update block statistics when responses change
create or replace function public.update_live_session_block_stats()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_total_responses integer;
  v_correct_responses integer;
  v_avg_response_time integer;
begin
  -- Calculate statistics for the block
  select
    count(*),
    count(*) filter (where status = 'correct'),
    avg(response_time_ms)::integer
  into
    v_total_responses,
    v_correct_responses,
    v_avg_response_time
  from public.live_session_responses
  where live_session_block_id = coalesce(NEW.live_session_block_id, OLD.live_session_block_id);

  -- Update the block with new statistics
  update public.live_session_blocks
  set
    total_responses = v_total_responses,
    correct_responses = v_correct_responses,
    average_response_time_ms = v_avg_response_time,
    updated_at = now()
  where id = coalesce(NEW.live_session_block_id, OLD.live_session_block_id);

  return coalesce(NEW, OLD);
end;
$$;

-- Trigger: Update block stats when response is inserted
create trigger live_session_response_insert_update_block_stats
  after insert on live_session_responses
  for each row
  execute function update_live_session_block_stats();

-- Trigger: Update block stats when response is updated
create trigger live_session_response_update_update_block_stats
  after update on live_session_responses
  for each row
  execute function update_live_session_block_stats();

-- Trigger: Update block stats when response is deleted
create trigger live_session_response_delete_update_block_stats
  after delete on live_session_responses
  for each row
  execute function update_live_session_block_stats();

-- =============================================
-- PARTICIPANT STATISTICS UPDATE TRIGGERS
-- =============================================

-- Function to update participant statistics when responses change
create or replace function public.update_live_session_participant_stats()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_total_responses integer;
  v_correct_responses integer;
  v_total_score numeric;
  v_avg_response_time integer;
begin
  -- Calculate statistics for the participant
  select
    count(*),
    count(*) filter (where status = 'correct'),
    coalesce(sum(score_earned), 0),
    avg(response_time_ms)::integer
  into
    v_total_responses,
    v_correct_responses,
    v_total_score,
    v_avg_response_time
  from public.live_session_responses
  where participant_id = coalesce(NEW.participant_id, OLD.participant_id);

  -- Update the participant with new statistics
  update public.live_session_participants
  set
    total_responses = v_total_responses,
    correct_responses = v_correct_responses,
    total_score = v_total_score,
    average_response_time_ms = v_avg_response_time,
    updated_at = now()
  where id = coalesce(NEW.participant_id, OLD.participant_id);

  return coalesce(NEW, OLD);
end;
$$;

-- Trigger: Update participant stats when response is inserted
create trigger live_session_response_insert_update_participant_stats
  after insert on live_session_responses
  for each row
  execute function update_live_session_participant_stats();

-- Trigger: Update participant stats when response is updated
create trigger live_session_response_update_update_participant_stats
  after update on live_session_responses
  for each row
  execute function update_live_session_participant_stats();

-- Trigger: Update participant stats when response is deleted
create trigger live_session_response_delete_update_participant_stats
  after delete on live_session_responses
  for each row
  execute function update_live_session_participant_stats();

-- =============================================
-- CLEANUP TRIGGERS
-- =============================================

-- Function to clean up orphaned data when a live session is deleted
-- Note: Most cleanup is handled by CASCADE foreign keys, but this ensures
-- any related analytics or cached data is also removed
create or replace function public.cleanup_live_session_data()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Delete any orphaned analytics entries (in case they weren't cascaded)
  delete from public.live_session_analytics
  where live_session_id = OLD.id;

  -- Log the deletion if needed (for audit purposes)
  -- This could be extended to log to an audit table

  return OLD;
end;
$$;

-- Trigger: Cleanup when live session is deleted
create trigger live_session_cleanup_trigger
  before delete on live_sessions
  for each row
  execute function cleanup_live_session_data();

-- =============================================
-- PARTICIPANT RANKING UPDATE TRIGGER
-- =============================================

-- Function to update participant rankings when scores change
create or replace function public.update_participant_rankings()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Update rankings for all participants in the session
  -- Rankings are based on total_score (descending) and average_response_time_ms (ascending)
  with ranked_participants as (
    select
      id,
      row_number() over (
        order by
          total_score desc,
          average_response_time_ms asc nulls last,
          joined_at asc
      ) as new_rank
    from public.live_session_participants
    where live_session_id = NEW.live_session_id
      and status = 'joined'
  )
  update public.live_session_participants lsp
  set
    rank = rp.new_rank,
    updated_at = now()
  from ranked_participants rp
  where lsp.id = rp.id
    and (lsp.rank is distinct from rp.new_rank); -- Only update if rank changed

  return NEW;
end;
$$;

-- Trigger: Update rankings when participant stats change
create trigger live_session_participant_update_rankings
  after update of total_score, average_response_time_ms on live_session_participants
  for each row
  execute function update_participant_rankings();

-- =============================================
-- MODE CHANGE RESET TRIGGER
-- =============================================

-- Function to reset session state when mode changes
-- This ensures test data doesn't mix with live data and vice versa
create or replace function public.reset_live_session_on_mode_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Only proceed if mode actually changed
  if OLD.mode is distinct from NEW.mode then

    -- Reset session lifecycle state
    NEW.status := 'draft';
    NEW.play_state := 'lobby';
    NEW.actual_start_time := null;
    NEW.ended_at := null;

    -- Delete all test responses (regardless of which mode we're switching to/from)
    delete from public.live_session_test_responses
    where live_session_id = NEW.id;

    -- Delete all live responses (regardless of which mode we're switching to/from)
    delete from public.live_session_responses
    where live_session_id = NEW.id;

    -- Delete all participants (will cascade to responses due to FK)
    delete from public.live_session_participants
    where live_session_id = NEW.id;

    -- Delete all messages
    delete from public.live_session_messages
    where live_session_id = NEW.id;

    -- Delete all reactions
    delete from public.live_session_reactions
    where live_session_id = NEW.id;

    -- Reset block statistics and state
    update public.live_session_blocks
    set
      status = 'pending',
      activated_at = null,
      closed_at = null,
      total_responses = 0,
      correct_responses = 0,
      average_response_time_ms = null,
      updated_at = now()
    where live_session_id = NEW.id;

    -- Reset or delete analytics (optional: you might want to keep historical data)
    delete from public.live_session_analytics
    where live_session_id = NEW.id;

  end if;

  return NEW;
end;
$$;

-- Trigger: Reset state when mode changes
create trigger live_session_mode_change_reset
  before update of mode on live_sessions
  for each row
  execute function reset_live_session_on_mode_change();
