-- ============================================================
-- LIVE SESSION TYPE
-- ============================================================
-- Determines the start mechanism for a live session.
-- Controls whether the session begins automatically or requires
-- manual host intervention.
--
-- AUTO_START:
-- - Admin sets start date/time and publishes
-- - Session appears on Live page
-- - Users can join lobby
-- - System automatically transitions to 'active' at scheduled_start_time
-- - No host intervention needed to begin
--
-- MANUAL_START:
-- - Admin sets start date/time (for visibility/scheduling purposes)
-- - Users can join lobby
-- - Host MUST manually click "Start Session" to transition to 'active'
-- - Host controls when session begins and pacing
-- - scheduled_start_time is informational only
--
-- IMPORTANT:
-- - This is independent from control_mode which governs progression
-- - session_type: controls HOW session STARTS
-- - control_mode: controls HOW session PROGRESSES after start
-- ============================================================

create type "public"."live_session_type" as enum (
  'auto_start',    -- System automatically starts session at scheduled_start_time
  'manual_start'   -- Host must manually start session regardless of scheduled_start_time
);

comment on type "public"."live_session_type" is
'Determines session start mechanism. auto_start sessions begin automatically at scheduled time, manual_start sessions require explicit host action to begin.';
