-- Session status enum
create type "public"."live_session_status" as enum (
  'draft',      -- Session created but not started
  'waiting',    -- Waiting for participants to join
  'active',     -- Session in progress
  'paused',     -- Session temporarily paused
  'ended'       -- Session completed
);

comment on type "public"."live_session_status" is 'Current status of a live session';
