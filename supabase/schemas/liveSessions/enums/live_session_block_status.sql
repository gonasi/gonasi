-- Block status enum for individual questions in a session
create type "public"."live_session_block_status" as enum (
  'pending',    -- Not yet displayed
  'active',     -- Currently displayed to participants
  'closed',     -- No longer accepting responses
  'skipped'     -- Skipped by instructor
);

comment on type "public"."live_session_block_status" is 'Status of individual blocks within a live session';
