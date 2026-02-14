create type "public"."live_participant_join_context" as enum ('lobby', 'mid_question', 'results', 'intermission', 'late');

create type "public"."live_participant_status" as enum ('joined', 'left', 'kicked');

create type "public"."live_response_status" as enum ('submitted', 'correct', 'incorrect', 'partial');

create type "public"."live_session_block_difficulty" as enum ('easy', 'medium', 'hard');

create type "public"."live_session_block_status" as enum ('pending', 'active', 'closed', 'completed', 'skipped');

create type "public"."live_session_chat_mode" as enum ('open', 'reactions_only', 'host_only', 'muted');

create type "public"."live_session_control_mode" as enum ('autoplay', 'host_driven', 'hybrid');

create type "public"."live_session_mode" as enum ('test', 'live');

create type "public"."live_session_pause_reason" as enum ('host_hold', 'technical_issue', 'moderation', 'system');

create type "public"."live_session_play_mode" as enum ('manual', 'autoplay');

create type "public"."live_session_play_state" as enum ('lobby', 'countdown', 'intro', 'question_active', 'question_soft_locked', 'question_locked', 'question_results', 'leaderboard', 'intermission', 'paused', 'host_segment', 'block_skipped', 'prizes', 'final_results', 'ended');

create type "public"."live_session_status" as enum ('draft', 'waiting', 'active', 'paused', 'ended');

create type "public"."live_session_type" as enum ('auto_start', 'manual_start');

create type "public"."live_session_visibility" as enum ('public', 'unlisted', 'private');


  create table "public"."live_session_analytics" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "live_session_id" uuid not null,
    "organization_id" uuid not null,
    "total_participants" integer not null default 0,
    "peak_participants" integer not null default 0,
    "average_participants" integer,
    "total_responses" integer not null default 0,
    "participation_rate" numeric,
    "average_response_time_ms" integer,
    "median_response_time_ms" integer,
    "average_score" numeric,
    "median_score" numeric,
    "highest_score" numeric,
    "lowest_score" numeric,
    "accuracy_rate" numeric,
    "session_duration_seconds" integer,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."live_session_analytics" enable row level security;


  create table "public"."live_session_blocks" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "live_session_id" uuid not null,
    "organization_id" uuid not null,
    "created_by" uuid not null,
    "updated_by" uuid,
    "plugin_type" text not null,
    "content" jsonb not null default '{}'::jsonb,
    "settings" jsonb not null default '{}'::jsonb,
    "position" integer not null default 0,
    "time_limit" integer not null default 10,
    "difficulty" public.live_session_block_difficulty not null default 'medium'::public.live_session_block_difficulty,
    "status" public.live_session_block_status not null default 'pending'::public.live_session_block_status,
    "activated_at" timestamp with time zone,
    "closed_at" timestamp with time zone,
    "total_responses" integer not null default 0,
    "correct_responses" integer not null default 0,
    "average_response_time_ms" integer,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."live_session_blocks" enable row level security;


  create table "public"."live_session_facilitators" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "live_session_id" uuid not null,
    "organization_id" uuid not null,
    "user_id" uuid not null,
    "added_by" uuid,
    "added_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."live_session_facilitators" enable row level security;


  create table "public"."live_session_messages" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "live_session_id" uuid not null,
    "user_id" uuid not null,
    "organization_id" uuid not null,
    "message" text not null,
    "is_instructor" boolean not null default false,
    "is_pinned" boolean not null default false,
    "is_deleted" boolean not null default false,
    "deleted_by" uuid,
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."live_session_messages" enable row level security;


  create table "public"."live_session_participants" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "live_session_id" uuid not null,
    "user_id" uuid not null,
    "organization_id" uuid not null,
    "status" public.live_participant_status not null default 'joined'::public.live_participant_status,
    "display_name" text,
    "joined_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "left_at" timestamp with time zone,
    "total_responses" integer not null default 0,
    "correct_responses" integer not null default 0,
    "total_score" numeric not null default 0,
    "average_response_time_ms" integer,
    "rank" integer,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "join_context" public.live_participant_join_context not null default 'lobby'::public.live_participant_join_context
      );


alter table "public"."live_session_participants" enable row level security;


  create table "public"."live_session_reactions" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "live_session_id" uuid not null,
    "live_session_block_id" uuid,
    "user_id" uuid not null,
    "organization_id" uuid not null,
    "emoji" text not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."live_session_reactions" enable row level security;


  create table "public"."live_session_responses" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "live_session_id" uuid not null,
    "live_session_block_id" uuid not null,
    "participant_id" uuid not null,
    "user_id" uuid not null,
    "organization_id" uuid not null,
    "response_data" jsonb not null,
    "status" public.live_response_status not null,
    "response_time_ms" integer not null,
    "submitted_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "score_earned" numeric not null default 0,
    "max_score" numeric not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."live_session_responses" enable row level security;


  create table "public"."live_session_test_responses" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "live_session_id" uuid not null,
    "live_session_block_id" uuid not null,
    "facilitator_id" uuid not null,
    "organization_id" uuid not null,
    "response_data" jsonb not null,
    "status" public.live_response_status not null,
    "response_time_ms" integer not null,
    "submitted_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "score_earned" numeric not null default 0,
    "max_score" numeric not null,
    "test_notes" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."live_session_test_responses" enable row level security;


  create table "public"."live_sessions" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "organization_id" uuid not null,
    "created_by" uuid not null,
    "updated_by" uuid,
    "name" text not null,
    "description" text,
    "image_url" text,
    "blur_hash" text,
    "session_code" text not null,
    "visibility" public.live_session_visibility not null default 'public'::public.live_session_visibility,
    "session_key" text,
    "course_id" uuid,
    "published_course_id" uuid,
    "status" public.live_session_status not null default 'draft'::public.live_session_status,
    "play_state" public.live_session_play_state,
    "play_mode" public.live_session_play_mode not null default 'autoplay'::public.live_session_play_mode,
    "mode" public.live_session_mode not null default 'test'::public.live_session_mode,
    "session_type" public.live_session_type not null default 'manual_start'::public.live_session_type,
    "current_block_id" uuid,
    "max_participants" integer,
    "allow_late_join" boolean not null default true,
    "show_leaderboard" boolean not null default true,
    "enable_chat" boolean not null default false,
    "enable_reactions" boolean not null default true,
    "scheduled_start_time" timestamp with time zone,
    "actual_start_time" timestamp with time zone,
    "ended_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "control_mode" public.live_session_control_mode not null default 'hybrid'::public.live_session_control_mode,
    "pause_reason" public.live_session_pause_reason,
    "chat_mode" public.live_session_chat_mode not null default 'open'::public.live_session_chat_mode
      );


alter table "public"."live_sessions" enable row level security;

CREATE INDEX idx_live_session_facilitators_added_by ON public.live_session_facilitators USING btree (added_by);

CREATE INDEX idx_live_session_facilitators_org_user ON public.live_session_facilitators USING btree (organization_id, user_id);

CREATE INDEX idx_live_session_facilitators_organization_id ON public.live_session_facilitators USING btree (organization_id);

CREATE INDEX idx_live_session_facilitators_session_id ON public.live_session_facilitators USING btree (live_session_id);

CREATE INDEX idx_live_session_facilitators_session_user ON public.live_session_facilitators USING btree (live_session_id, user_id);

CREATE INDEX idx_live_session_facilitators_user_id ON public.live_session_facilitators USING btree (user_id);

CREATE INDEX live_session_analytics_live_session_id_idx ON public.live_session_analytics USING btree (live_session_id);

CREATE INDEX live_session_analytics_organization_id_idx ON public.live_session_analytics USING btree (organization_id);

CREATE UNIQUE INDEX live_session_analytics_pkey ON public.live_session_analytics USING btree (id);

CREATE UNIQUE INDEX live_session_analytics_session_unique ON public.live_session_analytics USING btree (live_session_id);

CREATE INDEX live_session_blocks_live_session_id_idx ON public.live_session_blocks USING btree (live_session_id);

CREATE INDEX live_session_blocks_organization_id_idx ON public.live_session_blocks USING btree (organization_id);

CREATE UNIQUE INDEX live_session_blocks_pkey ON public.live_session_blocks USING btree (id);

CREATE INDEX live_session_blocks_position_idx ON public.live_session_blocks USING btree ("position");

CREATE INDEX live_session_blocks_status_idx ON public.live_session_blocks USING btree (status);

CREATE UNIQUE INDEX live_session_facilitators_live_session_id_user_id_key ON public.live_session_facilitators USING btree (live_session_id, user_id);

CREATE UNIQUE INDEX live_session_facilitators_pkey ON public.live_session_facilitators USING btree (id);

CREATE INDEX live_session_messages_created_at_idx ON public.live_session_messages USING btree (created_at);

CREATE INDEX live_session_messages_live_session_id_idx ON public.live_session_messages USING btree (live_session_id);

CREATE UNIQUE INDEX live_session_messages_pkey ON public.live_session_messages USING btree (id);

CREATE INDEX live_session_messages_user_id_idx ON public.live_session_messages USING btree (user_id);

CREATE INDEX live_session_participants_join_context_idx ON public.live_session_participants USING btree (join_context);

CREATE INDEX live_session_participants_live_session_id_idx ON public.live_session_participants USING btree (live_session_id);

CREATE UNIQUE INDEX live_session_participants_pkey ON public.live_session_participants USING btree (id);

CREATE INDEX live_session_participants_rank_idx ON public.live_session_participants USING btree (rank);

CREATE UNIQUE INDEX live_session_participants_session_user_unique ON public.live_session_participants USING btree (live_session_id, user_id);

CREATE INDEX live_session_participants_status_idx ON public.live_session_participants USING btree (status);

CREATE INDEX live_session_participants_user_id_idx ON public.live_session_participants USING btree (user_id);

CREATE INDEX live_session_reactions_live_session_block_id_idx ON public.live_session_reactions USING btree (live_session_block_id);

CREATE INDEX live_session_reactions_live_session_id_idx ON public.live_session_reactions USING btree (live_session_id);

CREATE UNIQUE INDEX live_session_reactions_pkey ON public.live_session_reactions USING btree (id);

CREATE INDEX live_session_reactions_user_id_idx ON public.live_session_reactions USING btree (user_id);

CREATE UNIQUE INDEX live_session_responses_block_participant_unique ON public.live_session_responses USING btree (live_session_block_id, participant_id);

CREATE INDEX live_session_responses_live_session_block_id_idx ON public.live_session_responses USING btree (live_session_block_id);

CREATE INDEX live_session_responses_live_session_id_idx ON public.live_session_responses USING btree (live_session_id);

CREATE INDEX live_session_responses_participant_id_idx ON public.live_session_responses USING btree (participant_id);

CREATE UNIQUE INDEX live_session_responses_pkey ON public.live_session_responses USING btree (id);

CREATE INDEX live_session_responses_status_idx ON public.live_session_responses USING btree (status);

CREATE INDEX live_session_responses_user_id_idx ON public.live_session_responses USING btree (user_id);

CREATE INDEX live_session_test_responses_facilitator_id_idx ON public.live_session_test_responses USING btree (facilitator_id);

CREATE INDEX live_session_test_responses_live_session_block_id_idx ON public.live_session_test_responses USING btree (live_session_block_id);

CREATE INDEX live_session_test_responses_live_session_id_idx ON public.live_session_test_responses USING btree (live_session_id);

CREATE UNIQUE INDEX live_session_test_responses_pkey ON public.live_session_test_responses USING btree (id);

CREATE INDEX live_session_test_responses_status_idx ON public.live_session_test_responses USING btree (status);

CREATE INDEX live_session_test_responses_submitted_at_idx ON public.live_session_test_responses USING btree (submitted_at);

CREATE INDEX live_sessions_control_mode_idx ON public.live_sessions USING btree (control_mode);

CREATE INDEX live_sessions_course_id_idx ON public.live_sessions USING btree (course_id);

CREATE INDEX live_sessions_created_by_idx ON public.live_sessions USING btree (created_by);

CREATE INDEX live_sessions_current_block_id_idx ON public.live_sessions USING btree (current_block_id);

CREATE INDEX live_sessions_image_url_idx ON public.live_sessions USING btree (image_url);

CREATE INDEX live_sessions_mode_idx ON public.live_sessions USING btree (mode);

CREATE INDEX live_sessions_organization_id_idx ON public.live_sessions USING btree (organization_id);

CREATE INDEX live_sessions_pause_reason_idx ON public.live_sessions USING btree (pause_reason);

CREATE UNIQUE INDEX live_sessions_pkey ON public.live_sessions USING btree (id);

CREATE INDEX live_sessions_session_code_idx ON public.live_sessions USING btree (session_code);

CREATE UNIQUE INDEX live_sessions_session_code_key ON public.live_sessions USING btree (session_code);

CREATE INDEX live_sessions_session_type_idx ON public.live_sessions USING btree (session_type);

CREATE INDEX live_sessions_status_idx ON public.live_sessions USING btree (status);

CREATE INDEX live_sessions_visibility_idx ON public.live_sessions USING btree (visibility);

alter table "public"."live_session_analytics" add constraint "live_session_analytics_pkey" PRIMARY KEY using index "live_session_analytics_pkey";

alter table "public"."live_session_blocks" add constraint "live_session_blocks_pkey" PRIMARY KEY using index "live_session_blocks_pkey";

alter table "public"."live_session_facilitators" add constraint "live_session_facilitators_pkey" PRIMARY KEY using index "live_session_facilitators_pkey";

alter table "public"."live_session_messages" add constraint "live_session_messages_pkey" PRIMARY KEY using index "live_session_messages_pkey";

alter table "public"."live_session_participants" add constraint "live_session_participants_pkey" PRIMARY KEY using index "live_session_participants_pkey";

alter table "public"."live_session_reactions" add constraint "live_session_reactions_pkey" PRIMARY KEY using index "live_session_reactions_pkey";

alter table "public"."live_session_responses" add constraint "live_session_responses_pkey" PRIMARY KEY using index "live_session_responses_pkey";

alter table "public"."live_session_test_responses" add constraint "live_session_test_responses_pkey" PRIMARY KEY using index "live_session_test_responses_pkey";

alter table "public"."live_sessions" add constraint "live_sessions_pkey" PRIMARY KEY using index "live_sessions_pkey";

alter table "public"."live_session_analytics" add constraint "live_session_analytics_live_session_id_fkey" FOREIGN KEY (live_session_id) REFERENCES public.live_sessions(id) ON DELETE CASCADE not valid;

alter table "public"."live_session_analytics" validate constraint "live_session_analytics_live_session_id_fkey";

alter table "public"."live_session_analytics" add constraint "live_session_analytics_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."live_session_analytics" validate constraint "live_session_analytics_organization_id_fkey";

alter table "public"."live_session_analytics" add constraint "live_session_analytics_session_unique" UNIQUE using index "live_session_analytics_session_unique";

alter table "public"."live_session_blocks" add constraint "live_session_blocks_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."live_session_blocks" validate constraint "live_session_blocks_created_by_fkey";

alter table "public"."live_session_blocks" add constraint "live_session_blocks_live_session_id_fkey" FOREIGN KEY (live_session_id) REFERENCES public.live_sessions(id) ON DELETE CASCADE not valid;

alter table "public"."live_session_blocks" validate constraint "live_session_blocks_live_session_id_fkey";

alter table "public"."live_session_blocks" add constraint "live_session_blocks_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."live_session_blocks" validate constraint "live_session_blocks_organization_id_fkey";

alter table "public"."live_session_blocks" add constraint "live_session_blocks_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."live_session_blocks" validate constraint "live_session_blocks_updated_by_fkey";

alter table "public"."live_session_facilitators" add constraint "live_session_facilitators_added_by_fkey" FOREIGN KEY (added_by) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."live_session_facilitators" validate constraint "live_session_facilitators_added_by_fkey";

alter table "public"."live_session_facilitators" add constraint "live_session_facilitators_live_session_id_fkey" FOREIGN KEY (live_session_id) REFERENCES public.live_sessions(id) ON DELETE CASCADE not valid;

alter table "public"."live_session_facilitators" validate constraint "live_session_facilitators_live_session_id_fkey";

alter table "public"."live_session_facilitators" add constraint "live_session_facilitators_live_session_id_user_id_key" UNIQUE using index "live_session_facilitators_live_session_id_user_id_key";

alter table "public"."live_session_facilitators" add constraint "live_session_facilitators_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."live_session_facilitators" validate constraint "live_session_facilitators_organization_id_fkey";

alter table "public"."live_session_facilitators" add constraint "live_session_facilitators_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."live_session_facilitators" validate constraint "live_session_facilitators_user_id_fkey";

alter table "public"."live_session_messages" add constraint "live_session_messages_deleted_by_fkey" FOREIGN KEY (deleted_by) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."live_session_messages" validate constraint "live_session_messages_deleted_by_fkey";

alter table "public"."live_session_messages" add constraint "live_session_messages_live_session_id_fkey" FOREIGN KEY (live_session_id) REFERENCES public.live_sessions(id) ON DELETE CASCADE not valid;

alter table "public"."live_session_messages" validate constraint "live_session_messages_live_session_id_fkey";

alter table "public"."live_session_messages" add constraint "live_session_messages_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."live_session_messages" validate constraint "live_session_messages_organization_id_fkey";

alter table "public"."live_session_messages" add constraint "live_session_messages_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."live_session_messages" validate constraint "live_session_messages_user_id_fkey";

alter table "public"."live_session_participants" add constraint "live_session_participants_live_session_id_fkey" FOREIGN KEY (live_session_id) REFERENCES public.live_sessions(id) ON DELETE CASCADE not valid;

alter table "public"."live_session_participants" validate constraint "live_session_participants_live_session_id_fkey";

alter table "public"."live_session_participants" add constraint "live_session_participants_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."live_session_participants" validate constraint "live_session_participants_organization_id_fkey";

alter table "public"."live_session_participants" add constraint "live_session_participants_session_user_unique" UNIQUE using index "live_session_participants_session_user_unique";

alter table "public"."live_session_participants" add constraint "live_session_participants_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."live_session_participants" validate constraint "live_session_participants_user_id_fkey";

alter table "public"."live_session_reactions" add constraint "live_session_reactions_live_session_block_id_fkey" FOREIGN KEY (live_session_block_id) REFERENCES public.live_session_blocks(id) ON DELETE CASCADE not valid;

alter table "public"."live_session_reactions" validate constraint "live_session_reactions_live_session_block_id_fkey";

alter table "public"."live_session_reactions" add constraint "live_session_reactions_live_session_id_fkey" FOREIGN KEY (live_session_id) REFERENCES public.live_sessions(id) ON DELETE CASCADE not valid;

alter table "public"."live_session_reactions" validate constraint "live_session_reactions_live_session_id_fkey";

alter table "public"."live_session_reactions" add constraint "live_session_reactions_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."live_session_reactions" validate constraint "live_session_reactions_organization_id_fkey";

alter table "public"."live_session_reactions" add constraint "live_session_reactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."live_session_reactions" validate constraint "live_session_reactions_user_id_fkey";

alter table "public"."live_session_responses" add constraint "live_session_responses_block_participant_unique" UNIQUE using index "live_session_responses_block_participant_unique";

alter table "public"."live_session_responses" add constraint "live_session_responses_live_session_block_id_fkey" FOREIGN KEY (live_session_block_id) REFERENCES public.live_session_blocks(id) ON DELETE CASCADE not valid;

alter table "public"."live_session_responses" validate constraint "live_session_responses_live_session_block_id_fkey";

alter table "public"."live_session_responses" add constraint "live_session_responses_live_session_id_fkey" FOREIGN KEY (live_session_id) REFERENCES public.live_sessions(id) ON DELETE CASCADE not valid;

alter table "public"."live_session_responses" validate constraint "live_session_responses_live_session_id_fkey";

alter table "public"."live_session_responses" add constraint "live_session_responses_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."live_session_responses" validate constraint "live_session_responses_organization_id_fkey";

alter table "public"."live_session_responses" add constraint "live_session_responses_participant_id_fkey" FOREIGN KEY (participant_id) REFERENCES public.live_session_participants(id) ON DELETE CASCADE not valid;

alter table "public"."live_session_responses" validate constraint "live_session_responses_participant_id_fkey";

alter table "public"."live_session_responses" add constraint "live_session_responses_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."live_session_responses" validate constraint "live_session_responses_user_id_fkey";

alter table "public"."live_session_test_responses" add constraint "live_session_test_responses_facilitator_id_fkey" FOREIGN KEY (facilitator_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."live_session_test_responses" validate constraint "live_session_test_responses_facilitator_id_fkey";

alter table "public"."live_session_test_responses" add constraint "live_session_test_responses_live_session_block_id_fkey" FOREIGN KEY (live_session_block_id) REFERENCES public.live_session_blocks(id) ON DELETE CASCADE not valid;

alter table "public"."live_session_test_responses" validate constraint "live_session_test_responses_live_session_block_id_fkey";

alter table "public"."live_session_test_responses" add constraint "live_session_test_responses_live_session_id_fkey" FOREIGN KEY (live_session_id) REFERENCES public.live_sessions(id) ON DELETE CASCADE not valid;

alter table "public"."live_session_test_responses" validate constraint "live_session_test_responses_live_session_id_fkey";

alter table "public"."live_session_test_responses" add constraint "live_session_test_responses_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."live_session_test_responses" validate constraint "live_session_test_responses_organization_id_fkey";

alter table "public"."live_sessions" add constraint "live_sessions_auto_start_requires_schedule_check" CHECK ((((session_type = 'auto_start'::public.live_session_type) AND (scheduled_start_time IS NOT NULL)) OR (session_type <> 'auto_start'::public.live_session_type))) not valid;

alter table "public"."live_sessions" validate constraint "live_sessions_auto_start_requires_schedule_check";

alter table "public"."live_sessions" add constraint "live_sessions_course_id_fkey" FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE SET NULL not valid;

alter table "public"."live_sessions" validate constraint "live_sessions_course_id_fkey";

alter table "public"."live_sessions" add constraint "live_sessions_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."live_sessions" validate constraint "live_sessions_created_by_fkey";

alter table "public"."live_sessions" add constraint "live_sessions_current_block_id_fkey" FOREIGN KEY (current_block_id) REFERENCES public.live_session_blocks(id) ON DELETE SET NULL not valid;

alter table "public"."live_sessions" validate constraint "live_sessions_current_block_id_fkey";

alter table "public"."live_sessions" add constraint "live_sessions_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."live_sessions" validate constraint "live_sessions_organization_id_fkey";

alter table "public"."live_sessions" add constraint "live_sessions_pause_reason_when_paused_check" CHECK ((((status = 'paused'::public.live_session_status) AND (pause_reason IS NOT NULL)) OR ((status <> 'paused'::public.live_session_status) AND (pause_reason IS NULL)))) not valid;

alter table "public"."live_sessions" validate constraint "live_sessions_pause_reason_when_paused_check";

alter table "public"."live_sessions" add constraint "live_sessions_play_state_lifecycle_check" CHECK ((((actual_start_time IS NULL) AND (play_state IS NULL)) OR ((actual_start_time IS NOT NULL) AND (play_state IS NOT NULL)))) not valid;

alter table "public"."live_sessions" validate constraint "live_sessions_play_state_lifecycle_check";

alter table "public"."live_sessions" add constraint "live_sessions_private_requires_key_check" CHECK ((((visibility = 'private'::public.live_session_visibility) AND (session_key IS NOT NULL) AND (session_key <> ''::text)) OR (visibility <> 'private'::public.live_session_visibility))) not valid;

alter table "public"."live_sessions" validate constraint "live_sessions_private_requires_key_check";

alter table "public"."live_sessions" add constraint "live_sessions_published_course_id_fkey" FOREIGN KEY (published_course_id) REFERENCES public.published_courses(id) ON DELETE SET NULL not valid;

alter table "public"."live_sessions" validate constraint "live_sessions_published_course_id_fkey";

alter table "public"."live_sessions" add constraint "live_sessions_session_code_key" UNIQUE using index "live_sessions_session_code_key";

alter table "public"."live_sessions" add constraint "live_sessions_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."live_sessions" validate constraint "live_sessions_updated_by_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.add_creator_as_facilitator()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_role text;
  v_user uuid := (select auth.uid()); -- Authenticated user performing the insert
begin
  -- Fetch user's role within the session's organization
  select public.get_user_org_role(NEW.organization_id, v_user)
    into v_role;

  -- Only auto-add if user is an editor (staff)
  if v_role = 'editor' then
    insert into public.live_session_facilitators (live_session_id, user_id, organization_id, added_by)
    values (NEW.id, v_user, NEW.organization_id, v_user)
    on conflict (live_session_id, user_id) do nothing;
  end if;

  return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.auto_start_scheduled_sessions()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_session record;
  v_started_sessions uuid[] := '{}';
  v_failed_sessions jsonb[] := '{}';
  v_validation_result jsonb;
begin
  -- Find all auto_start sessions ready to begin
  for v_session in
    select id, name, scheduled_start_time
    from public.live_sessions
    where session_type = 'auto_start'
      and status = 'waiting'
      and scheduled_start_time is not null
      and scheduled_start_time <= now()
    order by scheduled_start_time asc
  loop
    -- Validate session can start
    v_validation_result := public.can_start_live_session(v_session.id);

    if (v_validation_result->>'can_start')::boolean then
      -- Start the session by transitioning to active
      -- This will automatically:
      -- 1. Set actual_start_time to now()
      -- 2. Trigger play_state to become 'lobby' via existing triggers
      update public.live_sessions
      set
        status = 'active',
        actual_start_time = now(),
        play_state = 'lobby',
        updated_at = now()
      where id = v_session.id;

      -- Add to success list
      v_started_sessions := array_append(v_started_sessions, v_session.id);

      -- TODO: Consider emitting a notification/event here for participants
      -- that the session has started

    else
      -- Add to failed list with reason
      v_failed_sessions := array_append(
        v_failed_sessions,
        jsonb_build_object(
          'session_id', v_session.id,
          'session_name', v_session.name,
          'scheduled_time', v_session.scheduled_start_time,
          'errors', v_validation_result->'errors'
        )
      );
    end if;
  end loop;

  -- Return summary
  return jsonb_build_object(
    'started_count', array_length(v_started_sessions, 1),
    'started_session_ids', v_started_sessions,
    'failed_count', array_length(v_failed_sessions, 1),
    'failed_sessions', v_failed_sessions,
    'executed_at', now()
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_leaderboard_ranks(p_session_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  with ranked_participants as (
    select
      id,
      row_number() over (
        order by
          total_score desc,
          average_response_time_ms asc nulls last
      ) as new_rank
    from public.live_session_participants
    where live_session_id = p_session_id
      and status = 'joined'
  )
  update public.live_session_participants p
  set
    rank = rp.new_rank,
    updated_at = now()
  from ranked_participants rp
  where p.id = rp.id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.can_start_live_session(arg_session_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_session record;
  v_block_count integer;
  v_errors text[] := '{}';
begin
  -- Get session details
  select
    id,
    name,
    image_url,
    status,
    session_type,
    scheduled_start_time
  into v_session
  from public.live_sessions
  where id = arg_session_id;

  -- Check if session exists
  if not found then
    return jsonb_build_object(
      'can_start', false,
      'errors', jsonb_build_array('Session not found')
    );
  end if;

  -- Check if session is already ended
  if v_session.status = 'ended' then
    v_errors := array_append(v_errors, 'Cannot start an ended session');
  end if;

  -- Check if auto_start sessions have scheduled_start_time
  if v_session.session_type = 'auto_start' and (v_session.scheduled_start_time is null) then
    v_errors := array_append(v_errors, 'Auto-start sessions must have a scheduled start time');
  end if;

  -- Check if thumbnail exists
  if v_session.image_url is null or v_session.image_url = '' then
    v_errors := array_append(v_errors, 'Session must have a thumbnail before starting');
  end if;

  -- Check if session has at least one block
  select count(*)
  into v_block_count
  from public.live_session_blocks
  where session_id = arg_session_id;

  if v_block_count = 0 then
    v_errors := array_append(v_errors, 'Session must have at least one block before starting');
  end if;

  -- Return result
  if array_length(v_errors, 1) > 0 then
    return jsonb_build_object(
      'can_start', false,
      'errors', array_to_json(v_errors)
    );
  else
    return jsonb_build_object(
      'can_start', true,
      'errors', jsonb_build_array()
    );
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.can_user_edit_live_session(arg_session_id uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select coalesce(
    (
      -- Step 1: Fetch session and organization info
      with session_org as (
        select ls.id as session_id, ls.organization_id, ls.status
        from public.live_sessions ls
        where ls.id = arg_session_id
      )
      select
        -- Step 2: Check if session is ended (read-only)
        case
          -- If the session is ended, editing is disallowed
          when so.status = 'ended' then false

          -- If the org is in 'temp' tier, editing is disallowed
          when public.get_org_tier(so.organization_id) = 'temp' then false

          -- Step 3: Otherwise, check normal permissions
          else (
            -- User is an owner or admin in the organization
            public.get_user_org_role(so.organization_id, (select auth.uid())) in ('owner', 'admin')
            -- OR user is explicitly assigned as a session facilitator
            or exists (
              select 1
              from public.live_session_facilitators lsf
              where lsf.live_session_id = so.session_id
                and lsf.user_id = (select auth.uid())
            )
          )
        end
      from session_org so
    ),
    -- Step 4: Default to false if session does not exist
    false
  )
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_live_session_data()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  -- Delete any orphaned analytics entries (in case they weren't cascaded)
  delete from public.live_session_analytics
  where live_session_id = OLD.id;

  -- Log the deletion if needed (for audit purposes)
  -- This could be extended to log to an audit table

  return OLD;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.ensure_facilitator_is_valid()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  session_org uuid;
begin
  -- ✅ Fetch session organization_id (and confirm session exists)
  select ls.organization_id into session_org
  from public.live_sessions ls
  where ls.id = new.live_session_id;

  if session_org is null then
    raise exception
      'Invalid live_session_id: session % does not exist', new.live_session_id
      using errcode = 'P0001';
  end if;

  -- ✅ Ensure the facilitator's organization_id matches the session's org
  if new.organization_id <> session_org then
    raise exception
      'organization_id % does not match session''s organization_id % for session %',
      new.organization_id, session_org, new.live_session_id
      using errcode = 'P0001';
  end if;

  -- ✅ Ensure the user is a member of this organization
  if not exists (
    select 1
    from public.organization_members m
    where m.organization_id = session_org
      and m.user_id = new.user_id
  ) then
    raise exception
      'User % is not a member of organization % (session %)',
      new.user_id, session_org, new.live_session_id
      using errcode = 'P0001';
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_session_code()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  characters text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Exclude similar chars (0, O, I, 1)
  result text := '';
  i integer;
begin
  for i in 1..6 loop
    result := result || substr(characters, floor(random() * length(characters) + 1)::int, 1);
  end loop;
  return result;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.initialize_play_state_on_session_start()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  -- If actual_start_time is being set (from NULL to a value)
  -- and play_state is currently NULL, set it to 'lobby'
  if OLD.actual_start_time is null
     and NEW.actual_start_time is not null
     and NEW.play_state is null then
    NEW.play_state := 'lobby';
  end if;

  return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.join_live_session(p_session_code text, p_session_key text DEFAULT NULL::text, p_display_name text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_session_id uuid;
  v_session_visibility public.live_session_visibility;
  v_session_status public.live_session_status;
  v_required_key text;
  v_organization_id uuid;
  v_allow_late_join boolean;
  v_max_participants integer;
  v_current_participants integer;
  v_participant_id uuid;
  v_user_id uuid;
begin
  -- Get current user
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  -- Find session
  select
    id, visibility, status, session_key, organization_id, allow_late_join, max_participants
  into
    v_session_id, v_session_visibility, v_session_status, v_required_key, v_organization_id, v_allow_late_join, v_max_participants
  from public.live_sessions
  where session_code = upper(p_session_code);

  if v_session_id is null then
    raise exception 'Session not found';
  end if;

  -- Check if session is joinable
  if v_session_status = 'draft' then
    raise exception 'Session has not started yet';
  end if;

  if v_session_status = 'ended' then
    raise exception 'Session has already ended';
  end if;

  if v_session_status = 'active' and not v_allow_late_join then
    raise exception 'Late joining is not allowed for this session';
  end if;

  -- Check visibility and key
  if v_session_visibility = 'private' then
    if p_session_key is null or p_session_key != v_required_key then
      raise exception 'Invalid session key';
    end if;
  end if;

  -- Check if user is member of the organization
  if not exists (
    select 1 from public.organization_members
    where user_id = v_user_id and organization_id = v_organization_id
  ) then
    raise exception 'You must be a member of this organization to join';
  end if;

  -- Check max participants
  if v_max_participants is not null then
    select count(*) into v_current_participants
    from public.live_session_participants
    where live_session_id = v_session_id and status = 'joined';

    if v_current_participants >= v_max_participants then
      raise exception 'Session is full';
    end if;
  end if;

  -- Insert or update participant
  insert into public.live_session_participants (
    live_session_id,
    user_id,
    organization_id,
    display_name,
    status
  )
  values (
    v_session_id,
    v_user_id,
    v_organization_id,
    p_display_name,
    'joined'
  )
  on conflict (live_session_id, user_id)
  do update set
    status = 'joined',
    display_name = coalesce(excluded.display_name, public.live_session_participants.display_name),
    joined_at = now(),
    left_at = null,
    updated_at = now()
  returning id into v_participant_id;

  return jsonb_build_object(
    'success', true,
    'session_id', v_session_id,
    'participant_id', v_participant_id
  );

exception
  when others then
    return jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.leave_live_session(p_session_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  update public.live_session_participants
  set
    status = 'left',
    left_at = now(),
    updated_at = now()
  where live_session_id = p_session_id
    and user_id = v_user_id
    and status = 'joined';

  if not found then
    raise exception 'Participant not found or already left';
  end if;

  return jsonb_build_object('success', true);

exception
  when others then
    return jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.reorder_live_session_blocks(block_positions jsonb, p_live_session_id uuid, p_updated_by uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  block_item jsonb;
begin
  -- Validate user has permission
  if not exists (
    select 1 from public.live_sessions
    where id = p_live_session_id
      and (
        created_by = p_updated_by
        or organization_id in (
          select organization_id from public.organization_members
          where user_id = p_updated_by and role in ('owner', 'admin')
        )
      )
  ) then
    raise exception 'Permission denied';
  end if;

  -- Update each block's position
  for block_item in select * from jsonb_array_elements(block_positions)
  loop
    update public.live_session_blocks
    set
      position = (block_item->>'position')::integer,
      updated_by = p_updated_by,
      updated_at = now()
    where id = (block_item->>'id')::uuid
      and live_session_id = p_live_session_id;
  end loop;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.reset_live_session_on_mode_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  -- Only proceed if mode actually changed
  if OLD.mode is distinct from NEW.mode then

    -- Reset session lifecycle state
    NEW.status := 'draft';
    NEW.play_state := null; -- Set to NULL since session hasn't started
    NEW.actual_start_time := null;
    NEW.ended_at := null;

    -- Delete all test responses (regardless of which mode we're switching to/from)
    delete from public.live_session_test_responses
    where live_session_id = NEW.id;

    -- Delete all live responses (regardless of which mode we're switching to/from)
    delete from public.live_session_responses
    where live_session_id = NEW.id;

    -- Delete all participants (will cascade to responses due to FK)
    delete from public.live_session_participants
    where live_session_id = NEW.id;

    -- Delete all messages
    delete from public.live_session_messages
    where live_session_id = NEW.id;

    -- Delete all reactions
    delete from public.live_session_reactions
    where live_session_id = NEW.id;

    -- Reset block statistics and state
    update public.live_session_blocks
    set
      status = 'pending',
      activated_at = null,
      closed_at = null,
      total_responses = 0,
      correct_responses = 0,
      average_response_time_ms = null,
      updated_at = now()
    where live_session_id = NEW.id;

    -- Reset or delete analytics (optional: you might want to keep historical data)
    delete from public.live_session_analytics
    where live_session_id = NEW.id;

  end if;

  return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_generate_session_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if new.session_code is null or new.session_code = '' then
    loop
      new.session_code := public.generate_session_code();
      exit when not exists (
        select 1
        from public.live_sessions
        where session_code = new.session_code
      );
    end loop;
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_update_stats_after_response()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  -- Update block stats
  perform public.update_block_stats(new.live_session_block_id);

  -- Update participant stats
  perform public.update_participant_stats(new.participant_id);

  -- Recalculate leaderboard ranks
  perform public.calculate_leaderboard_ranks(new.live_session_id);

  -- Update session analytics
  perform public.update_session_analytics(new.live_session_id);

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_block_stats(p_block_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  update public.live_session_blocks
  set
    total_responses = (
      select count(*)
      from public.live_session_responses
      where live_session_block_id = p_block_id
    ),
    correct_responses = (
      select count(*)
      from public.live_session_responses
      where live_session_block_id = p_block_id
        and status = 'correct'
    ),
    average_response_time_ms = (
      select avg(response_time_ms)::int
      from public.live_session_responses
      where live_session_block_id = p_block_id
    ),
    updated_at = now()
  where id = p_block_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_live_session_block_stats()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_total_responses integer;
  v_correct_responses integer;
  v_avg_response_time integer;
begin
  -- Calculate statistics for the block
  select
    count(*),
    count(*) filter (where status = 'correct'),
    avg(response_time_ms)::integer
  into
    v_total_responses,
    v_correct_responses,
    v_avg_response_time
  from public.live_session_responses
  where live_session_block_id = coalesce(NEW.live_session_block_id, OLD.live_session_block_id);

  -- Update the block with new statistics
  update public.live_session_blocks
  set
    total_responses = v_total_responses,
    correct_responses = v_correct_responses,
    average_response_time_ms = v_avg_response_time,
    updated_at = now()
  where id = coalesce(NEW.live_session_block_id, OLD.live_session_block_id);

  return coalesce(NEW, OLD);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_live_session_participant_stats()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_total_responses integer;
  v_correct_responses integer;
  v_total_score numeric;
  v_avg_response_time integer;
begin
  -- Calculate statistics for the participant
  select
    count(*),
    count(*) filter (where status = 'correct'),
    coalesce(sum(score_earned), 0),
    avg(response_time_ms)::integer
  into
    v_total_responses,
    v_correct_responses,
    v_total_score,
    v_avg_response_time
  from public.live_session_responses
  where participant_id = coalesce(NEW.participant_id, OLD.participant_id);

  -- Update the participant with new statistics
  update public.live_session_participants
  set
    total_responses = v_total_responses,
    correct_responses = v_correct_responses,
    total_score = v_total_score,
    average_response_time_ms = v_avg_response_time,
    updated_at = now()
  where id = coalesce(NEW.participant_id, OLD.participant_id);

  return coalesce(NEW, OLD);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_participant_rankings()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  -- Update rankings for all participants in the session
  -- Rankings are based on total_score (descending) and average_response_time_ms (ascending)
  with ranked_participants as (
    select
      id,
      row_number() over (
        order by
          total_score desc,
          average_response_time_ms asc nulls last,
          joined_at asc
      ) as new_rank
    from public.live_session_participants
    where live_session_id = NEW.live_session_id
      and status = 'joined'
  )
  update public.live_session_participants lsp
  set
    rank = rp.new_rank,
    updated_at = now()
  from ranked_participants rp
  where lsp.id = rp.id
    and (lsp.rank is distinct from rp.new_rank); -- Only update if rank changed

  return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_participant_stats(p_participant_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  update public.live_session_participants
  set
    total_responses = (
      select count(*)
      from public.live_session_responses
      where participant_id = p_participant_id
    ),
    correct_responses = (
      select count(*)
      from public.live_session_responses
      where participant_id = p_participant_id
        and status = 'correct'
    ),
    total_score = (
      select coalesce(sum(score_earned), 0)
      from public.live_session_responses
      where participant_id = p_participant_id
    ),
    average_response_time_ms = (
      select avg(response_time_ms)::int
      from public.live_session_responses
      where participant_id = p_participant_id
    ),
    updated_at = now()
  where id = p_participant_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_session_analytics(p_session_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_total_participants integer;
  v_total_responses integer;
  v_total_blocks integer;
begin
  -- Get counts
  select count(*) into v_total_participants
  from public.live_session_participants
  where live_session_id = p_session_id;

  select count(*) into v_total_responses
  from public.live_session_responses
  where live_session_id = p_session_id;

  select count(*) into v_total_blocks
  from public.live_session_blocks
  where live_session_id = p_session_id
    and status in ('closed', 'active');

  -- Upsert analytics
  insert into public.live_session_analytics (
    live_session_id,
    organization_id,
    total_participants,
    total_responses,
    participation_rate,
    average_response_time_ms,
    average_score,
    median_score,
    highest_score,
    lowest_score,
    accuracy_rate
  )
  select
    p_session_id,
    ls.organization_id,
    v_total_participants,
    v_total_responses,
    -- Participation rate: (responses / (participants * blocks)) * 100
    case
      when v_total_participants > 0 and v_total_blocks > 0
      then (v_total_responses::numeric / (v_total_participants * v_total_blocks)) * 100
      else null
    end,
    -- Average response time
    (select avg(response_time_ms)::int from public.live_session_responses where live_session_id = p_session_id),
    -- Average score
    (select avg(lsp.total_score) from public.live_session_participants lsp where lsp.live_session_id = p_session_id),
    -- Median score
    (select percentile_cont(0.5) within group (order by lsp.total_score)
     from public.live_session_participants lsp where lsp.live_session_id = p_session_id),
    -- Highest score
    (select max(lsp.total_score) from public.live_session_participants lsp where lsp.live_session_id = p_session_id),
    -- Lowest score
    (select min(lsp.total_score) from public.live_session_participants lsp where lsp.live_session_id = p_session_id),
    -- Accuracy rate: (correct responses / total responses) * 100
    case
      when v_total_responses > 0
      then (
        select count(*)::numeric / v_total_responses * 100
        from public.live_session_responses
        where live_session_id = p_session_id
          and status = 'correct'
      )
      else null
    end
  from public.live_sessions ls
  where ls.id = p_session_id
  on conflict (live_session_id)
  do update set
    total_participants = excluded.total_participants,
    total_responses = excluded.total_responses,
    participation_rate = excluded.participation_rate,
    average_response_time_ms = excluded.average_response_time_ms,
    average_score = excluded.average_score,
    median_score = excluded.median_score,
    highest_score = excluded.highest_score,
    lowest_score = excluded.lowest_score,
    accuracy_rate = excluded.accuracy_rate,
    updated_at = now();
end;
$function$
;

CREATE OR REPLACE FUNCTION public.chk_org_storage_for_course(org_id uuid, net_storage_change_bytes bigint, course_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  storage_limit_mb integer;
  storage_limit_bytes bigint;
  builder_files bigint;
  published_files bigint;
  total_used bigint;
  available bigint;
  allowed boolean;
begin
  -- 1. Fetch org tier
  select coalesce(tl.storage_limit_mb_per_org, 0)
  into storage_limit_mb
  from public.organizations o
  join public.organization_subscriptions os on o.id = os.organization_id
  join public.tier_limits tl on os.tier = tl.tier
  where o.id = org_id;

  if storage_limit_mb is null then
    raise exception 'Organization % or subscription not found', org_id;
  end if;

  storage_limit_bytes := storage_limit_mb::bigint * 1024 * 1024;

  -- 2. Builder files
  select coalesce(sum(size), 0)
  into builder_files
  from public.file_library
  where organization_id = org_id;

  -- 3. Published files
  select coalesce(sum(size), 0)
  into published_files
  from public.published_file_library
  where organization_id = org_id;

  -- 4. Totals
  total_used := builder_files + published_files;
  available := storage_limit_bytes - total_used;

  -- 5. Allow?
  allowed := available >= net_storage_change_bytes;

  -- 6. Return JSON
  return jsonb_build_object(
    'storage_limit_mb', storage_limit_mb,
    'storage_limit_bytes', storage_limit_bytes,
    'storage_limit_readable', public.readable_size(storage_limit_bytes),

    'usage', jsonb_build_object(
      'builder_files_bytes', builder_files,
      'builder_files_readable', public.readable_size(builder_files),

      'published_files_bytes', published_files,
      'published_files_readable', public.readable_size(published_files),

      'total_used_bytes', total_used,
      'total_used_readable', public.readable_size(total_used),

      'available_bytes', available,
      'available_readable', public.readable_size(available),

      'usage_percentage',
        case when storage_limit_bytes > 0
          then round((total_used::numeric / storage_limit_bytes::numeric * 100)::numeric, 2)
          else 0 end
    ),

    'change', jsonb_build_object(
      'net_storage_change_bytes', net_storage_change_bytes,
      'net_storage_change_readable', public.readable_size(net_storage_change_bytes),

      'available_after_change_bytes', available - net_storage_change_bytes,
      'available_after_change_readable', public.readable_size(available - net_storage_change_bytes)
    ),

    'allowed', allowed,
    'reason', case
      when allowed then 'Enough storage available'
      else 'Not enough storage: requires ' || public.readable_size(net_storage_change_bytes)
            || ', but only ' || public.readable_size(available) || ' available.'
    end
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.readable_size(bytes bigint)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
begin
  if bytes is null then
    return '0 B';
  elsif bytes >= 1024 * 1024 * 1024 then
    return round(bytes::numeric / (1024 * 1024 * 1024), 2) || ' GB';
  elsif bytes >= 1024 * 1024 then
    return round(bytes::numeric / (1024 * 1024), 2) || ' MB';
  elsif bytes >= 1024 then
    return round(bytes::numeric / 1024, 2) || ' KB';
  else
    return bytes || ' B';
  end if;
end;
$function$
;

grant delete on table "public"."live_session_analytics" to "anon";

grant insert on table "public"."live_session_analytics" to "anon";

grant references on table "public"."live_session_analytics" to "anon";

grant select on table "public"."live_session_analytics" to "anon";

grant trigger on table "public"."live_session_analytics" to "anon";

grant truncate on table "public"."live_session_analytics" to "anon";

grant update on table "public"."live_session_analytics" to "anon";

grant delete on table "public"."live_session_analytics" to "authenticated";

grant insert on table "public"."live_session_analytics" to "authenticated";

grant references on table "public"."live_session_analytics" to "authenticated";

grant select on table "public"."live_session_analytics" to "authenticated";

grant trigger on table "public"."live_session_analytics" to "authenticated";

grant truncate on table "public"."live_session_analytics" to "authenticated";

grant update on table "public"."live_session_analytics" to "authenticated";

grant delete on table "public"."live_session_analytics" to "service_role";

grant insert on table "public"."live_session_analytics" to "service_role";

grant references on table "public"."live_session_analytics" to "service_role";

grant select on table "public"."live_session_analytics" to "service_role";

grant trigger on table "public"."live_session_analytics" to "service_role";

grant truncate on table "public"."live_session_analytics" to "service_role";

grant update on table "public"."live_session_analytics" to "service_role";

grant delete on table "public"."live_session_blocks" to "anon";

grant insert on table "public"."live_session_blocks" to "anon";

grant references on table "public"."live_session_blocks" to "anon";

grant select on table "public"."live_session_blocks" to "anon";

grant trigger on table "public"."live_session_blocks" to "anon";

grant truncate on table "public"."live_session_blocks" to "anon";

grant update on table "public"."live_session_blocks" to "anon";

grant delete on table "public"."live_session_blocks" to "authenticated";

grant insert on table "public"."live_session_blocks" to "authenticated";

grant references on table "public"."live_session_blocks" to "authenticated";

grant select on table "public"."live_session_blocks" to "authenticated";

grant trigger on table "public"."live_session_blocks" to "authenticated";

grant truncate on table "public"."live_session_blocks" to "authenticated";

grant update on table "public"."live_session_blocks" to "authenticated";

grant delete on table "public"."live_session_blocks" to "service_role";

grant insert on table "public"."live_session_blocks" to "service_role";

grant references on table "public"."live_session_blocks" to "service_role";

grant select on table "public"."live_session_blocks" to "service_role";

grant trigger on table "public"."live_session_blocks" to "service_role";

grant truncate on table "public"."live_session_blocks" to "service_role";

grant update on table "public"."live_session_blocks" to "service_role";

grant delete on table "public"."live_session_facilitators" to "anon";

grant insert on table "public"."live_session_facilitators" to "anon";

grant references on table "public"."live_session_facilitators" to "anon";

grant select on table "public"."live_session_facilitators" to "anon";

grant trigger on table "public"."live_session_facilitators" to "anon";

grant truncate on table "public"."live_session_facilitators" to "anon";

grant update on table "public"."live_session_facilitators" to "anon";

grant delete on table "public"."live_session_facilitators" to "authenticated";

grant insert on table "public"."live_session_facilitators" to "authenticated";

grant references on table "public"."live_session_facilitators" to "authenticated";

grant select on table "public"."live_session_facilitators" to "authenticated";

grant trigger on table "public"."live_session_facilitators" to "authenticated";

grant truncate on table "public"."live_session_facilitators" to "authenticated";

grant update on table "public"."live_session_facilitators" to "authenticated";

grant delete on table "public"."live_session_facilitators" to "service_role";

grant insert on table "public"."live_session_facilitators" to "service_role";

grant references on table "public"."live_session_facilitators" to "service_role";

grant select on table "public"."live_session_facilitators" to "service_role";

grant trigger on table "public"."live_session_facilitators" to "service_role";

grant truncate on table "public"."live_session_facilitators" to "service_role";

grant update on table "public"."live_session_facilitators" to "service_role";

grant delete on table "public"."live_session_messages" to "anon";

grant insert on table "public"."live_session_messages" to "anon";

grant references on table "public"."live_session_messages" to "anon";

grant select on table "public"."live_session_messages" to "anon";

grant trigger on table "public"."live_session_messages" to "anon";

grant truncate on table "public"."live_session_messages" to "anon";

grant update on table "public"."live_session_messages" to "anon";

grant delete on table "public"."live_session_messages" to "authenticated";

grant insert on table "public"."live_session_messages" to "authenticated";

grant references on table "public"."live_session_messages" to "authenticated";

grant select on table "public"."live_session_messages" to "authenticated";

grant trigger on table "public"."live_session_messages" to "authenticated";

grant truncate on table "public"."live_session_messages" to "authenticated";

grant update on table "public"."live_session_messages" to "authenticated";

grant delete on table "public"."live_session_messages" to "service_role";

grant insert on table "public"."live_session_messages" to "service_role";

grant references on table "public"."live_session_messages" to "service_role";

grant select on table "public"."live_session_messages" to "service_role";

grant trigger on table "public"."live_session_messages" to "service_role";

grant truncate on table "public"."live_session_messages" to "service_role";

grant update on table "public"."live_session_messages" to "service_role";

grant delete on table "public"."live_session_participants" to "anon";

grant insert on table "public"."live_session_participants" to "anon";

grant references on table "public"."live_session_participants" to "anon";

grant select on table "public"."live_session_participants" to "anon";

grant trigger on table "public"."live_session_participants" to "anon";

grant truncate on table "public"."live_session_participants" to "anon";

grant update on table "public"."live_session_participants" to "anon";

grant delete on table "public"."live_session_participants" to "authenticated";

grant insert on table "public"."live_session_participants" to "authenticated";

grant references on table "public"."live_session_participants" to "authenticated";

grant select on table "public"."live_session_participants" to "authenticated";

grant trigger on table "public"."live_session_participants" to "authenticated";

grant truncate on table "public"."live_session_participants" to "authenticated";

grant update on table "public"."live_session_participants" to "authenticated";

grant delete on table "public"."live_session_participants" to "service_role";

grant insert on table "public"."live_session_participants" to "service_role";

grant references on table "public"."live_session_participants" to "service_role";

grant select on table "public"."live_session_participants" to "service_role";

grant trigger on table "public"."live_session_participants" to "service_role";

grant truncate on table "public"."live_session_participants" to "service_role";

grant update on table "public"."live_session_participants" to "service_role";

grant delete on table "public"."live_session_reactions" to "anon";

grant insert on table "public"."live_session_reactions" to "anon";

grant references on table "public"."live_session_reactions" to "anon";

grant select on table "public"."live_session_reactions" to "anon";

grant trigger on table "public"."live_session_reactions" to "anon";

grant truncate on table "public"."live_session_reactions" to "anon";

grant update on table "public"."live_session_reactions" to "anon";

grant delete on table "public"."live_session_reactions" to "authenticated";

grant insert on table "public"."live_session_reactions" to "authenticated";

grant references on table "public"."live_session_reactions" to "authenticated";

grant select on table "public"."live_session_reactions" to "authenticated";

grant trigger on table "public"."live_session_reactions" to "authenticated";

grant truncate on table "public"."live_session_reactions" to "authenticated";

grant update on table "public"."live_session_reactions" to "authenticated";

grant delete on table "public"."live_session_reactions" to "service_role";

grant insert on table "public"."live_session_reactions" to "service_role";

grant references on table "public"."live_session_reactions" to "service_role";

grant select on table "public"."live_session_reactions" to "service_role";

grant trigger on table "public"."live_session_reactions" to "service_role";

grant truncate on table "public"."live_session_reactions" to "service_role";

grant update on table "public"."live_session_reactions" to "service_role";

grant delete on table "public"."live_session_responses" to "anon";

grant insert on table "public"."live_session_responses" to "anon";

grant references on table "public"."live_session_responses" to "anon";

grant select on table "public"."live_session_responses" to "anon";

grant trigger on table "public"."live_session_responses" to "anon";

grant truncate on table "public"."live_session_responses" to "anon";

grant update on table "public"."live_session_responses" to "anon";

grant delete on table "public"."live_session_responses" to "authenticated";

grant insert on table "public"."live_session_responses" to "authenticated";

grant references on table "public"."live_session_responses" to "authenticated";

grant select on table "public"."live_session_responses" to "authenticated";

grant trigger on table "public"."live_session_responses" to "authenticated";

grant truncate on table "public"."live_session_responses" to "authenticated";

grant update on table "public"."live_session_responses" to "authenticated";

grant delete on table "public"."live_session_responses" to "service_role";

grant insert on table "public"."live_session_responses" to "service_role";

grant references on table "public"."live_session_responses" to "service_role";

grant select on table "public"."live_session_responses" to "service_role";

grant trigger on table "public"."live_session_responses" to "service_role";

grant truncate on table "public"."live_session_responses" to "service_role";

grant update on table "public"."live_session_responses" to "service_role";

grant delete on table "public"."live_session_test_responses" to "anon";

grant insert on table "public"."live_session_test_responses" to "anon";

grant references on table "public"."live_session_test_responses" to "anon";

grant select on table "public"."live_session_test_responses" to "anon";

grant trigger on table "public"."live_session_test_responses" to "anon";

grant truncate on table "public"."live_session_test_responses" to "anon";

grant update on table "public"."live_session_test_responses" to "anon";

grant delete on table "public"."live_session_test_responses" to "authenticated";

grant insert on table "public"."live_session_test_responses" to "authenticated";

grant references on table "public"."live_session_test_responses" to "authenticated";

grant select on table "public"."live_session_test_responses" to "authenticated";

grant trigger on table "public"."live_session_test_responses" to "authenticated";

grant truncate on table "public"."live_session_test_responses" to "authenticated";

grant update on table "public"."live_session_test_responses" to "authenticated";

grant delete on table "public"."live_session_test_responses" to "service_role";

grant insert on table "public"."live_session_test_responses" to "service_role";

grant references on table "public"."live_session_test_responses" to "service_role";

grant select on table "public"."live_session_test_responses" to "service_role";

grant trigger on table "public"."live_session_test_responses" to "service_role";

grant truncate on table "public"."live_session_test_responses" to "service_role";

grant update on table "public"."live_session_test_responses" to "service_role";

grant delete on table "public"."live_sessions" to "anon";

grant insert on table "public"."live_sessions" to "anon";

grant references on table "public"."live_sessions" to "anon";

grant select on table "public"."live_sessions" to "anon";

grant trigger on table "public"."live_sessions" to "anon";

grant truncate on table "public"."live_sessions" to "anon";

grant update on table "public"."live_sessions" to "anon";

grant delete on table "public"."live_sessions" to "authenticated";

grant insert on table "public"."live_sessions" to "authenticated";

grant references on table "public"."live_sessions" to "authenticated";

grant select on table "public"."live_sessions" to "authenticated";

grant trigger on table "public"."live_sessions" to "authenticated";

grant truncate on table "public"."live_sessions" to "authenticated";

grant update on table "public"."live_sessions" to "authenticated";

grant delete on table "public"."live_sessions" to "service_role";

grant insert on table "public"."live_sessions" to "service_role";

grant references on table "public"."live_sessions" to "service_role";

grant select on table "public"."live_sessions" to "service_role";

grant trigger on table "public"."live_sessions" to "service_role";

grant truncate on table "public"."live_sessions" to "service_role";

grant update on table "public"."live_sessions" to "service_role";


  create policy "Select: Org members can view analytics"
  on "public"."live_session_analytics"
  as permissive
  for select
  to authenticated
using ((public.get_user_org_role(organization_id, ( SELECT auth.uid() AS uid)) IS NOT NULL));



  create policy "Delete: Admins or facilitators can delete blocks"
  on "public"."live_session_blocks"
  as permissive
  for delete
  to authenticated
using (public.can_user_edit_live_session(live_session_id));



  create policy "Insert: Admins or facilitators can create blocks"
  on "public"."live_session_blocks"
  as permissive
  for insert
  to authenticated
with check (public.can_user_edit_live_session(live_session_id));



  create policy "Select: Org members can view blocks"
  on "public"."live_session_blocks"
  as permissive
  for select
  to authenticated
using ((public.get_user_org_role(organization_id, ( SELECT auth.uid() AS uid)) IS NOT NULL));



  create policy "Update: Admins or facilitators can update blocks"
  on "public"."live_session_blocks"
  as permissive
  for update
  to authenticated
using (public.can_user_edit_live_session(live_session_id))
with check (public.can_user_edit_live_session(live_session_id));



  create policy "live-session-facilitators-delete-admins"
  on "public"."live_session_facilitators"
  as permissive
  for delete
  to public
using ((public.has_org_role(organization_id, 'admin'::text, ( SELECT auth.uid() AS uid)) AND (public.get_org_tier(organization_id) <> 'temp'::public.subscription_tier) AND (EXISTS ( SELECT 1
   FROM public.live_sessions ls
  WHERE ((ls.id = live_session_facilitators.live_session_id) AND (ls.status <> 'ended'::public.live_session_status))))));



  create policy "live-session-facilitators-insert-admins"
  on "public"."live_session_facilitators"
  as permissive
  for insert
  to public
with check ((public.has_org_role(organization_id, 'admin'::text, ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM public.organization_members m
  WHERE ((m.organization_id = live_session_facilitators.organization_id) AND (m.user_id = live_session_facilitators.user_id)))) AND (public.get_org_tier(organization_id) <> 'temp'::public.subscription_tier) AND (EXISTS ( SELECT 1
   FROM public.live_sessions ls
  WHERE ((ls.id = live_session_facilitators.live_session_id) AND (ls.status <> 'ended'::public.live_session_status))))));



  create policy "live-session-facilitators-select-org-members"
  on "public"."live_session_facilitators"
  as permissive
  for select
  to authenticated
using (public.has_org_role(organization_id, 'editor'::text, ( SELECT auth.uid() AS uid)));



  create policy "Insert: Participants can send messages"
  on "public"."live_session_messages"
  as permissive
  for insert
  to authenticated
with check (((user_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM (public.live_session_participants lsp
     JOIN public.live_sessions ls ON ((ls.id = lsp.live_session_id)))
  WHERE ((lsp.live_session_id = live_session_messages.live_session_id) AND (lsp.user_id = ( SELECT auth.uid() AS uid)) AND (lsp.status = 'joined'::public.live_participant_status) AND (ls.enable_chat = true) AND (ls.status <> 'ended'::public.live_session_status))))));



  create policy "Select: Active participants can view messages"
  on "public"."live_session_messages"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.live_session_participants lsp
  WHERE ((lsp.live_session_id = live_session_messages.live_session_id) AND (lsp.user_id = ( SELECT auth.uid() AS uid)) AND (lsp.status = 'joined'::public.live_participant_status)))));



  create policy "Update: Facilitators can moderate messages"
  on "public"."live_session_messages"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.live_sessions ls
  WHERE ((ls.id = live_session_messages.live_session_id) AND public.can_user_edit_live_session(ls.id)))));



  create policy "Delete: Admins or facilitators can remove participants"
  on "public"."live_session_participants"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.live_sessions ls
  WHERE ((ls.id = live_session_participants.live_session_id) AND public.can_user_edit_live_session(ls.id)))));



  create policy "Insert: Users can join sessions"
  on "public"."live_session_participants"
  as permissive
  for insert
  to authenticated
with check (((user_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM public.live_sessions ls
  WHERE ((ls.id = live_session_participants.live_session_id) AND (public.get_user_org_role(ls.organization_id, ( SELECT auth.uid() AS uid)) IS NOT NULL) AND (ls.status <> 'ended'::public.live_session_status))))));



  create policy "Select: Org members can view participants"
  on "public"."live_session_participants"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.live_sessions ls
  WHERE ((ls.id = live_session_participants.live_session_id) AND (public.get_user_org_role(ls.organization_id, ( SELECT auth.uid() AS uid)) IS NOT NULL)))));



  create policy "Update: Users or facilitators can update participants"
  on "public"."live_session_participants"
  as permissive
  for update
  to authenticated
using (((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM public.live_sessions ls
  WHERE ((ls.id = live_session_participants.live_session_id) AND public.can_user_edit_live_session(ls.id))))));



  create policy "Insert: Participants can add reactions"
  on "public"."live_session_reactions"
  as permissive
  for insert
  to authenticated
with check (((user_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM (public.live_session_participants lsp
     JOIN public.live_sessions ls ON ((ls.id = lsp.live_session_id)))
  WHERE ((lsp.live_session_id = live_session_reactions.live_session_id) AND (lsp.user_id = ( SELECT auth.uid() AS uid)) AND (lsp.status = 'joined'::public.live_participant_status) AND (ls.enable_reactions = true) AND (ls.status <> 'ended'::public.live_session_status))))));



  create policy "Select: Participants can view reactions"
  on "public"."live_session_reactions"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.live_session_participants lsp
  WHERE ((lsp.live_session_id = live_session_reactions.live_session_id) AND (lsp.user_id = ( SELECT auth.uid() AS uid))))));



  create policy "Insert: Participants can submit responses"
  on "public"."live_session_responses"
  as permissive
  for insert
  to authenticated
with check (((user_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM public.live_session_participants lsp
  WHERE ((lsp.id = live_session_responses.participant_id) AND (lsp.user_id = ( SELECT auth.uid() AS uid)) AND (lsp.live_session_id = live_session_responses.live_session_id) AND (lsp.status = 'joined'::public.live_participant_status)))) AND (EXISTS ( SELECT 1
   FROM (public.live_session_blocks lsb
     JOIN public.live_sessions ls ON ((ls.id = lsb.live_session_id)))
  WHERE ((lsb.id = live_session_responses.live_session_block_id) AND (lsb.status = 'active'::public.live_session_block_status) AND (ls.status <> 'ended'::public.live_session_status))))));



  create policy "Select: Org members can view responses or users can view their "
  on "public"."live_session_responses"
  as permissive
  for select
  to authenticated
using (((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM public.live_sessions ls
  WHERE ((ls.id = live_session_responses.live_session_id) AND (public.get_user_org_role(ls.organization_id, ( SELECT auth.uid() AS uid)) IS NOT NULL))))));



  create policy "Delete: Facilitators can delete their own test responses"
  on "public"."live_session_test_responses"
  as permissive
  for delete
  to authenticated
using (((facilitator_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM public.live_sessions ls
  WHERE ((ls.id = live_session_test_responses.live_session_id) AND (ls.status <> 'ended'::public.live_session_status))))));



  create policy "Insert: Facilitators can submit test responses"
  on "public"."live_session_test_responses"
  as permissive
  for insert
  to authenticated
with check (((facilitator_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM (public.live_session_facilitators lsf
     JOIN public.live_sessions ls ON ((ls.id = lsf.live_session_id)))
  WHERE ((lsf.live_session_id = live_session_test_responses.live_session_id) AND (lsf.user_id = ( SELECT auth.uid() AS uid)) AND (ls.status <> 'ended'::public.live_session_status))))));



  create policy "Select: Org members can view test responses or facilitators can"
  on "public"."live_session_test_responses"
  as permissive
  for select
  to authenticated
using (((facilitator_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM public.live_sessions ls
  WHERE ((ls.id = live_session_test_responses.live_session_id) AND (public.get_user_org_role(ls.organization_id, ( SELECT auth.uid() AS uid)) IS NOT NULL))))));



  create policy "Update: Facilitators can update their own test responses"
  on "public"."live_session_test_responses"
  as permissive
  for update
  to authenticated
using (((facilitator_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM public.live_sessions ls
  WHERE ((ls.id = live_session_test_responses.live_session_id) AND (ls.status <> 'ended'::public.live_session_status))))))
with check (((facilitator_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM public.live_sessions ls
  WHERE ((ls.id = live_session_test_responses.live_session_id) AND (ls.status <> 'ended'::public.live_session_status))))));



  create policy "Delete: Admins can delete sessions"
  on "public"."live_sessions"
  as permissive
  for delete
  to authenticated
using (((public.get_user_org_role(organization_id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text])) AND (public.get_org_tier(organization_id) <> 'temp'::public.subscription_tier)));



  create policy "Insert: Org members can create sessions"
  on "public"."live_sessions"
  as permissive
  for insert
  to authenticated
with check (((public.get_user_org_role(organization_id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text, 'editor'::text])) AND (public.get_org_tier(organization_id) <> 'temp'::public.subscription_tier)));



  create policy "Select: Org members can view sessions"
  on "public"."live_sessions"
  as permissive
  for select
  to authenticated
using ((public.get_user_org_role(organization_id, ( SELECT auth.uid() AS uid)) IS NOT NULL));



  create policy "Update: Admins or facilitators can update sessions"
  on "public"."live_sessions"
  as permissive
  for update
  to public
using (public.can_user_edit_live_session(id))
with check (public.can_user_edit_live_session(id));


CREATE TRIGGER live_session_analytics_update_timestamp_trigger BEFORE UPDATE ON public.live_session_analytics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER live_session_blocks_update_timestamp_trigger BEFORE UPDATE ON public.live_session_blocks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_ensure_facilitator_is_valid BEFORE INSERT OR UPDATE ON public.live_session_facilitators FOR EACH ROW EXECUTE FUNCTION public.ensure_facilitator_is_valid();

CREATE TRIGGER live_session_participant_update_rankings AFTER UPDATE OF total_score, average_response_time_ms ON public.live_session_participants FOR EACH ROW EXECUTE FUNCTION public.update_participant_rankings();

CREATE TRIGGER live_session_participants_update_timestamp_trigger BEFORE UPDATE ON public.live_session_participants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER live_session_response_delete_update_block_stats AFTER DELETE ON public.live_session_responses FOR EACH ROW EXECUTE FUNCTION public.update_live_session_block_stats();

CREATE TRIGGER live_session_response_delete_update_participant_stats AFTER DELETE ON public.live_session_responses FOR EACH ROW EXECUTE FUNCTION public.update_live_session_participant_stats();

CREATE TRIGGER live_session_response_insert_update_block_stats AFTER INSERT ON public.live_session_responses FOR EACH ROW EXECUTE FUNCTION public.update_live_session_block_stats();

CREATE TRIGGER live_session_response_insert_update_participant_stats AFTER INSERT ON public.live_session_responses FOR EACH ROW EXECUTE FUNCTION public.update_live_session_participant_stats();

CREATE TRIGGER live_session_response_update_update_block_stats AFTER UPDATE ON public.live_session_responses FOR EACH ROW EXECUTE FUNCTION public.update_live_session_block_stats();

CREATE TRIGGER live_session_response_update_update_participant_stats AFTER UPDATE ON public.live_session_responses FOR EACH ROW EXECUTE FUNCTION public.update_live_session_participant_stats();

CREATE TRIGGER live_session_responses_update_stats_trigger AFTER INSERT ON public.live_session_responses FOR EACH ROW EXECUTE FUNCTION public.trigger_update_stats_after_response();

CREATE TRIGGER live_session_cleanup_trigger BEFORE DELETE ON public.live_sessions FOR EACH ROW EXECUTE FUNCTION public.cleanup_live_session_data();

CREATE TRIGGER live_session_initialize_play_state BEFORE UPDATE OF actual_start_time ON public.live_sessions FOR EACH ROW EXECUTE FUNCTION public.initialize_play_state_on_session_start();

CREATE TRIGGER live_session_mode_change_reset BEFORE UPDATE OF mode ON public.live_sessions FOR EACH ROW EXECUTE FUNCTION public.reset_live_session_on_mode_change();

CREATE TRIGGER live_sessions_generate_code_trigger BEFORE INSERT ON public.live_sessions FOR EACH ROW EXECUTE FUNCTION public.trigger_generate_session_code();

CREATE TRIGGER live_sessions_update_timestamp_trigger BEFORE UPDATE ON public.live_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_add_creator_as_facilitator AFTER INSERT ON public.live_sessions FOR EACH ROW EXECUTE FUNCTION public.add_creator_as_facilitator();


