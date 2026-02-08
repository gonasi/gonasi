-- ============================================================
-- LIVE SESSION PLAY MODE
-- ============================================================
-- Determines how a live session progresses through play states.
-- Used to distinguish between host-controlled sessions and
-- system-driven (autoplay) sessions.
-- ============================================================

create type "public"."live_session_play_mode" as enum (
  'manual',    -- Host manually advances play state (questions, results, leaderboard)
  'autoplay'   -- System automatically advances play state based on timers
);

comment on type "public"."live_session_play_mode" is
'Determines how a live session progresses through play states. Manual mode requires explicit host actions to advance the session, while autoplay mode advances automatically based on configured timers.';
