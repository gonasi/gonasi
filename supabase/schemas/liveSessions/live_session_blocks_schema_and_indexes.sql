-- =============================================
-- LIVE SESSION BLOCKS TABLE
-- =============================================
-- Questions/content blocks used in live sessions
-- Reuses existing plugin types from lesson_blocks

-- create the enum type for difficulty
create type live_session_block_difficulty as enum ('easy', 'medium', 'hard');


create table "public"."live_session_blocks" (
  "id" uuid not null default extensions.uuid_generate_v4(),
  "live_session_id" uuid not null,
  "organization_id" uuid not null,
  "created_by" uuid not null,
  "updated_by" uuid,

  -- Block Content (reuses existing plugin types)
  "plugin_type" text not null, -- e.g., 'multiple_choice_single', 'true_or_false'
  "content" jsonb not null default '{}'::jsonb, -- Question data using existing plugin schemas
  "settings" jsonb not null default '{}'::jsonb, -- Plugin settings

  -- Block Configuration
  "position" integer not null default 0,
  "time_limit" integer not null default 10,
  "difficulty" live_session_block_difficulty not null default 'medium', -- easy | medium | hard

  -- Block State
  "status" live_session_block_status not null default 'pending',
  "activated_at" timestamp with time zone, -- When the block became active
  "closed_at" timestamp with time zone, -- When responses were closed

  -- Statistics (computed in real-time)
  "total_responses" integer not null default 0,
  "correct_responses" integer not null default 0,
  "average_response_time_ms" integer, -- Average time to respond

  -- Timestamps
  "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
  "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);

alter table "public"."live_session_blocks" enable row level security;

-- Primary Key
alter table "public"."live_session_blocks"
  add constraint "live_session_blocks_pkey" primary key ("id");

-- Foreign Keys
alter table "public"."live_session_blocks"
  add constraint "live_session_blocks_live_session_id_fkey"
  foreign key ("live_session_id")
  references "public"."live_sessions" ("id")
  on delete cascade;

alter table "public"."live_session_blocks"
  add constraint "live_session_blocks_organization_id_fkey"
  foreign key ("organization_id")
  references "public"."organizations" ("id")
  on delete cascade;

alter table "public"."live_session_blocks"
  add constraint "live_session_blocks_created_by_fkey"
  foreign key ("created_by")
  references "public"."profiles" ("id")
  on delete cascade;

alter table "public"."live_session_blocks"
  add constraint "live_session_blocks_updated_by_fkey"
  foreign key ("updated_by")
  references "public"."profiles" ("id")
  on delete set null;

-- Indexes
create index "live_session_blocks_live_session_id_idx" on "public"."live_session_blocks" ("live_session_id");
create index "live_session_blocks_organization_id_idx" on "public"."live_session_blocks" ("organization_id");
create index "live_session_blocks_status_idx" on "public"."live_session_blocks" ("status");
create index "live_session_blocks_position_idx" on "public"."live_session_blocks" ("position");

-- Comments
comment on table "public"."live_session_blocks" is 'Questions/content blocks used in live sessions, reusing existing plugin types';
comment on column "public"."live_session_blocks"."plugin_type" is 'Reuses existing plugin types like multiple_choice_single, true_or_false, etc.';
comment on column "public"."live_session_blocks"."time_limit" is 'Override for session default time limit, in seconds';
