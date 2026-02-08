-- ============================================================
-- LIVE SESSION PLAY STATE
-- ============================================================
-- Represents the current audience-facing experience.
-- This directly controls what screen participants see
-- (question, results, leaderboard, etc).
--
-- IMPORTANT:
-- - This state changes frequently during a session.
-- - Frontend clients should render UI based on this value.
-- - Rejoining clients should rely on this to recover state.
-- ============================================================

create type "public"."live_session_play_state" as enum (
  'lobby',             -- Waiting room before the session starts. Participants can join.
  'intro',             -- Welcome screen: rules, host intro, prize teaser.
  'question_active',   -- A question is visible and accepting responses.
  'question_locked',   -- Question timer ended. Answers are locked. Suspense moment.
  'question_results',  -- Correct answer, explanation, and per-question feedback shown.
  'leaderboard',       -- Rankings and score changes displayed.
  'intermission',      -- Countdown or break before the next question.
  'paused',            -- Session is paused. Clear paused message shown to participants.
  'prizes',            -- Prize breakdown or rewards explanation screen.
  'final_results',     -- Final winners, rankings, and participant summaries.
  'ended'              -- Session is over. Goodbye / CTA screen.
);

comment on type "public"."live_session_play_state" is
'Current play or UI state of a live session. Determines what participants are seeing at any given moment, such as lobby, active question, results, leaderboard, or final screen. This state drives client-side rendering and may change frequently during an active session.';
