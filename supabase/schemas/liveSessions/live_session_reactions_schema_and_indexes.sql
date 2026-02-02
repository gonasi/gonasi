-- =============================================
-- LIVE SESSION REACTIONS TABLE (Optional)
-- =============================================
-- Emoji reactions during sessions

create table "public"."live_session_reactions" (
  "id" uuid not null default extensions.uuid_generate_v4(),
  "live_session_id" uuid not null,
  "live_session_block_id" uuid, -- Reaction to specific question (optional)
  "user_id" uuid not null,
  "organization_id" uuid not null,

  -- Reaction Data
  "emoji" text not null, -- Emoji unicode or identifier

  -- Timestamps
  "created_at" timestamp with time zone not null default timezone('utc'::text, now())
);

alter table "public"."live_session_reactions" enable row level security;

-- Primary Key
alter table "public"."live_session_reactions"
  add constraint "live_session_reactions_pkey" primary key ("id");

-- Foreign Keys
alter table "public"."live_session_reactions"
  add constraint "live_session_reactions_live_session_id_fkey"
  foreign key ("live_session_id")
  references "public"."live_sessions" ("id")
  on delete cascade;

alter table "public"."live_session_reactions"
  add constraint "live_session_reactions_live_session_block_id_fkey"
  foreign key ("live_session_block_id")
  references "public"."live_session_blocks" ("id")
  on delete cascade;

alter table "public"."live_session_reactions"
  add constraint "live_session_reactions_user_id_fkey"
  foreign key ("user_id")
  references "public"."profiles" ("id")
  on delete cascade;

alter table "public"."live_session_reactions"
  add constraint "live_session_reactions_organization_id_fkey"
  foreign key ("organization_id")
  references "public"."organizations" ("id")
  on delete cascade;

-- Indexes
create index "live_session_reactions_live_session_id_idx" on "public"."live_session_reactions" ("live_session_id");
create index "live_session_reactions_live_session_block_id_idx" on "public"."live_session_reactions" ("live_session_block_id");
create index "live_session_reactions_user_id_idx" on "public"."live_session_reactions" ("user_id");

-- Comments
comment on table "public"."live_session_reactions" is 'Optional emoji reactions during live sessions';
