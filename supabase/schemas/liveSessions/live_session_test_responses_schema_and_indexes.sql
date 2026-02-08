-- =============================================
-- LIVE SESSION TEST RESPONSES TABLE
-- =============================================
-- Test responses from facilitators for testing live sessions
-- Separate from actual participant responses to maintain data integrity

create table "public"."live_session_test_responses" (
  "id" uuid not null default extensions.uuid_generate_v4(),
  "live_session_id" uuid not null,
  "live_session_block_id" uuid not null,
  "facilitator_id" uuid not null, -- The facilitator testing the session
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

  -- Test Metadata
  "test_notes" text, -- Optional notes about the test

  -- Timestamps
  "created_at" timestamp with time zone not null default timezone('utc'::text, now())
);

alter table "public"."live_session_test_responses" enable row level security;

-- Primary Key
alter table "public"."live_session_test_responses"
  add constraint "live_session_test_responses_pkey" primary key ("id");

-- Foreign Keys
alter table "public"."live_session_test_responses"
  add constraint "live_session_test_responses_live_session_id_fkey"
  foreign key ("live_session_id")
  references "public"."live_sessions" ("id")
  on delete cascade;

alter table "public"."live_session_test_responses"
  add constraint "live_session_test_responses_live_session_block_id_fkey"
  foreign key ("live_session_block_id")
  references "public"."live_session_blocks" ("id")
  on delete cascade;

alter table "public"."live_session_test_responses"
  add constraint "live_session_test_responses_facilitator_id_fkey"
  foreign key ("facilitator_id")
  references "public"."profiles" ("id")
  on delete cascade;

alter table "public"."live_session_test_responses"
  add constraint "live_session_test_responses_organization_id_fkey"
  foreign key ("organization_id")
  references "public"."organizations" ("id")
  on delete cascade;

-- Indexes
create index "live_session_test_responses_live_session_id_idx" on "public"."live_session_test_responses" ("live_session_id");
create index "live_session_test_responses_live_session_block_id_idx" on "public"."live_session_test_responses" ("live_session_block_id");
create index "live_session_test_responses_facilitator_id_idx" on "public"."live_session_test_responses" ("facilitator_id");
create index "live_session_test_responses_status_idx" on "public"."live_session_test_responses" ("status");
create index "live_session_test_responses_submitted_at_idx" on "public"."live_session_test_responses" ("submitted_at");

-- Comments
comment on table "public"."live_session_test_responses" is 'Test responses from facilitators testing live sessions, separate from actual participant responses';
comment on column "public"."live_session_test_responses"."response_time_ms" is 'Milliseconds from block activation to response submission';
comment on column "public"."live_session_test_responses"."test_notes" is 'Optional notes about the test response for facilitator reference';
