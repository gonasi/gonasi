-- Participant status enum
create type "public"."live_participant_status" as enum (
  'joined',     -- Active in session
  'left',       -- Left the session
  'kicked'      -- Removed by instructor
);

comment on type "public"."live_participant_status" is 'Participation status of a user in a live session';
