-- =============================================
-- ADD FOREIGN KEY FOR CURRENT BLOCK
-- =============================================
-- This constraint must be added after both live_sessions
-- and live_session_blocks tables are created to avoid
-- circular dependency issues

alter table "public"."live_sessions"
  add constraint "live_sessions_current_block_id_fkey"
  foreign key ("current_block_id")
  references "public"."live_session_blocks" ("id")
  on delete set null;
