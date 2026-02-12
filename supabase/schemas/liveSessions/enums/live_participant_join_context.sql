-- ============================================================
-- LIVE PARTICIPANT JOIN CONTEXT
-- ============================================================
-- Captures the session state when a participant joins.
-- Used to provide context-appropriate onboarding for late joiners.
--
-- IMPORTANT:
-- - Set automatically when participant joins
-- - Drives different UX based on when they arrived
-- - Helps explain why they can/cannot participate immediately
-- ============================================================

create type "public"."live_participant_join_context" as enum (
  'lobby',        -- Joined during pre-session lobby. Normal experience.
  'mid_question', -- Joined while question is active. Cannot submit answer.
  'results',      -- Joined during results phase. Jumps straight to results.
  'intermission', -- Joined during countdown/break. Sees countdown.
  'late'          -- Joined significantly late. May have missed blocks.
);

comment on type "public"."live_participant_join_context" is
'Context of when a participant joined the session. Used to provide appropriate onboarding messages and explain limitations (e.g., why they cannot answer the current question if they joined mid-question).';
