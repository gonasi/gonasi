-- =============================================
-- LIVE SESSIONS TABLE
-- =============================================
-- Main table for live interactive sessions

create table "public"."live_sessions" (
  "id" uuid not null default extensions.uuid_generate_v4(),
  "organization_id" uuid not null,
  "created_by" uuid not null,
  "updated_by" uuid,

  -- Session Metadata
  "name" text not null,
  "description" text,
  "image_url" text, -- Cloudinary public_id for session thumbnail
  "blur_hash" text, -- BlurHash string for placeholder image
  "session_code" text not null unique, -- Short code for joining (e.g., "ABC123")

  -- Visibility and Access Control
  "visibility" live_session_visibility not null default 'public',
  "session_key" text, -- Required for private sessions (like a password)

  -- Optional Course Integration
  "course_id" uuid, -- Link to a course (optional)
  "published_course_id" uuid, -- Link to published course (optional)

  -- Session Configuration
  "status" live_session_status not null default 'draft',
  "max_participants" integer, -- null = unlimited
  "allow_late_join" boolean not null default true,
  "show_leaderboard" boolean not null default true,
  "enable_chat" boolean not null default false,
  "enable_reactions" boolean not null default true,

  -- Timing Settings
  "scheduled_start_time" timestamp with time zone,
  "actual_start_time" timestamp with time zone,
  "ended_at" timestamp with time zone,

  -- Timestamps
  "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
  "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);

alter table "public"."live_sessions" enable row level security;

-- Primary Key
alter table "public"."live_sessions"
  add constraint "live_sessions_pkey" primary key ("id");

-- Foreign Keys
alter table "public"."live_sessions"
  add constraint "live_sessions_organization_id_fkey"
  foreign key ("organization_id")
  references "public"."organizations" ("id")
  on delete cascade;

alter table "public"."live_sessions"
  add constraint "live_sessions_created_by_fkey"
  foreign key ("created_by")
  references "public"."profiles" ("id")
  on delete cascade;

alter table "public"."live_sessions"
  add constraint "live_sessions_updated_by_fkey"
  foreign key ("updated_by")
  references "public"."profiles" ("id")
  on delete set null;

alter table "public"."live_sessions"
  add constraint "live_sessions_course_id_fkey"
  foreign key ("course_id")
  references "public"."courses" ("id")
  on delete set null;

alter table "public"."live_sessions"
  add constraint "live_sessions_published_course_id_fkey"
  foreign key ("published_course_id")
  references "public"."published_courses" ("id")
  on delete set null;

-- Constraints
-- Private sessions must have a session_key
alter table "public"."live_sessions"
  add constraint "live_sessions_private_requires_key_check"
  check (
    (visibility = 'private' and session_key is not null and session_key != '')
    or visibility != 'private'
  );

-- Indexes
create index "live_sessions_organization_id_idx" on "public"."live_sessions" ("organization_id");
create index "live_sessions_created_by_idx" on "public"."live_sessions" ("created_by");
create index "live_sessions_status_idx" on "public"."live_sessions" ("status");
create index "live_sessions_session_code_idx" on "public"."live_sessions" ("session_code");
create index "live_sessions_course_id_idx" on "public"."live_sessions" ("course_id");
create index "live_sessions_visibility_idx" on "public"."live_sessions" ("visibility");
create index "live_sessions_image_url_idx" on "public"."live_sessions" ("image_url");

-- Comments
comment on table "public"."live_sessions" is 'Live interactive learning sessions with real-time Q&A';
comment on column "public"."live_sessions"."image_url" is 'Cloudinary public_id for the session thumbnail image';
comment on column "public"."live_sessions"."blur_hash" is 'BlurHash string for placeholder image while loading';
comment on column "public"."live_sessions"."session_code" is 'Short unique code for joining (e.g., "ABC123")';
comment on column "public"."live_sessions"."session_key" is 'Password/key required for private sessions';
comment on column "public"."live_sessions"."visibility" is 'Access control: public, unlisted, or private (key required)';
comment on column "public"."live_sessions"."allow_late_join" is 'Whether participants can join after session has started';
