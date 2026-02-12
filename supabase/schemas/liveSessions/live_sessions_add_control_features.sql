-- ============================================================
-- ADD CONTROL FEATURES TO LIVE SESSIONS
-- ============================================================
-- Adds new columns to support enhanced control modes and features
-- based on product feedback for improved host experience.
--
-- New columns:
-- - control_mode: How session progression is controlled
-- - pause_reason: Why session is paused (context for UI/analytics)
-- - chat_mode: Granular chat control during session
-- ============================================================

-- Add control_mode column
alter table "public"."live_sessions"
  add column if not exists "control_mode" live_session_control_mode not null default 'hybrid';

-- Add pause_reason column (nullable, only relevant when status = 'paused')
alter table "public"."live_sessions"
  add column if not exists "pause_reason" live_session_pause_reason;

-- Add chat_mode column
alter table "public"."live_sessions"
  add column if not exists "chat_mode" live_session_chat_mode not null default 'open';

-- Add index for control_mode (for filtering/analytics)
create index if not exists "live_sessions_control_mode_idx"
  on "public"."live_sessions" ("control_mode");

-- Add index for pause_reason (for analytics when paused)
create index if not exists "live_sessions_pause_reason_idx"
  on "public"."live_sessions" ("pause_reason");

-- Add constraint: pause_reason should only be set when status is 'paused'
alter table "public"."live_sessions"
  add constraint "live_sessions_pause_reason_when_paused_check"
  check (
    (status = 'paused' and pause_reason is not null)
    or (status != 'paused' and pause_reason is null)
  );

-- Comments
comment on column "public"."live_sessions"."control_mode" is
'Control authority for session: autoplay (timers only), host_driven (manual only), or hybrid (both). Can only be changed in waiting or paused status.';

comment on column "public"."live_sessions"."pause_reason" is
'Why the session is paused. Used for UI messaging, analytics, and automatic behaviors (e.g., locking chat during moderation). Only set when status = paused.';

comment on column "public"."live_sessions"."chat_mode" is
'Chat interaction level: open (full chat), reactions_only (emojis only), host_only (facilitators only), or muted (read-only). Can change automatically based on play_state or be manually controlled.';
