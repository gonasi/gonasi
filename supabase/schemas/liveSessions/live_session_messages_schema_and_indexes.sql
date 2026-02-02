-- =============================================
-- LIVE SESSION MESSAGES TABLE (Optional Chat)
-- =============================================
-- Real-time chat during sessions

create table "public"."live_session_messages" (
  "id" uuid not null default extensions.uuid_generate_v4(),
  "live_session_id" uuid not null,
  "user_id" uuid not null,
  "organization_id" uuid not null,

  -- Message Content
  "message" text not null,
  "is_instructor" boolean not null default false,
  "is_pinned" boolean not null default false,

  -- Moderation
  "is_deleted" boolean not null default false,
  "deleted_by" uuid,
  "deleted_at" timestamp with time zone,

  -- Timestamps
  "created_at" timestamp with time zone not null default timezone('utc'::text, now())
);

alter table "public"."live_session_messages" enable row level security;

-- Primary Key
alter table "public"."live_session_messages"
  add constraint "live_session_messages_pkey" primary key ("id");

-- Foreign Keys
alter table "public"."live_session_messages"
  add constraint "live_session_messages_live_session_id_fkey"
  foreign key ("live_session_id")
  references "public"."live_sessions" ("id")
  on delete cascade;

alter table "public"."live_session_messages"
  add constraint "live_session_messages_user_id_fkey"
  foreign key ("user_id")
  references "public"."profiles" ("id")
  on delete cascade;

alter table "public"."live_session_messages"
  add constraint "live_session_messages_organization_id_fkey"
  foreign key ("organization_id")
  references "public"."organizations" ("id")
  on delete cascade;

alter table "public"."live_session_messages"
  add constraint "live_session_messages_deleted_by_fkey"
  foreign key ("deleted_by")
  references "public"."profiles" ("id")
  on delete set null;

-- Indexes
create index "live_session_messages_live_session_id_idx" on "public"."live_session_messages" ("live_session_id");
create index "live_session_messages_created_at_idx" on "public"."live_session_messages" ("created_at");
create index "live_session_messages_user_id_idx" on "public"."live_session_messages" ("user_id");

-- Comments
comment on table "public"."live_session_messages" is 'Optional real-time chat messages during live sessions';
