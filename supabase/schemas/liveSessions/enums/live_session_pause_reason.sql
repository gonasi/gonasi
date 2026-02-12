-- ============================================================
-- LIVE SESSION PAUSE REASON
-- ============================================================
-- Explains WHY a session is paused.
-- Used to provide context for UI messaging, analytics, and recovery.
--
-- IMPORTANT:
-- - Only applicable when session status is 'paused'
-- - Different pause reasons trigger different UI behaviors
-- - Critical for audit logs and troubleshooting
-- ============================================================

create type "public"."live_session_pause_reason" as enum (
  'host_hold',        -- Host intentionally paused to talk, wait, or manage crowd.
  'technical_issue',  -- Network, server, or technical problem requiring pause.
  'moderation',       -- Paused for moderation purposes (e.g., inappropriate behavior).
  'system'            -- System-initiated pause (e.g., auto-recovery, timeout).
);

comment on type "public"."live_session_pause_reason" is
'Reason for session pause. Used to customize UI messages, trigger automatic behaviors (like locking chat during moderation), and provide clarity in analytics and audit logs.';
