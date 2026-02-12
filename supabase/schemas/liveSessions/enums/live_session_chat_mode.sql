-- ============================================================
-- LIVE SESSION CHAT MODE
-- ============================================================
-- Controls granular chat behavior during different phases of a session.
-- Allows hosts to manage crowd noise without fully disabling interaction.
--
-- IMPORTANT:
-- - Chat mode can change automatically based on play state
-- - Hosts can manually override at any time
-- - Helps maintain focus during questions, open discussion during results
-- ============================================================

create type "public"."live_session_chat_mode" as enum (
  'open',            -- Full chat enabled. All participants can send messages.
  'reactions_only',  -- Only emoji reactions allowed. No text messages.
  'host_only',       -- Only facilitators can send messages. Participants can read.
  'muted'            -- No interaction allowed. Read-only mode for critical moments.
);

comment on type "public"."live_session_chat_mode" is
'Granular control over chat interaction levels. Can transition automatically (e.g., reactions_only during question_active, open during results) or be manually set by hosts for crowd management.';
