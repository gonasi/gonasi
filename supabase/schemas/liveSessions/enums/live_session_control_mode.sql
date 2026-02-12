-- ============================================================
-- LIVE SESSION CONTROL MODE
-- ============================================================
-- Determines how session progression is controlled.
-- This defines who has authority over state transitions and timing.
--
-- IMPORTANT:
-- - Control mode directly affects the host's ability to intervene
-- - Changing control mode is only allowed in 'waiting' or 'paused' status
-- - This is separate from play_state and status
-- ============================================================

create type "public"."live_session_control_mode" as enum (
  'autoplay',      -- System advances automatically based on timers. Host can only pause/end.
  'host_driven',   -- Nothing happens automatically. Host controls all transitions.
  'hybrid'         -- System timers run, but host can override, advance, or pause at any time.
);

comment on type "public"."live_session_control_mode" is
'Determines control authority for session progression. Autoplay uses timers only, host_driven requires explicit host actions, and hybrid allows both automatic progression and host overrides for maximum flexibility.';
