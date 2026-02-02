-- =============================================
-- LIVE SESSIONS TRIGGERS
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
