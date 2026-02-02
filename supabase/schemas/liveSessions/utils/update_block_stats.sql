-- =============================================
-- UPDATE BLOCK STATISTICS
-- =============================================
-- Recalculates a block's aggregate stats based on all responses

create or replace function update_block_stats(p_block_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update live_session_blocks
  set
    total_responses = (
      select count(*)
      from live_session_responses
      where live_session_block_id = p_block_id
    ),
    correct_responses = (
      select count(*)
      from live_session_responses
      where live_session_block_id = p_block_id
        and status = 'correct'
    ),
    average_response_time_ms = (
      select avg(response_time_ms)::int
      from live_session_responses
      where live_session_block_id = p_block_id
    ),
    updated_at = now()
  where id = p_block_id;
end;
$$;

comment on function update_block_stats is 'Recalculates block statistics based on all participant responses';
