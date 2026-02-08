-- ============================================================
-- LIVE SESSION STATUS
-- ============================================================
-- High-level lifecycle of a live session.
-- This represents whether the session itself is running,
-- paused, or completed. It changes infrequently and is
-- controlled by the host or system.
--
-- IMPORTANT:
-- - This does NOT represent what screen users are seeing.
-- - UI rendering should rely on `live_session_play_state`.
-- ============================================================

create type "public"."live_session_status" as enum (
  'draft',     -- Session created but not live. Fully editable. No participants can join.
  'waiting',   -- Session is open for participants to join. Gameplay has not started.
  'active',    -- Session is live. Gameplay may be ongoing or ready to proceed.
  'paused',    -- Session is temporarily halted. Timers and progression should stop.
  'ended'      -- Session is completed. No further interactions are allowed.
);

comment on type "public"."live_session_status" is
'High-level lifecycle status of a live session. Indicates whether the session is editable, open for joining, actively running, temporarily paused, or fully completed. This status changes infrequently and is independent of the current play or UI state.';

