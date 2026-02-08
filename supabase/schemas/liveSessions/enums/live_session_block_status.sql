-- ============================================================
-- LIVE SESSION BLOCK STATUS
-- ============================================================
-- Represents the lifecycle of an individual block (question)
-- within a live session.
--
-- IMPORTANT:
-- - This is scoped to a specific block.
-- - It is separate from session or play state.
-- - Used to ensure idempotent processing of answers and results.
-- ============================================================

create type "public"."live_session_block_status" as enum (
  'pending',    -- Block has not yet been shown to participants.
  'active',     -- Block is visible and accepting responses.
  'closed',     -- Responses are no longer accepted. Awaiting results processing.
  'completed',  -- Results have been processed and scores updated.
  'skipped'     -- Block was intentionally skipped by the host/system.
);

comment on type "public"."live_session_block_status" is
'Lifecycle state of an individual block within a live session. Tracks whether a block has not started, is actively accepting responses, is closed to submissions, has been fully processed, or was skipped entirely. This status supports safe result processing and recovery.';
