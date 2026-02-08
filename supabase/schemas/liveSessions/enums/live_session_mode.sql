-- ============================================================
-- LIVE SESSION MODE
-- ============================================================
-- Determines whether the session is in live mode or test mode.
-- Test mode allows facilitators to test the session before going live,
-- and state is automatically reset when switching between modes.
-- ============================================================

create type "public"."live_session_mode" as enum (
  'test',  -- Test mode for facilitators to preview and test the session
  'live'   -- Live mode for actual sessions with participants
);

comment on type "public"."live_session_mode" is
'Determines the operational mode of a live session. Test mode allows facilitators to test the session with isolated data. Live mode is for actual sessions with participants. State is reset when switching between modes to maintain data integrity.';
