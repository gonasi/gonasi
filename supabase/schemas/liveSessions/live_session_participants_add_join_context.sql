-- ============================================================
-- ADD JOIN CONTEXT TO LIVE SESSION PARTICIPANTS
-- ============================================================
-- Adds join_context column to track when participants joined
-- relative to session state. Used for better late-joiner UX.
--
-- New columns:
-- - join_context: Session phase when participant joined
-- ============================================================

-- Add join_context column
alter table "public"."live_session_participants"
  add column if not exists "join_context" live_participant_join_context not null default 'lobby';

-- Add index for join_context (for analytics on late joiners)
create index if not exists "live_session_participants_join_context_idx"
  on "public"."live_session_participants" ("join_context");

-- Comment
comment on column "public"."live_session_participants"."join_context" is
'Session state when participant joined. Used to provide context-appropriate onboarding (e.g., explain why they cannot answer current question if joined mid_question). Captured at join time.';
