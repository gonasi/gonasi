-- =============================================
-- LIVE SESSION PARTICIPANTS TABLE
-- =============================================
-- Tracks who's in each session with stats and rankings

create table "public"."live_session_participants" (
  "id" uuid not null default extensions.uuid_generate_v4(),
  "live_session_id" uuid not null,
  "user_id" uuid not null,
  "organization_id" uuid not null,

  -- Participation Details
  "status" live_participant_status not null default 'joined',
  "display_name" text, -- Optional custom display name for leaderboard

  -- Session Timing
  "joined_at" timestamp with time zone not null default timezone('utc'::text, now()),
  "left_at" timestamp with time zone,

  -- Session Statistics
  "total_responses" integer not null default 0,
  "correct_responses" integer not null default 0,
  "total_score" numeric not null default 0,
  "average_response_time_ms" integer, -- Average time to respond
  "rank" integer, -- Current leaderboard rank

  -- Timestamps
  "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
  "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);

alter table "public"."live_session_participants" enable row level security;

-- Primary Key
alter table "public"."live_session_participants"
  add constraint "live_session_participants_pkey" primary key ("id");

-- Unique constraint: one participant record per user per session
alter table "public"."live_session_participants"
  add constraint "live_session_participants_session_user_unique"
  unique("live_session_id", "user_id");

-- Foreign Keys
alter table "public"."live_session_participants"
  add constraint "live_session_participants_live_session_id_fkey"
  foreign key ("live_session_id")
  references "public"."live_sessions" ("id")
  on delete cascade;

alter table "public"."live_session_participants"
  add constraint "live_session_participants_user_id_fkey"
  foreign key ("user_id")
  references "public"."profiles" ("id")
  on delete cascade;

alter table "public"."live_session_participants"
  add constraint "live_session_participants_organization_id_fkey"
  foreign key ("organization_id")
  references "public"."organizations" ("id")
  on delete cascade;

-- Indexes
create index "live_session_participants_live_session_id_idx" on "public"."live_session_participants" ("live_session_id");
create index "live_session_participants_user_id_idx" on "public"."live_session_participants" ("user_id");
create index "live_session_participants_status_idx" on "public"."live_session_participants" ("status");
create index "live_session_participants_rank_idx" on "public"."live_session_participants" ("rank");

-- Comments
comment on table "public"."live_session_participants" is 'Tracks participants in live sessions with their stats and rankings';
comment on column "public"."live_session_participants"."rank" is 'Current position on leaderboard based on score and speed';
