-- ============================================================
-- LIVE SESSION STATUS
-- ============================================================
-- High-level lifecycle of a live session.
-- This represents whether the session itself is running,
-- paused, or completed. It changes infrequently and is
-- controlled by the host or system.
--
-- VALID FLOWS:
-- 1. Standard: draft → waiting → active → ended
--    (with lobby period for participants to join)
-- 2. Quick start: draft → active → ended
--    (immediate start, skips waiting phase)
-- 3. Can pause/resume during active: active ↔ paused → ended
--
-- IMPORTANT:
-- - This does NOT represent what screen users are seeing.
-- - UI rendering should rely on `live_session_play_state`.
-- - play_state is NULL when status is draft or waiting
-- - play_state becomes 'lobby' automatically when status → active
-- ============================================================

create type "public"."live_session_status" as enum (
  'draft',     -- Session created but not live. Fully editable. No participants can join. play_state = NULL
  'waiting',   -- Session open for participants to join lobby. Gameplay has not started. play_state = NULL
  'active',    -- Session started. actual_start_time set. play_state automatically becomes 'lobby'
  'paused',    -- Session temporarily halted. Timers and progression stopped. play_state preserved
  'ended'      -- Session completed. No further interactions allowed. Final state
);

comment on type "public"."live_session_status" is
'High-level lifecycle status of a live session. Supports two flows: (1) draft→waiting→active for lobby period, or (2) draft→active for quick start. play_state is NULL until active status triggers automatic initialization to lobby.';

