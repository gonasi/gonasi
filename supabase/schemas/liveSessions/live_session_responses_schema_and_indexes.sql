-- =============================================
-- LIVE SESSION RESPONSES TABLE
-- =============================================
-- Individual responses to questions with timing and scoring

create table "public"."live_session_responses" (
  "id" uuid not null default extensions.uuid_generate_v4(),
  "live_session_id" uuid not null,
  "live_session_block_id" uuid not null,
  "participant_id" uuid not null,
  "user_id" uuid not null,
  "organization_id" uuid not null,

  -- Response Data
  "response_data" jsonb not null, -- The actual answer (format depends on plugin_type)
  "status" live_response_status not null,

  -- Timing
  "response_time_ms" integer not null, -- Time taken to respond (from block activation)
  "submitted_at" timestamp with time zone not null default timezone('utc'::text, now()),

  -- Scoring
  "score_earned" numeric not null default 0,
  "max_score" numeric not null, -- Max possible score for this question

  -- Timestamps
  "created_at" timestamp with time zone not null default timezone('utc'::text, now())
);

alter table "public"."live_session_responses" enable row level security;

-- Primary Key
alter table "public"."live_session_responses"
  add constraint "live_session_responses_pkey" primary key ("id");

-- Unique constraint: one response per participant per block
alter table "public"."live_session_responses"
  add constraint "live_session_responses_block_participant_unique"
  unique("live_session_block_id", "participant_id");

-- Foreign Keys
alter table "public"."live_session_responses"
  add constraint "live_session_responses_live_session_id_fkey"
  foreign key ("live_session_id")
  references "public"."live_sessions" ("id")
  on delete cascade;

alter table "public"."live_session_responses"
  add constraint "live_session_responses_live_session_block_id_fkey"
  foreign key ("live_session_block_id")
  references "public"."live_session_blocks" ("id")
  on delete cascade;

alter table "public"."live_session_responses"
  add constraint "live_session_responses_participant_id_fkey"
  foreign key ("participant_id")
  references "public"."live_session_participants" ("id")
  on delete cascade;

alter table "public"."live_session_responses"
  add constraint "live_session_responses_user_id_fkey"
  foreign key ("user_id")
  references "public"."profiles" ("id")
  on delete cascade;

alter table "public"."live_session_responses"
  add constraint "live_session_responses_organization_id_fkey"
  foreign key ("organization_id")
  references "public"."organizations" ("id")
  on delete cascade;

-- Indexes
create index "live_session_responses_live_session_id_idx" on "public"."live_session_responses" ("live_session_id");
create index "live_session_responses_live_session_block_id_idx" on "public"."live_session_responses" ("live_session_block_id");
create index "live_session_responses_participant_id_idx" on "public"."live_session_responses" ("participant_id");
create index "live_session_responses_user_id_idx" on "public"."live_session_responses" ("user_id");
create index "live_session_responses_status_idx" on "public"."live_session_responses" ("status");

-- Comments
comment on table "public"."live_session_responses" is 'Individual responses to live session questions with timing and scoring';
comment on column "public"."live_session_responses"."response_time_ms" is 'Milliseconds from block activation to response submission';
