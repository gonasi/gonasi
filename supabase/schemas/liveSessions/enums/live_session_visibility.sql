-- Live session visibility enum
-- Similar to course_access enum
create type "public"."live_session_visibility" as enum (
  'public',    -- Anyone with the code can join
  'unlisted',  -- Anyone with the code can join, but not listed publicly
  'private'    -- Requires session_key to join
);

comment on type "public"."live_session_visibility" is 'Visibility level for live sessions';
