-- =============================================
-- LIVE SESSION ANALYTICS TABLE
-- =============================================
-- Aggregate analytics for sessions

create table "public"."live_session_analytics" (
  "id" uuid not null default extensions.uuid_generate_v4(),
  "live_session_id" uuid not null,
  "organization_id" uuid not null,

  -- Participation Metrics
  "total_participants" integer not null default 0,
  "peak_participants" integer not null default 0,
  "average_participants" integer,

  -- Engagement Metrics
  "total_responses" integer not null default 0,
  "participation_rate" numeric, -- Percentage of participants who responded
  "average_response_time_ms" integer,
  "median_response_time_ms" integer,

  -- Performance Metrics
  "average_score" numeric,
  "median_score" numeric,
  "highest_score" numeric,
  "lowest_score" numeric,
  "accuracy_rate" numeric, -- Percentage of correct responses

  -- Session Duration
  "session_duration_seconds" integer,

  -- Timestamps
  "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
  "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);

alter table "public"."live_session_analytics" enable row level security;

-- Primary Key
alter table "public"."live_session_analytics"
  add constraint "live_session_analytics_pkey" primary key ("id");

-- Unique constraint: one analytics record per session
alter table "public"."live_session_analytics"
  add constraint "live_session_analytics_session_unique"
  unique("live_session_id");

-- Foreign Keys
alter table "public"."live_session_analytics"
  add constraint "live_session_analytics_live_session_id_fkey"
  foreign key ("live_session_id")
  references "public"."live_sessions" ("id")
  on delete cascade;

alter table "public"."live_session_analytics"
  add constraint "live_session_analytics_organization_id_fkey"
  foreign key ("organization_id")
  references "public"."organizations" ("id")
  on delete cascade;

-- Indexes
create index "live_session_analytics_live_session_id_idx" on "public"."live_session_analytics" ("live_session_id");
create index "live_session_analytics_organization_id_idx" on "public"."live_session_analytics" ("organization_id");

-- Comments
comment on table "public"."live_session_analytics" is 'Aggregate analytics for completed live sessions';
