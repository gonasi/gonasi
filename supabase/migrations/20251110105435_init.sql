create type "public"."analytics_level" as enum ('basic', 'intermediate', 'advanced', 'enterprise');

create type "public"."app_permission" as enum ('go_su_create', 'go_su_read', 'go_su_update', 'go_su_delete', 'go_admin_create', 'go_admin_read', 'go_admin_update', 'go_admin_delete', 'go_staff_create', 'go_staff_read', 'go_staff_update', 'go_staff_delete');

create type "public"."app_role" as enum ('go_su', 'go_admin', 'go_staff', 'user');

create type "public"."course_access" as enum ('public', 'unlisted', 'private');

create type "public"."currency_code" as enum ('KES', 'USD');

create type "public"."file_type" as enum ('image', 'audio', 'video', 'model3d', 'document', 'other');

create type "public"."invite_delivery_status" as enum ('pending', 'sent', 'failed');

create type "public"."ledger_transaction_type" as enum ('course_purchase', 'payment_inflow', 'org_payout', 'platform_revenue', 'payment_gateway_fee', 'subscription_payment', 'ai_credit_purchase', 'sponsorship_payment', 'funds_hold', 'funds_release', 'withdrawal_request', 'withdrawal_complete', 'withdrawal_failed', 'reward_payout', 'refund', 'chargeback', 'manual_adjustment', 'currency_conversion', 'tax_withholding', 'tax_remittance');

create type "public"."org_role" as enum ('owner', 'admin', 'editor');

create type "public"."payment_frequency" as enum ('monthly', 'bi_monthly', 'quarterly', 'semi_annual', 'annual');

create type "public"."profile_mode" as enum ('personal', 'organization');

create type "public"."subscription_status" as enum ('active', 'non-renewing', 'attention', 'completed', 'cancelled');

create type "public"."subscription_tier" as enum ('launch', 'scale', 'impact', 'enterprise');

create type "public"."support_level" as enum ('community', 'email', 'priority', 'dedicated');

create type "public"."transaction_direction" as enum ('credit', 'debit');

create type "public"."transaction_status" as enum ('pending', 'completed', 'failed', 'cancelled', 'reversed');

create type "public"."user_notification_category" as enum ('commerce', 'learning', 'billing', 'social', 'system');

create type "public"."user_notification_key" as enum ('course_purchase_success', 'course_purchase_failed', 'course_refund_processed', 'course_subscription_started', 'course_subscription_renewed', 'course_subscription_failed', 'course_subscription_expiring', 'course_enrollment_free_success', 'lesson_completed', 'course_completed', 'streak_reminder', 'new_chapter_unlocked', 'payment_method_expiring', 'invoice_ready', 'account_security_alert', 'organization_invite_received', 'organization_invite_accepted', 'organization_role_changed', 'announcement', 'maintenance_notice');

create type "public"."wallet_type" as enum ('platform', 'organization', 'user', 'external');


  create table "public"."ai_usage_log" (
    "id" uuid not null default gen_random_uuid(),
    "org_id" uuid not null,
    "user_id" uuid not null,
    "credits_used" integer not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."ai_usage_log" enable row level security;


  create table "public"."block_progress" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "lesson_progress_id" uuid not null,
    "organization_id" uuid not null,
    "published_course_id" uuid not null,
    "chapter_id" uuid not null,
    "lesson_id" uuid not null,
    "block_id" uuid not null,
    "block_weight" numeric not null default 1.0,
    "is_completed" boolean not null default false,
    "started_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "completed_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "time_spent_seconds" integer not null default 0,
    "progress_percentage" numeric generated always as (
CASE
    WHEN (is_completed = true) THEN 100
    ELSE 0
END) stored,
    "earned_score" numeric,
    "attempt_count" integer,
    "interaction_data" jsonb,
    "last_response" jsonb,
    "user_id" uuid not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."block_progress" enable row level security;


  create table "public"."chapter_progress" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "course_progress_id" uuid not null,
    "user_id" uuid not null,
    "published_course_id" uuid not null,
    "chapter_id" uuid not null,
    "total_lessons" integer not null,
    "completed_lessons" integer not null default 0,
    "total_blocks" integer not null,
    "completed_blocks" integer not null default 0,
    "is_completed" boolean not null default false,
    "total_weight" numeric not null default 0,
    "completed_weight" numeric not null default 0,
    "progress_percentage" numeric generated always as (
CASE
    WHEN (total_weight > (0)::numeric) THEN ((completed_weight / total_weight) * (100)::numeric)
    ELSE (0)::numeric
END) stored,
    "total_lesson_weight" numeric not null default 0,
    "completed_lesson_weight" numeric not null default 0,
    "lesson_progress_percentage" numeric generated always as (
CASE
    WHEN (total_lesson_weight > (0)::numeric) THEN ((completed_lesson_weight / total_lesson_weight) * (100)::numeric)
    ELSE (0)::numeric
END) stored,
    "completed_at" timestamp with time zone,
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."chapter_progress" enable row level security;


  create table "public"."chapters" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "organization_id" uuid not null,
    "course_id" uuid not null,
    "name" text not null,
    "description" text,
    "position" integer default 0,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_by" uuid,
    "updated_by" uuid
      );


alter table "public"."chapters" enable row level security;


  create table "public"."course_categories" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "name" text not null,
    "description" text not null,
    "course_count" bigint not null default 0,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_by" uuid,
    "updated_by" uuid
      );


alter table "public"."course_categories" enable row level security;


  create table "public"."course_editors" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "course_id" uuid not null,
    "organization_id" uuid not null,
    "user_id" uuid not null,
    "added_by" uuid,
    "added_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."course_editors" enable row level security;


  create table "public"."course_enrollment_activities" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "enrollment_id" uuid not null,
    "tier_name" text,
    "tier_description" text,
    "payment_frequency" public.payment_frequency not null,
    "currency_code" public.currency_code not null,
    "is_free" boolean not null,
    "price_paid" numeric(19,4) not null default 0,
    "promotional_price" numeric(19,4),
    "was_promotional" boolean not null default false,
    "access_start" timestamp with time zone not null,
    "access_end" timestamp with time zone not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_by" uuid not null
      );


alter table "public"."course_enrollment_activities" enable row level security;


  create table "public"."course_enrollments" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "published_course_id" uuid not null,
    "organization_id" uuid not null,
    "enrolled_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "expires_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."course_enrollments" enable row level security;


  create table "public"."course_payments" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "enrollment_id" uuid not null,
    "enrollment_activity_id" uuid not null,
    "amount_paid" numeric(19,4) not null,
    "currency_code" public.currency_code not null,
    "payment_method" text not null,
    "payment_processor_id" text,
    "payment_processor_fee" numeric(19,4),
    "net_amount" numeric(19,4) not null,
    "platform_fee" numeric(19,4) not null,
    "platform_fee_percent" numeric(5,2) not null,
    "org_payout_amount" numeric(19,4) not null,
    "payment_intent_id" text,
    "organization_id" uuid not null,
    "payout_processed_at" timestamp with time zone,
    "payment_metadata" jsonb,
    "refund_amount" numeric(19,4) default 0,
    "refund_reason" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_by" uuid not null
      );


alter table "public"."course_payments" enable row level security;


  create table "public"."course_pricing_tiers" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "organization_id" uuid not null,
    "course_id" uuid not null,
    "payment_frequency" public.payment_frequency not null,
    "is_free" boolean not null default true,
    "price" numeric(19,4) not null,
    "currency_code" public.currency_code not null default 'KES'::public.currency_code,
    "promotional_price" numeric(19,4),
    "promotion_start_date" timestamp with time zone,
    "promotion_end_date" timestamp with time zone,
    "tier_name" text,
    "tier_description" text,
    "is_active" boolean not null default true,
    "position" integer not null default 0,
    "is_popular" boolean not null default false,
    "is_recommended" boolean not null default false,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_by" uuid not null,
    "updated_by" uuid not null
      );


alter table "public"."course_pricing_tiers" enable row level security;


  create table "public"."course_progress" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "published_course_id" uuid not null,
    "total_blocks" integer not null,
    "completed_blocks" integer not null default 0,
    "total_lessons" integer not null,
    "completed_lessons" integer not null default 0,
    "is_completed" boolean not null default false,
    "total_chapters" integer not null,
    "completed_chapters" integer not null default 0,
    "total_weight" numeric not null default 0,
    "completed_weight" numeric not null default 0,
    "progress_percentage" numeric generated always as (
CASE
    WHEN (total_weight > (0)::numeric) THEN ((completed_weight / total_weight) * (100)::numeric)
    ELSE (0)::numeric
END) stored,
    "total_lesson_weight" numeric not null default 0,
    "completed_lesson_weight" numeric not null default 0,
    "lesson_progress_percentage" numeric generated always as (
CASE
    WHEN (total_lesson_weight > (0)::numeric) THEN ((completed_lesson_weight / total_lesson_weight) * (100)::numeric)
    ELSE (0)::numeric
END) stored,
    "completed_at" timestamp with time zone,
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."course_progress" enable row level security;


  create table "public"."course_sub_categories" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "category_id" uuid not null,
    "name" text not null,
    "course_count" bigint not null default 0,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_by" uuid,
    "updated_by" uuid
      );


alter table "public"."course_sub_categories" enable row level security;


  create table "public"."courses" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "category_id" uuid,
    "subcategory_id" uuid,
    "organization_id" uuid,
    "name" text not null,
    "description" text,
    "image_url" text,
    "blur_hash" text,
    "visibility" public.course_access not null default 'public'::public.course_access,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "last_published" timestamp with time zone,
    "created_by" uuid,
    "updated_by" uuid
      );


alter table "public"."courses" enable row level security;


  create table "public"."file_library" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "course_id" uuid not null,
    "organization_id" uuid not null,
    "created_by" uuid,
    "updated_by" uuid,
    "name" text not null,
    "path" text not null,
    "size" bigint not null,
    "mime_type" text not null,
    "extension" text not null,
    "file_type" public.file_type not null default 'other'::public.file_type,
    "blur_preview" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."file_library" enable row level security;


  create table "public"."gonasi_wallets" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "currency_code" public.currency_code not null,
    "balance_total" numeric(19,4) not null default 0,
    "balance_reserved" numeric(19,4) not null default 0,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."gonasi_wallets" enable row level security;


  create table "public"."lesson_blocks" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "lesson_id" uuid not null,
    "course_id" uuid not null,
    "chapter_id" uuid not null,
    "organization_id" uuid not null,
    "plugin_type" text not null,
    "position" integer not null default 0,
    "content" jsonb not null default '{}'::jsonb,
    "settings" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_by" uuid,
    "updated_by" uuid
      );


alter table "public"."lesson_blocks" enable row level security;


  create table "public"."lesson_progress" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "chapter_progress_id" uuid not null,
    "user_id" uuid not null,
    "published_course_id" uuid not null,
    "lesson_id" uuid not null,
    "total_blocks" integer not null,
    "completed_blocks" integer not null default 0,
    "is_completed" boolean not null default false,
    "total_weight" numeric not null default 0,
    "completed_weight" numeric not null default 0,
    "progress_percentage" numeric generated always as (
CASE
    WHEN (total_weight > (0)::numeric) THEN ((completed_weight / total_weight) * (100)::numeric)
    ELSE (0)::numeric
END) stored,
    "completed_at" timestamp with time zone,
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."lesson_progress" enable row level security;


  create table "public"."lesson_reset_count" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "published_course_id" uuid not null,
    "lesson_id" uuid not null,
    "reset_count" integer not null default 0,
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."lesson_reset_count" enable row level security;


  create table "public"."lesson_types" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "name" text not null,
    "description" text not null,
    "lucide_icon" text not null,
    "bg_color" text not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_by" uuid,
    "updated_by" uuid
      );


alter table "public"."lesson_types" enable row level security;


  create table "public"."lessons" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "course_id" uuid not null,
    "organization_id" uuid not null,
    "chapter_id" uuid not null,
    "lesson_type_id" uuid not null,
    "name" text not null,
    "position" integer default 0,
    "settings" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_by" uuid,
    "updated_by" uuid
      );


alter table "public"."lessons" enable row level security;


  create table "public"."organization_invites" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "email" text not null,
    "role" public.org_role not null,
    "invited_by" uuid not null,
    "token" text not null,
    "resend_count" integer not null default 0,
    "last_sent_at" timestamp with time zone not null default now(),
    "expires_at" timestamp with time zone not null,
    "accepted_at" timestamp with time zone,
    "accepted_by" uuid,
    "revoked_at" timestamp with time zone,
    "delivery_status" public.invite_delivery_status not null default 'pending'::public.invite_delivery_status,
    "delivery_logs" jsonb not null default '[]'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."organization_invites" enable row level security;


  create table "public"."organization_members" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "user_id" uuid not null,
    "role" public.org_role not null,
    "invited_by" uuid,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."organization_members" enable row level security;


  create table "public"."organization_subscriptions" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "organization_id" uuid not null,
    "tier" public.subscription_tier not null default 'launch'::public.subscription_tier,
    "status" public.subscription_status not null default 'active'::public.subscription_status,
    "start_date" timestamp with time zone not null default timezone('utc'::text, now()),
    "current_period_start" timestamp with time zone not null default timezone('utc'::text, now()),
    "current_period_end" timestamp with time zone,
    "cancel_at_period_end" boolean not null default false,
    "initial_next_payment_date" timestamp with time zone,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_by" uuid,
    "updated_by" uuid
      );


alter table "public"."organization_subscriptions" enable row level security;


  create table "public"."organization_wallets" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "organization_id" uuid not null,
    "currency_code" public.currency_code not null,
    "balance_total" numeric(19,4) not null default 0,
    "balance_reserved" numeric(19,4) not null default 0,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."organization_wallets" enable row level security;


  create table "public"."organizations" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "name" text not null,
    "handle" text not null,
    "description" text,
    "website_url" text,
    "avatar_url" text,
    "blur_hash" text,
    "banner_url" text,
    "banner_blur_hash" text,
    "is_public" boolean not null default true,
    "is_verified" boolean not null default false,
    "email" text,
    "phone_number" text,
    "phone_number_verified" boolean not null default false,
    "email_verified" boolean not null default false,
    "whatsapp_number" text,
    "location" text,
    "tier" public.subscription_tier not null default 'launch'::public.subscription_tier,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_by" uuid,
    "owned_by" uuid,
    "updated_by" uuid,
    "deleted_by" uuid
      );


alter table "public"."organizations" enable row level security;


  create table "public"."organizations_ai_credits" (
    "org_id" uuid not null,
    "base_credits_total" integer not null default 100,
    "base_credits_remaining" integer not null default 100,
    "purchased_credits_total" integer not null default 0,
    "purchased_credits_remaining" integer not null default 0,
    "last_reset_at" timestamp with time zone not null default now(),
    "next_reset_at" timestamp with time zone not null default (now() + '1 mon'::interval),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."organizations_ai_credits" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null,
    "username" text,
    "email" text not null,
    "full_name" text,
    "avatar_url" text,
    "blur_hash" text,
    "phone_number" text,
    "phone_number_verified" boolean not null default false,
    "email_verified" boolean not null default false,
    "is_public" boolean not null default true,
    "country_code" character(2) default 'KE'::bpchar,
    "preferred_language" character(2) default 'en'::bpchar,
    "account_verified" boolean not null default false,
    "notifications_enabled" boolean not null default true,
    "mode" public.profile_mode not null default 'personal'::public.profile_mode,
    "active_organization_id" uuid,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."profiles" enable row level security;


  create table "public"."published_course_structure_content" (
    "id" uuid not null,
    "course_structure_content" jsonb not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."published_course_structure_content" enable row level security;


  create table "public"."published_courses" (
    "id" uuid not null,
    "organization_id" uuid not null,
    "category_id" uuid,
    "subcategory_id" uuid,
    "version" integer not null default 1,
    "is_active" boolean not null default true,
    "name" text not null,
    "description" text not null,
    "image_url" text not null,
    "blur_hash" text,
    "visibility" public.course_access not null default 'public'::public.course_access,
    "course_structure_overview" jsonb not null,
    "total_chapters" integer not null,
    "total_lessons" integer not null,
    "total_blocks" integer not null,
    "pricing_tiers" jsonb not null default '[]'::jsonb,
    "has_free_tier" boolean,
    "min_price" numeric,
    "published_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "published_by" uuid not null,
    "total_enrollments" integer not null default 0,
    "active_enrollments" integer not null default 0,
    "completion_rate" numeric(5,2) default 0.00,
    "average_rating" numeric(3,2),
    "total_reviews" integer not null default 0,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."published_courses" enable row level security;


  create table "public"."published_file_library" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "course_id" uuid not null,
    "organization_id" uuid not null,
    "created_by" uuid,
    "updated_by" uuid,
    "name" text not null,
    "path" text not null,
    "size" bigint not null,
    "mime_type" text not null,
    "extension" text not null,
    "file_type" public.file_type not null default 'other'::public.file_type,
    "blur_preview" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."published_file_library" enable row level security;


  create table "public"."role_permissions" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "role" public.app_role not null,
    "permission" public.app_permission not null
      );


alter table "public"."role_permissions" enable row level security;


  create table "public"."tier_limits" (
    "tier" public.subscription_tier not null,
    "max_organizations_per_user" integer not null,
    "storage_limit_mb_per_org" integer not null,
    "max_members_per_org" integer not null,
    "max_free_courses_per_org" integer not null,
    "ai_tools_enabled" boolean not null default true,
    "ai_usage_limit_monthly" integer,
    "custom_domains_enabled" boolean not null default false,
    "max_custom_domains" integer,
    "analytics_level" public.analytics_level not null,
    "support_level" public.support_level not null,
    "platform_fee_percentage" numeric(5,2) not null default 15.00,
    "white_label_enabled" boolean not null default false,
    "price_monthly_usd" numeric(10,2) not null default 0.00,
    "price_yearly_usd" numeric(10,2) not null default 0.00,
    "paystack_plan_id" text,
    "paystack_plan_code" text,
    "plan_currency" text not null default 'USD'::text,
    "plan_interval" text not null default 'monthly'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."tier_limits" enable row level security;


  create table "public"."user_notifications" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "key" public.user_notification_key not null,
    "title" text not null,
    "body" text not null,
    "payload" jsonb not null default '{}'::jsonb,
    "delivered_in_app" boolean not null default true,
    "delivered_email" boolean not null default false,
    "email_job_id" text,
    "read_at" timestamp with time zone,
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."user_notifications" enable row level security;


  create table "public"."user_notifications_types" (
    "id" uuid not null default gen_random_uuid(),
    "key" public.user_notification_key not null,
    "category" public.user_notification_category not null,
    "default_in_app" boolean not null default true,
    "default_email" boolean not null default false,
    "title_template" text not null,
    "body_template" text not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."user_notifications_types" enable row level security;


  create table "public"."user_purchases" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "published_course_id" uuid,
    "amount_paid" numeric(19,4) not null,
    "currency_code" public.currency_code not null,
    "transaction_type" public.ledger_transaction_type not null default 'payment_inflow'::public.ledger_transaction_type,
    "payment_reference" text not null,
    "status" public.transaction_status not null default 'completed'::public.transaction_status,
    "metadata" jsonb not null default '{}'::jsonb,
    "purchased_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."user_purchases" enable row level security;


  create table "public"."user_roles" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "role" public.app_role not null
      );


alter table "public"."user_roles" enable row level security;


  create table "public"."user_wallets" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "currency_code" public.currency_code not null,
    "balance_total" numeric(19,4) not null default 0,
    "balance_reserved" numeric(19,4) not null default 0,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."user_wallets" enable row level security;


  create table "public"."wallet_ledger_entries" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "source_wallet_id" uuid,
    "source_wallet_type" public.wallet_type not null,
    "destination_wallet_id" uuid,
    "destination_wallet_type" public.wallet_type not null,
    "currency_code" public.currency_code not null,
    "amount" numeric(19,4) not null,
    "direction" public.transaction_direction not null,
    "payment_reference" text not null,
    "type" public.ledger_transaction_type not null,
    "status" public.transaction_status not null default 'completed'::public.transaction_status,
    "related_entity_type" text,
    "related_entity_id" uuid,
    "metadata" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."wallet_ledger_entries" enable row level security;

CREATE UNIQUE INDEX ai_usage_log_pkey ON public.ai_usage_log USING btree (id);

CREATE UNIQUE INDEX block_progress_lesson_progress_id_block_id_key ON public.block_progress USING btree (lesson_progress_id, block_id);

CREATE UNIQUE INDEX block_progress_pkey ON public.block_progress USING btree (id);

CREATE UNIQUE INDEX block_progress_user_id_published_course_id_block_id_key ON public.block_progress USING btree (user_id, published_course_id, block_id);

CREATE UNIQUE INDEX chapter_progress_course_progress_id_chapter_id_key ON public.chapter_progress USING btree (course_progress_id, chapter_id);

CREATE UNIQUE INDEX chapter_progress_pkey ON public.chapter_progress USING btree (id);

CREATE UNIQUE INDEX chapter_progress_user_id_published_course_id_chapter_id_key ON public.chapter_progress USING btree (user_id, published_course_id, chapter_id);

CREATE UNIQUE INDEX chapters_pkey ON public.chapters USING btree (id);

CREATE UNIQUE INDEX course_categories_pkey ON public.course_categories USING btree (id);

CREATE UNIQUE INDEX course_editors_course_id_user_id_key ON public.course_editors USING btree (course_id, user_id);

CREATE UNIQUE INDEX course_editors_pkey ON public.course_editors USING btree (id);

CREATE UNIQUE INDEX course_enrollment_activities_pkey ON public.course_enrollment_activities USING btree (id);

CREATE UNIQUE INDEX course_enrollments_pkey ON public.course_enrollments USING btree (id);

CREATE UNIQUE INDEX course_payments_pkey ON public.course_payments USING btree (id);

CREATE UNIQUE INDEX course_pricing_tiers_pkey ON public.course_pricing_tiers USING btree (id);

CREATE UNIQUE INDEX course_progress_pkey ON public.course_progress USING btree (id);

CREATE UNIQUE INDEX course_progress_user_id_published_course_id_key ON public.course_progress USING btree (user_id, published_course_id);

CREATE UNIQUE INDEX course_sub_categories_pkey ON public.course_sub_categories USING btree (id);

CREATE UNIQUE INDEX courses_organization_id_name_key ON public.courses USING btree (organization_id, name);

CREATE UNIQUE INDEX courses_pkey ON public.courses USING btree (id);

CREATE UNIQUE INDEX file_library_pkey ON public.file_library USING btree (id);

CREATE UNIQUE INDEX gonasi_wallets_currency_code_key ON public.gonasi_wallets USING btree (currency_code);

CREATE UNIQUE INDEX gonasi_wallets_pkey ON public.gonasi_wallets USING btree (id);

CREATE INDEX idx_ai_usage_log_created_at ON public.ai_usage_log USING btree (created_at DESC);

CREATE INDEX idx_ai_usage_log_org_created ON public.ai_usage_log USING btree (org_id, created_at DESC);

CREATE INDEX idx_ai_usage_log_org_id ON public.ai_usage_log USING btree (org_id);

CREATE INDEX idx_ai_usage_log_user_id ON public.ai_usage_log USING btree (user_id);

CREATE INDEX idx_block_progress_completed_at ON public.block_progress USING btree (completed_at);

CREATE INDEX idx_block_progress_lesson ON public.block_progress USING btree (lesson_id);

CREATE INDEX idx_block_progress_lesson_progress ON public.block_progress USING btree (lesson_progress_id);

CREATE INDEX idx_block_progress_lesson_weight ON public.block_progress USING btree (lesson_id, block_weight);

CREATE INDEX idx_block_progress_organization ON public.block_progress USING btree (organization_id);

CREATE INDEX idx_block_progress_published_course ON public.block_progress USING btree (published_course_id);

CREATE INDEX idx_block_progress_user ON public.block_progress USING btree (user_id);

CREATE INDEX idx_block_progress_user_block ON public.block_progress USING btree (user_id, block_id);

CREATE INDEX idx_block_progress_user_course_completed ON public.block_progress USING btree (user_id, published_course_id) WHERE (is_completed = true);

CREATE INDEX idx_chapter_progress_chapter ON public.chapter_progress USING btree (chapter_id);

CREATE INDEX idx_chapter_progress_completed_at ON public.chapter_progress USING btree (completed_at);

CREATE INDEX idx_chapter_progress_course ON public.chapter_progress USING btree (published_course_id);

CREATE INDEX idx_chapter_progress_course_progress ON public.chapter_progress USING btree (course_progress_id);

CREATE INDEX idx_chapter_progress_lesson_percentage ON public.chapter_progress USING btree (lesson_progress_percentage);

CREATE INDEX idx_chapter_progress_percentage ON public.chapter_progress USING btree (progress_percentage);

CREATE INDEX idx_chapter_progress_user ON public.chapter_progress USING btree (user_id);

CREATE INDEX idx_chapters_course_id ON public.chapters USING btree (course_id);

CREATE INDEX idx_chapters_created_by ON public.chapters USING btree (created_by);

CREATE INDEX idx_chapters_organization_id ON public.chapters USING btree (organization_id);

CREATE INDEX idx_chapters_position ON public.chapters USING btree (course_id, "position");

CREATE INDEX idx_chapters_updated_by ON public.chapters USING btree (updated_by);

CREATE INDEX idx_course_categories_created_by ON public.course_categories USING btree (created_by);

CREATE INDEX idx_course_categories_updated_by ON public.course_categories USING btree (updated_by);

CREATE INDEX idx_course_editors_added_by ON public.course_editors USING btree (added_by);

CREATE INDEX idx_course_editors_course_id ON public.course_editors USING btree (course_id);

CREATE INDEX idx_course_editors_course_user ON public.course_editors USING btree (course_id, user_id);

CREATE INDEX idx_course_editors_org_user ON public.course_editors USING btree (organization_id, user_id);

CREATE INDEX idx_course_editors_organization_id ON public.course_editors USING btree (organization_id);

CREATE INDEX idx_course_editors_user_id ON public.course_editors USING btree (user_id);

CREATE INDEX idx_course_enrollments_completed_at ON public.course_enrollments USING btree (completed_at);

CREATE INDEX idx_course_enrollments_enrolled_at ON public.course_enrollments USING btree (enrolled_at);

CREATE INDEX idx_course_enrollments_expires_at ON public.course_enrollments USING btree (expires_at);

CREATE INDEX idx_course_enrollments_is_active ON public.course_enrollments USING btree (is_active);

CREATE INDEX idx_course_enrollments_organization_id ON public.course_enrollments USING btree (organization_id);

CREATE INDEX idx_course_enrollments_published_course_id ON public.course_enrollments USING btree (published_course_id);

CREATE INDEX idx_course_enrollments_user_id ON public.course_enrollments USING btree (user_id);

CREATE INDEX idx_course_payments_created_at ON public.course_payments USING btree (created_at);

CREATE INDEX idx_course_payments_created_by ON public.course_payments USING btree (created_by);

CREATE INDEX idx_course_payments_enrollment_activity_id ON public.course_payments USING btree (enrollment_activity_id);

CREATE INDEX idx_course_payments_enrollment_id ON public.course_payments USING btree (enrollment_id);

CREATE INDEX idx_course_payments_organization_id ON public.course_payments USING btree (organization_id);

CREATE INDEX idx_course_payments_processor_id ON public.course_payments USING btree (payment_processor_id);

CREATE INDEX idx_course_pricing_tiers_course_id ON public.course_pricing_tiers USING btree (course_id);

CREATE INDEX idx_course_pricing_tiers_course_id_active ON public.course_pricing_tiers USING btree (course_id, is_active);

CREATE INDEX idx_course_pricing_tiers_created_by ON public.course_pricing_tiers USING btree (created_by);

CREATE INDEX idx_course_pricing_tiers_org_active ON public.course_pricing_tiers USING btree (organization_id, is_active);

CREATE INDEX idx_course_pricing_tiers_org_course ON public.course_pricing_tiers USING btree (organization_id, course_id);

CREATE INDEX idx_course_pricing_tiers_organization_id ON public.course_pricing_tiers USING btree (organization_id);

CREATE INDEX idx_course_pricing_tiers_popular_recommended ON public.course_pricing_tiers USING btree (is_popular, is_recommended);

CREATE INDEX idx_course_pricing_tiers_position ON public.course_pricing_tiers USING btree (course_id, "position");

CREATE INDEX idx_course_pricing_tiers_promotion_dates ON public.course_pricing_tiers USING btree (promotion_start_date, promotion_end_date);

CREATE INDEX idx_course_pricing_tiers_updated_by ON public.course_pricing_tiers USING btree (updated_by);

CREATE INDEX idx_course_progress_completed_at ON public.course_progress USING btree (completed_at);

CREATE INDEX idx_course_progress_course ON public.course_progress USING btree (published_course_id);

CREATE INDEX idx_course_progress_lesson_percentage ON public.course_progress USING btree (lesson_progress_percentage);

CREATE INDEX idx_course_progress_percentage ON public.course_progress USING btree (progress_percentage);

CREATE INDEX idx_course_progress_user ON public.course_progress USING btree (user_id);

CREATE INDEX idx_course_structure_content_gin ON public.published_course_structure_content USING gin (course_structure_content jsonb_path_ops);

CREATE INDEX idx_course_sub_categories_category_id ON public.course_sub_categories USING btree (category_id);

CREATE INDEX idx_course_sub_categories_created_by ON public.course_sub_categories USING btree (created_by);

CREATE INDEX idx_course_sub_categories_updated_by ON public.course_sub_categories USING btree (updated_by);

CREATE INDEX idx_courses_category_id ON public.courses USING btree (category_id);

CREATE INDEX idx_courses_created_by ON public.courses USING btree (created_by);

CREATE INDEX idx_courses_organization_id ON public.courses USING btree (organization_id);

CREATE INDEX idx_courses_subcategory_id ON public.courses USING btree (subcategory_id);

CREATE INDEX idx_courses_updated_by ON public.courses USING btree (updated_by);

CREATE INDEX idx_courses_visibility ON public.courses USING btree (visibility);

CREATE INDEX idx_enrollment_activities_access_window ON public.course_enrollment_activities USING btree (access_start, access_end);

CREATE INDEX idx_enrollment_activities_created_at ON public.course_enrollment_activities USING btree (created_at);

CREATE INDEX idx_enrollment_activities_created_by ON public.course_enrollment_activities USING btree (created_by);

CREATE INDEX idx_enrollment_activities_enrollment_id ON public.course_enrollment_activities USING btree (enrollment_id);

CREATE INDEX idx_file_library_course_id ON public.file_library USING btree (course_id);

CREATE INDEX idx_file_library_created_by ON public.file_library USING btree (created_by);

CREATE INDEX idx_file_library_created_by_org ON public.file_library USING btree (created_by, organization_id);

CREATE INDEX idx_file_library_org_course ON public.file_library USING btree (organization_id, course_id);

CREATE INDEX idx_file_library_org_created_at_desc ON public.file_library USING btree (organization_id, created_at DESC);

CREATE INDEX idx_file_library_org_extension ON public.file_library USING btree (organization_id, extension);

CREATE INDEX idx_file_library_org_file_type ON public.file_library USING btree (organization_id, file_type);

CREATE INDEX idx_file_library_organization_id ON public.file_library USING btree (organization_id);

CREATE INDEX idx_file_library_updated_by ON public.file_library USING btree (updated_by);

CREATE INDEX idx_file_library_updated_by_org ON public.file_library USING btree (updated_by, organization_id);

CREATE INDEX idx_gonasi_wallets_created_at ON public.gonasi_wallets USING btree (created_at);

CREATE INDEX idx_gonasi_wallets_currency_code ON public.gonasi_wallets USING btree (currency_code);

CREATE INDEX idx_lesson_blocks_chapter_id ON public.lesson_blocks USING btree (chapter_id);

CREATE INDEX idx_lesson_blocks_course_id ON public.lesson_blocks USING btree (course_id);

CREATE INDEX idx_lesson_blocks_created_by ON public.lesson_blocks USING btree (created_by);

CREATE INDEX idx_lesson_blocks_lesson_id ON public.lesson_blocks USING btree (lesson_id);

CREATE INDEX idx_lesson_blocks_organization_id ON public.lesson_blocks USING btree (organization_id);

CREATE INDEX idx_lesson_blocks_position ON public.lesson_blocks USING btree ("position");

CREATE INDEX idx_lesson_blocks_updated_by ON public.lesson_blocks USING btree (updated_by);

CREATE INDEX idx_lesson_progress_chapter_progress ON public.lesson_progress USING btree (chapter_progress_id);

CREATE INDEX idx_lesson_progress_completed_at ON public.lesson_progress USING btree (completed_at);

CREATE INDEX idx_lesson_progress_course ON public.lesson_progress USING btree (published_course_id);

CREATE INDEX idx_lesson_progress_lesson ON public.lesson_progress USING btree (lesson_id);

CREATE INDEX idx_lesson_progress_percentage ON public.lesson_progress USING btree (progress_percentage);

CREATE INDEX idx_lesson_progress_user ON public.lesson_progress USING btree (user_id);

CREATE INDEX idx_lesson_reset_course_id ON public.lesson_reset_count USING btree (published_course_id);

CREATE INDEX idx_lesson_reset_lesson_id ON public.lesson_reset_count USING btree (lesson_id);

CREATE INDEX idx_lesson_reset_user_id ON public.lesson_reset_count USING btree (user_id);

CREATE INDEX idx_lesson_types_created_by ON public.lesson_types USING btree (created_by);

CREATE INDEX idx_lesson_types_updated_by ON public.lesson_types USING btree (updated_by);

CREATE INDEX idx_lessons_chapter_id ON public.lessons USING btree (chapter_id);

CREATE INDEX idx_lessons_course_id ON public.lessons USING btree (course_id);

CREATE INDEX idx_lessons_created_by ON public.lessons USING btree (created_by);

CREATE INDEX idx_lessons_lesson_type_id ON public.lessons USING btree (lesson_type_id);

CREATE INDEX idx_lessons_organization_id ON public.lessons USING btree (organization_id);

CREATE INDEX idx_lessons_position ON public.lessons USING btree ("position");

CREATE INDEX idx_lessons_updated_by ON public.lessons USING btree (updated_by);

CREATE INDEX idx_org_invites__accepted_by ON public.organization_invites USING btree (accepted_by);

CREATE INDEX idx_org_invites__email ON public.organization_invites USING btree (email);

CREATE INDEX idx_org_invites__expires_at ON public.organization_invites USING btree (expires_at);

CREATE INDEX idx_org_invites__invited_by ON public.organization_invites USING btree (invited_by);

CREATE INDEX idx_org_invites__organization_id ON public.organization_invites USING btree (organization_id);

CREATE INDEX idx_org_invites__token ON public.organization_invites USING btree (token);

CREATE INDEX idx_org_subscriptions_active_period ON public.organization_subscriptions USING btree (status, current_period_end);

CREATE INDEX idx_org_subscriptions_created_by ON public.organization_subscriptions USING btree (created_by);

CREATE INDEX idx_org_subscriptions_org_id ON public.organization_subscriptions USING btree (organization_id);

CREATE INDEX idx_org_subscriptions_status ON public.organization_subscriptions USING btree (status);

CREATE INDEX idx_org_subscriptions_tier ON public.organization_subscriptions USING btree (tier);

CREATE INDEX idx_org_subscriptions_updated_by ON public.organization_subscriptions USING btree (updated_by);

CREATE INDEX idx_organization_members_invited_by ON public.organization_members USING btree (invited_by);

CREATE INDEX idx_organization_members_org_id ON public.organization_members USING btree (organization_id);

CREATE INDEX idx_organization_members_user_id ON public.organization_members USING btree (user_id);

CREATE INDEX idx_organizations_ai_credits_next_reset_at ON public.organizations_ai_credits USING btree (next_reset_at);

CREATE INDEX idx_organizations_ai_credits_org_id ON public.organizations_ai_credits USING btree (org_id);

CREATE INDEX idx_organizations_created_at ON public.organizations USING btree (created_at);

CREATE INDEX idx_organizations_created_by ON public.organizations USING btree (created_by);

CREATE INDEX idx_organizations_deleted_by ON public.organizations USING btree (deleted_by);

CREATE INDEX idx_organizations_owned_by ON public.organizations USING btree (owned_by);

CREATE INDEX idx_organizations_tier ON public.organizations USING btree (tier);

CREATE INDEX idx_organizations_updated_by ON public.organizations USING btree (updated_by);

CREATE INDEX idx_organizations_wallets_created_at ON public.organization_wallets USING btree (created_at);

CREATE INDEX idx_organizations_wallets_currency_code ON public.organization_wallets USING btree (currency_code);

CREATE INDEX idx_organizations_wallets_organization_id ON public.organization_wallets USING btree (organization_id);

CREATE INDEX idx_profiles_active_organization_id ON public.profiles USING btree (active_organization_id);

CREATE INDEX idx_profiles_country_code ON public.profiles USING btree (country_code);

CREATE INDEX idx_profiles_created_at ON public.profiles USING btree (created_at);

CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);

CREATE INDEX idx_profiles_username ON public.profiles USING btree (username) WHERE (username IS NOT NULL);

CREATE INDEX idx_profiles_verified_users ON public.profiles USING btree (id) WHERE (account_verified = true);

CREATE INDEX idx_published_courses_category_id ON public.published_courses USING btree (category_id);

CREATE INDEX idx_published_courses_enrollments ON public.published_courses USING btree (total_enrollments);

CREATE INDEX idx_published_courses_has_free ON public.published_courses USING btree (has_free_tier);

CREATE INDEX idx_published_courses_id_version ON public.published_courses USING btree (id, version DESC);

CREATE INDEX idx_published_courses_is_active ON public.published_courses USING btree (is_active) WHERE (is_active = true);

CREATE INDEX idx_published_courses_min_price ON public.published_courses USING btree (min_price);

CREATE INDEX idx_published_courses_org_active ON public.published_courses USING btree (organization_id, is_active);

CREATE INDEX idx_published_courses_org_id ON public.published_courses USING btree (organization_id);

CREATE INDEX idx_published_courses_published_at ON public.published_courses USING btree (published_at);

CREATE INDEX idx_published_courses_published_by ON public.published_courses USING btree (published_by);

CREATE INDEX idx_published_courses_rating ON public.published_courses USING btree (average_rating) WHERE (average_rating IS NOT NULL);

CREATE INDEX idx_published_courses_subcategory_id ON public.published_courses USING btree (subcategory_id);

CREATE INDEX idx_published_courses_visibility ON public.published_courses USING btree (visibility);

CREATE INDEX idx_published_file_library_course_id ON public.published_file_library USING btree (course_id);

CREATE INDEX idx_published_file_library_created_by ON public.published_file_library USING btree (created_by);

CREATE INDEX idx_published_file_library_created_by_org ON public.published_file_library USING btree (created_by, organization_id);

CREATE INDEX idx_published_file_library_org_course ON public.published_file_library USING btree (organization_id, course_id);

CREATE INDEX idx_published_file_library_org_created_at_desc ON public.published_file_library USING btree (organization_id, created_at DESC);

CREATE INDEX idx_published_file_library_org_extension ON public.published_file_library USING btree (organization_id, extension);

CREATE INDEX idx_published_file_library_org_file_type ON public.published_file_library USING btree (organization_id, file_type);

CREATE INDEX idx_published_file_library_organization_id ON public.published_file_library USING btree (organization_id);

CREATE INDEX idx_published_file_library_updated_by ON public.published_file_library USING btree (updated_by);

CREATE INDEX idx_published_file_library_updated_by_org ON public.published_file_library USING btree (updated_by, organization_id);

CREATE INDEX idx_user_notifications_not_deleted ON public.user_notifications USING btree (user_id) WHERE (deleted_at IS NULL);

CREATE INDEX idx_user_notifications_unread ON public.user_notifications USING btree (user_id) WHERE ((read_at IS NULL) AND (deleted_at IS NULL));

CREATE INDEX idx_user_notifications_user_created_at ON public.user_notifications USING btree (user_id, created_at DESC);

CREATE INDEX idx_user_purchases_course_id ON public.user_purchases USING btree (published_course_id);

CREATE INDEX idx_user_purchases_user_id ON public.user_purchases USING btree (user_id);

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);

CREATE INDEX idx_user_wallets_created_at ON public.user_wallets USING btree (created_at);

CREATE INDEX idx_user_wallets_currency_code ON public.user_wallets USING btree (currency_code);

CREATE INDEX idx_user_wallets_user_id ON public.user_wallets USING btree (user_id);

CREATE INDEX idx_wallet_ledger_destination_wallet ON public.wallet_ledger_entries USING btree (destination_wallet_id, created_at DESC);

CREATE INDEX idx_wallet_ledger_metadata ON public.wallet_ledger_entries USING gin (metadata);

CREATE INDEX idx_wallet_ledger_payment_reference ON public.wallet_ledger_entries USING btree (payment_reference);

CREATE INDEX idx_wallet_ledger_related_entity ON public.wallet_ledger_entries USING btree (related_entity_type, related_entity_id);

CREATE INDEX idx_wallet_ledger_source_wallet ON public.wallet_ledger_entries USING btree (source_wallet_id, created_at DESC);

CREATE INDEX idx_wallet_ledger_type_status ON public.wallet_ledger_entries USING btree (type, status, created_at DESC);

CREATE UNIQUE INDEX lesson_blocks_pkey ON public.lesson_blocks USING btree (id);

CREATE UNIQUE INDEX lesson_progress_chapter_progress_id_lesson_id_key ON public.lesson_progress USING btree (chapter_progress_id, lesson_id);

CREATE UNIQUE INDEX lesson_progress_pkey ON public.lesson_progress USING btree (id);

CREATE UNIQUE INDEX lesson_progress_user_id_published_course_id_lesson_id_key ON public.lesson_progress USING btree (user_id, published_course_id, lesson_id);

CREATE UNIQUE INDEX lesson_reset_count_pkey ON public.lesson_reset_count USING btree (id);

CREATE UNIQUE INDEX lesson_reset_count_user_id_published_course_id_lesson_id_key ON public.lesson_reset_count USING btree (user_id, published_course_id, lesson_id);

CREATE UNIQUE INDEX lesson_types_bg_color_key ON public.lesson_types USING btree (bg_color);

CREATE UNIQUE INDEX lesson_types_name_key ON public.lesson_types USING btree (name);

CREATE UNIQUE INDEX lesson_types_pkey ON public.lesson_types USING btree (id);

CREATE UNIQUE INDEX lessons_pkey ON public.lessons USING btree (id);

CREATE UNIQUE INDEX one_owner_per_organization ON public.organization_members USING btree (organization_id) WHERE (role = 'owner'::public.org_role);

CREATE UNIQUE INDEX organization_invites_pkey ON public.organization_invites USING btree (id);

CREATE UNIQUE INDEX organization_invites_token_key ON public.organization_invites USING btree (token);

CREATE UNIQUE INDEX organization_members_organization_id_user_id_key ON public.organization_members USING btree (organization_id, user_id);

CREATE UNIQUE INDEX organization_members_pkey ON public.organization_members USING btree (id);

CREATE UNIQUE INDEX organization_subscriptions_pkey ON public.organization_subscriptions USING btree (id);

CREATE UNIQUE INDEX organization_wallets_organization_id_currency_code_key ON public.organization_wallets USING btree (organization_id, currency_code);

CREATE UNIQUE INDEX organization_wallets_pkey ON public.organization_wallets USING btree (id);

CREATE UNIQUE INDEX organizations_ai_credits_pkey ON public.organizations_ai_credits USING btree (org_id);

CREATE UNIQUE INDEX organizations_handle_key ON public.organizations USING btree (handle);

CREATE UNIQUE INDEX organizations_pkey ON public.organizations USING btree (id);

CREATE UNIQUE INDEX profiles_email_key ON public.profiles USING btree (email);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX profiles_username_key ON public.profiles USING btree (username);

CREATE UNIQUE INDEX published_course_structure_content_pkey ON public.published_course_structure_content USING btree (id);

CREATE UNIQUE INDEX published_courses_pkey ON public.published_courses USING btree (id);

CREATE UNIQUE INDEX published_file_library_pkey ON public.published_file_library USING btree (id);

CREATE UNIQUE INDEX role_permissions_pkey ON public.role_permissions USING btree (id);

CREATE UNIQUE INDEX role_permissions_role_permission_key ON public.role_permissions USING btree (role, permission);

CREATE INDEX tier_limits_ai_tools_enabled_idx ON public.tier_limits USING btree (ai_tools_enabled);

CREATE INDEX tier_limits_analytics_level_idx ON public.tier_limits USING btree (analytics_level);

CREATE INDEX tier_limits_custom_domains_enabled_idx ON public.tier_limits USING btree (custom_domains_enabled);

CREATE UNIQUE INDEX tier_limits_paystack_plan_code_key ON public.tier_limits USING btree (paystack_plan_code);

CREATE UNIQUE INDEX tier_limits_paystack_plan_id_key ON public.tier_limits USING btree (paystack_plan_id);

CREATE UNIQUE INDEX tier_limits_pkey ON public.tier_limits USING btree (tier);

CREATE INDEX tier_limits_plan_interval_currency_idx ON public.tier_limits USING btree (plan_interval, plan_currency);

CREATE INDEX tier_limits_price_monthly_usd_idx ON public.tier_limits USING btree (price_monthly_usd);

CREATE INDEX tier_limits_price_yearly_usd_idx ON public.tier_limits USING btree (price_yearly_usd);

CREATE INDEX tier_limits_support_level_idx ON public.tier_limits USING btree (support_level);

CREATE UNIQUE INDEX uniq_course_sub_categories_name_per_category ON public.course_sub_categories USING btree (category_id, name);

CREATE UNIQUE INDEX unique_chapter_position_per_course ON public.chapters USING btree (course_id, "position");

CREATE UNIQUE INDEX unique_file_path_per_course ON public.file_library USING btree (course_id, path);

CREATE UNIQUE INDEX unique_lesson_block_position_per_lesson ON public.lesson_blocks USING btree (lesson_id, "position");

CREATE UNIQUE INDEX unique_lesson_position_per_chapter ON public.lessons USING btree (chapter_id, "position");

CREATE UNIQUE INDEX unique_pending_invite_per_user ON public.organization_invites USING btree (organization_id, email) WHERE ((accepted_at IS NULL) AND (revoked_at IS NULL));

CREATE UNIQUE INDEX unique_published_file_path_per_course ON public.published_file_library USING btree (course_id, path);

CREATE UNIQUE INDEX unique_subscription_per_org ON public.organization_subscriptions USING btree (organization_id);

CREATE UNIQUE INDEX uq_one_active_published_course ON public.published_courses USING btree (id, is_active);

CREATE UNIQUE INDEX uq_one_active_tier_per_frequency ON public.course_pricing_tiers USING btree (course_id, payment_frequency, is_active);

CREATE UNIQUE INDEX uq_user_course ON public.course_enrollments USING btree (user_id, published_course_id);

CREATE UNIQUE INDEX user_notifications_pkey ON public.user_notifications USING btree (id);

CREATE UNIQUE INDEX user_notifications_types_key_key ON public.user_notifications_types USING btree (key);

CREATE UNIQUE INDEX user_notifications_types_pkey ON public.user_notifications_types USING btree (id);

CREATE UNIQUE INDEX user_purchases_payment_reference_key ON public.user_purchases USING btree (payment_reference);

CREATE UNIQUE INDEX user_purchases_pkey ON public.user_purchases USING btree (id);

CREATE UNIQUE INDEX user_roles_pkey ON public.user_roles USING btree (id);

CREATE UNIQUE INDEX user_roles_user_id_role_key ON public.user_roles USING btree (user_id, role);

CREATE UNIQUE INDEX user_wallets_pkey ON public.user_wallets USING btree (id);

CREATE UNIQUE INDEX user_wallets_user_id_currency_code_key ON public.user_wallets USING btree (user_id, currency_code);

CREATE UNIQUE INDEX wallet_ledger_entries_pkey ON public.wallet_ledger_entries USING btree (id);

alter table "public"."ai_usage_log" add constraint "ai_usage_log_pkey" PRIMARY KEY using index "ai_usage_log_pkey";

alter table "public"."block_progress" add constraint "block_progress_pkey" PRIMARY KEY using index "block_progress_pkey";

alter table "public"."chapter_progress" add constraint "chapter_progress_pkey" PRIMARY KEY using index "chapter_progress_pkey";

alter table "public"."chapters" add constraint "chapters_pkey" PRIMARY KEY using index "chapters_pkey";

alter table "public"."course_categories" add constraint "course_categories_pkey" PRIMARY KEY using index "course_categories_pkey";

alter table "public"."course_editors" add constraint "course_editors_pkey" PRIMARY KEY using index "course_editors_pkey";

alter table "public"."course_enrollment_activities" add constraint "course_enrollment_activities_pkey" PRIMARY KEY using index "course_enrollment_activities_pkey";

alter table "public"."course_enrollments" add constraint "course_enrollments_pkey" PRIMARY KEY using index "course_enrollments_pkey";

alter table "public"."course_payments" add constraint "course_payments_pkey" PRIMARY KEY using index "course_payments_pkey";

alter table "public"."course_pricing_tiers" add constraint "course_pricing_tiers_pkey" PRIMARY KEY using index "course_pricing_tiers_pkey";

alter table "public"."course_progress" add constraint "course_progress_pkey" PRIMARY KEY using index "course_progress_pkey";

alter table "public"."course_sub_categories" add constraint "course_sub_categories_pkey" PRIMARY KEY using index "course_sub_categories_pkey";

alter table "public"."courses" add constraint "courses_pkey" PRIMARY KEY using index "courses_pkey";

alter table "public"."file_library" add constraint "file_library_pkey" PRIMARY KEY using index "file_library_pkey";

alter table "public"."gonasi_wallets" add constraint "gonasi_wallets_pkey" PRIMARY KEY using index "gonasi_wallets_pkey";

alter table "public"."lesson_blocks" add constraint "lesson_blocks_pkey" PRIMARY KEY using index "lesson_blocks_pkey";

alter table "public"."lesson_progress" add constraint "lesson_progress_pkey" PRIMARY KEY using index "lesson_progress_pkey";

alter table "public"."lesson_reset_count" add constraint "lesson_reset_count_pkey" PRIMARY KEY using index "lesson_reset_count_pkey";

alter table "public"."lesson_types" add constraint "lesson_types_pkey" PRIMARY KEY using index "lesson_types_pkey";

alter table "public"."lessons" add constraint "lessons_pkey" PRIMARY KEY using index "lessons_pkey";

alter table "public"."organization_invites" add constraint "organization_invites_pkey" PRIMARY KEY using index "organization_invites_pkey";

alter table "public"."organization_members" add constraint "organization_members_pkey" PRIMARY KEY using index "organization_members_pkey";

alter table "public"."organization_subscriptions" add constraint "organization_subscriptions_pkey" PRIMARY KEY using index "organization_subscriptions_pkey";

alter table "public"."organization_wallets" add constraint "organization_wallets_pkey" PRIMARY KEY using index "organization_wallets_pkey";

alter table "public"."organizations" add constraint "organizations_pkey" PRIMARY KEY using index "organizations_pkey";

alter table "public"."organizations_ai_credits" add constraint "organizations_ai_credits_pkey" PRIMARY KEY using index "organizations_ai_credits_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."published_course_structure_content" add constraint "published_course_structure_content_pkey" PRIMARY KEY using index "published_course_structure_content_pkey";

alter table "public"."published_courses" add constraint "published_courses_pkey" PRIMARY KEY using index "published_courses_pkey";

alter table "public"."published_file_library" add constraint "published_file_library_pkey" PRIMARY KEY using index "published_file_library_pkey";

alter table "public"."role_permissions" add constraint "role_permissions_pkey" PRIMARY KEY using index "role_permissions_pkey";

alter table "public"."tier_limits" add constraint "tier_limits_pkey" PRIMARY KEY using index "tier_limits_pkey";

alter table "public"."user_notifications" add constraint "user_notifications_pkey" PRIMARY KEY using index "user_notifications_pkey";

alter table "public"."user_notifications_types" add constraint "user_notifications_types_pkey" PRIMARY KEY using index "user_notifications_types_pkey";

alter table "public"."user_purchases" add constraint "user_purchases_pkey" PRIMARY KEY using index "user_purchases_pkey";

alter table "public"."user_roles" add constraint "user_roles_pkey" PRIMARY KEY using index "user_roles_pkey";

alter table "public"."user_wallets" add constraint "user_wallets_pkey" PRIMARY KEY using index "user_wallets_pkey";

alter table "public"."wallet_ledger_entries" add constraint "wallet_ledger_entries_pkey" PRIMARY KEY using index "wallet_ledger_entries_pkey";

alter table "public"."ai_usage_log" add constraint "ai_usage_log_org_id_fkey" FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."ai_usage_log" validate constraint "ai_usage_log_org_id_fkey";

alter table "public"."ai_usage_log" add constraint "ai_usage_log_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."ai_usage_log" validate constraint "ai_usage_log_user_id_fkey";

alter table "public"."block_progress" add constraint "block_progress_lesson_progress_id_block_id_key" UNIQUE using index "block_progress_lesson_progress_id_block_id_key";

alter table "public"."block_progress" add constraint "block_progress_lesson_progress_id_fkey" FOREIGN KEY (lesson_progress_id) REFERENCES public.lesson_progress(id) ON DELETE CASCADE not valid;

alter table "public"."block_progress" validate constraint "block_progress_lesson_progress_id_fkey";

alter table "public"."block_progress" add constraint "block_progress_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."block_progress" validate constraint "block_progress_organization_id_fkey";

alter table "public"."block_progress" add constraint "block_progress_published_course_id_fkey" FOREIGN KEY (published_course_id) REFERENCES public.published_courses(id) ON DELETE CASCADE not valid;

alter table "public"."block_progress" validate constraint "block_progress_published_course_id_fkey";

alter table "public"."block_progress" add constraint "block_progress_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."block_progress" validate constraint "block_progress_user_id_fkey";

alter table "public"."block_progress" add constraint "block_progress_user_id_published_course_id_block_id_key" UNIQUE using index "block_progress_user_id_published_course_id_block_id_key";

alter table "public"."chapter_progress" add constraint "chapter_progress_course_progress_id_chapter_id_key" UNIQUE using index "chapter_progress_course_progress_id_chapter_id_key";

alter table "public"."chapter_progress" add constraint "chapter_progress_course_progress_id_fkey" FOREIGN KEY (course_progress_id) REFERENCES public.course_progress(id) ON DELETE CASCADE not valid;

alter table "public"."chapter_progress" validate constraint "chapter_progress_course_progress_id_fkey";

alter table "public"."chapter_progress" add constraint "chapter_progress_published_course_id_fkey" FOREIGN KEY (published_course_id) REFERENCES public.published_courses(id) ON DELETE CASCADE not valid;

alter table "public"."chapter_progress" validate constraint "chapter_progress_published_course_id_fkey";

alter table "public"."chapter_progress" add constraint "chapter_progress_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."chapter_progress" validate constraint "chapter_progress_user_id_fkey";

alter table "public"."chapter_progress" add constraint "chapter_progress_user_id_published_course_id_chapter_id_key" UNIQUE using index "chapter_progress_user_id_published_course_id_chapter_id_key";

alter table "public"."chapters" add constraint "chapters_course_id_fkey" FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE not valid;

alter table "public"."chapters" validate constraint "chapters_course_id_fkey";

alter table "public"."chapters" add constraint "chapters_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."chapters" validate constraint "chapters_created_by_fkey";

alter table "public"."chapters" add constraint "chapters_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."chapters" validate constraint "chapters_organization_id_fkey";

alter table "public"."chapters" add constraint "chapters_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."chapters" validate constraint "chapters_updated_by_fkey";

alter table "public"."chapters" add constraint "unique_chapter_position_per_course" UNIQUE using index "unique_chapter_position_per_course";

alter table "public"."course_categories" add constraint "course_categories_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."course_categories" validate constraint "course_categories_created_by_fkey";

alter table "public"."course_categories" add constraint "course_categories_description_check" CHECK ((char_length(description) > 0)) not valid;

alter table "public"."course_categories" validate constraint "course_categories_description_check";

alter table "public"."course_categories" add constraint "course_categories_name_check" CHECK ((char_length(name) > 0)) not valid;

alter table "public"."course_categories" validate constraint "course_categories_name_check";

alter table "public"."course_categories" add constraint "course_categories_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."course_categories" validate constraint "course_categories_updated_by_fkey";

alter table "public"."course_editors" add constraint "course_editors_added_by_fkey" FOREIGN KEY (added_by) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."course_editors" validate constraint "course_editors_added_by_fkey";

alter table "public"."course_editors" add constraint "course_editors_course_id_fkey" FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE not valid;

alter table "public"."course_editors" validate constraint "course_editors_course_id_fkey";

alter table "public"."course_editors" add constraint "course_editors_course_id_user_id_key" UNIQUE using index "course_editors_course_id_user_id_key";

alter table "public"."course_editors" add constraint "course_editors_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."course_editors" validate constraint "course_editors_organization_id_fkey";

alter table "public"."course_editors" add constraint "course_editors_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."course_editors" validate constraint "course_editors_user_id_fkey";

alter table "public"."course_enrollment_activities" add constraint "course_enrollment_activities_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."course_enrollment_activities" validate constraint "course_enrollment_activities_created_by_fkey";

alter table "public"."course_enrollment_activities" add constraint "course_enrollment_activities_enrollment_id_fkey" FOREIGN KEY (enrollment_id) REFERENCES public.course_enrollments(id) ON DELETE CASCADE not valid;

alter table "public"."course_enrollment_activities" validate constraint "course_enrollment_activities_enrollment_id_fkey";

alter table "public"."course_enrollments" add constraint "course_enrollments_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."course_enrollments" validate constraint "course_enrollments_organization_id_fkey";

alter table "public"."course_enrollments" add constraint "course_enrollments_published_course_id_fkey" FOREIGN KEY (published_course_id) REFERENCES public.published_courses(id) ON DELETE CASCADE not valid;

alter table "public"."course_enrollments" validate constraint "course_enrollments_published_course_id_fkey";

alter table "public"."course_enrollments" add constraint "course_enrollments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."course_enrollments" validate constraint "course_enrollments_user_id_fkey";

alter table "public"."course_enrollments" add constraint "uq_user_course" UNIQUE using index "uq_user_course";

alter table "public"."course_payments" add constraint "chk_payment_amounts" CHECK (((amount_paid >= (0)::numeric) AND (net_amount >= (0)::numeric) AND (platform_fee >= (0)::numeric) AND (org_payout_amount >= (0)::numeric))) not valid;

alter table "public"."course_payments" validate constraint "chk_payment_amounts";

alter table "public"."course_payments" add constraint "chk_platform_fee_percent" CHECK (((platform_fee_percent >= (0)::numeric) AND (platform_fee_percent <= (100)::numeric))) not valid;

alter table "public"."course_payments" validate constraint "chk_platform_fee_percent";

alter table "public"."course_payments" add constraint "chk_refund_amount" CHECK (((refund_amount >= (0)::numeric) AND (refund_amount <= amount_paid))) not valid;

alter table "public"."course_payments" validate constraint "chk_refund_amount";

alter table "public"."course_payments" add constraint "course_payments_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."course_payments" validate constraint "course_payments_created_by_fkey";

alter table "public"."course_payments" add constraint "course_payments_enrollment_activity_id_fkey" FOREIGN KEY (enrollment_activity_id) REFERENCES public.course_enrollment_activities(id) ON DELETE CASCADE not valid;

alter table "public"."course_payments" validate constraint "course_payments_enrollment_activity_id_fkey";

alter table "public"."course_payments" add constraint "course_payments_enrollment_id_fkey" FOREIGN KEY (enrollment_id) REFERENCES public.course_enrollments(id) ON DELETE CASCADE not valid;

alter table "public"."course_payments" validate constraint "course_payments_enrollment_id_fkey";

alter table "public"."course_payments" add constraint "course_payments_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."course_payments" validate constraint "course_payments_organization_id_fkey";

alter table "public"."course_pricing_tiers" add constraint "chk_free_has_no_promo" CHECK (((is_free = false) OR ((promotional_price IS NULL) AND (promotion_start_date IS NULL) AND (promotion_end_date IS NULL)))) not valid;

alter table "public"."course_pricing_tiers" validate constraint "chk_free_has_no_promo";

alter table "public"."course_pricing_tiers" add constraint "chk_price_nonfree" CHECK (((is_free = true) OR (price > (0)::numeric))) not valid;

alter table "public"."course_pricing_tiers" validate constraint "chk_price_nonfree";

alter table "public"."course_pricing_tiers" add constraint "chk_promotion_dates" CHECK (((promotion_start_date IS NULL) OR (promotion_end_date IS NULL) OR (promotion_start_date < promotion_end_date))) not valid;

alter table "public"."course_pricing_tiers" validate constraint "chk_promotion_dates";

alter table "public"."course_pricing_tiers" add constraint "chk_promotional_price" CHECK (((is_free = true) OR (promotional_price IS NULL) OR (promotional_price < price))) not valid;

alter table "public"."course_pricing_tiers" validate constraint "chk_promotional_price";

alter table "public"."course_pricing_tiers" add constraint "course_pricing_tiers_course_id_fkey" FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE not valid;

alter table "public"."course_pricing_tiers" validate constraint "course_pricing_tiers_course_id_fkey";

alter table "public"."course_pricing_tiers" add constraint "course_pricing_tiers_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."course_pricing_tiers" validate constraint "course_pricing_tiers_created_by_fkey";

alter table "public"."course_pricing_tiers" add constraint "course_pricing_tiers_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."course_pricing_tiers" validate constraint "course_pricing_tiers_organization_id_fkey";

alter table "public"."course_pricing_tiers" add constraint "course_pricing_tiers_price_check" CHECK ((price >= (0)::numeric)) not valid;

alter table "public"."course_pricing_tiers" validate constraint "course_pricing_tiers_price_check";

alter table "public"."course_pricing_tiers" add constraint "course_pricing_tiers_promotional_price_check" CHECK ((promotional_price >= (0)::numeric)) not valid;

alter table "public"."course_pricing_tiers" validate constraint "course_pricing_tiers_promotional_price_check";

alter table "public"."course_pricing_tiers" add constraint "course_pricing_tiers_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."course_pricing_tiers" validate constraint "course_pricing_tiers_updated_by_fkey";

alter table "public"."course_pricing_tiers" add constraint "uq_one_active_tier_per_frequency" UNIQUE using index "uq_one_active_tier_per_frequency" DEFERRABLE INITIALLY DEFERRED;

alter table "public"."course_progress" add constraint "course_progress_published_course_id_fkey" FOREIGN KEY (published_course_id) REFERENCES public.published_courses(id) ON DELETE CASCADE not valid;

alter table "public"."course_progress" validate constraint "course_progress_published_course_id_fkey";

alter table "public"."course_progress" add constraint "course_progress_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."course_progress" validate constraint "course_progress_user_id_fkey";

alter table "public"."course_progress" add constraint "course_progress_user_id_published_course_id_key" UNIQUE using index "course_progress_user_id_published_course_id_key";

alter table "public"."course_sub_categories" add constraint "course_sub_categories_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.course_categories(id) ON DELETE CASCADE not valid;

alter table "public"."course_sub_categories" validate constraint "course_sub_categories_category_id_fkey";

alter table "public"."course_sub_categories" add constraint "course_sub_categories_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."course_sub_categories" validate constraint "course_sub_categories_created_by_fkey";

alter table "public"."course_sub_categories" add constraint "course_sub_categories_name_check" CHECK ((char_length(name) > 0)) not valid;

alter table "public"."course_sub_categories" validate constraint "course_sub_categories_name_check";

alter table "public"."course_sub_categories" add constraint "course_sub_categories_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."course_sub_categories" validate constraint "course_sub_categories_updated_by_fkey";

alter table "public"."courses" add constraint "courses_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.course_categories(id) ON DELETE SET NULL not valid;

alter table "public"."courses" validate constraint "courses_category_id_fkey";

alter table "public"."courses" add constraint "courses_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."courses" validate constraint "courses_created_by_fkey";

alter table "public"."courses" add constraint "courses_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."courses" validate constraint "courses_organization_id_fkey";

alter table "public"."courses" add constraint "courses_organization_id_name_key" UNIQUE using index "courses_organization_id_name_key";

alter table "public"."courses" add constraint "courses_subcategory_id_fkey" FOREIGN KEY (subcategory_id) REFERENCES public.course_sub_categories(id) ON DELETE SET NULL not valid;

alter table "public"."courses" validate constraint "courses_subcategory_id_fkey";

alter table "public"."courses" add constraint "courses_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."courses" validate constraint "courses_updated_by_fkey";

alter table "public"."file_library" add constraint "file_library_course_id_fkey" FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE not valid;

alter table "public"."file_library" validate constraint "file_library_course_id_fkey";

alter table "public"."file_library" add constraint "file_library_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."file_library" validate constraint "file_library_created_by_fkey";

alter table "public"."file_library" add constraint "file_library_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."file_library" validate constraint "file_library_organization_id_fkey";

alter table "public"."file_library" add constraint "file_library_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."file_library" validate constraint "file_library_updated_by_fkey";

alter table "public"."file_library" add constraint "unique_file_path_per_course" UNIQUE using index "unique_file_path_per_course";

alter table "public"."file_library" add constraint "valid_file_extension" CHECK ((((file_type = 'image'::public.file_type) AND (lower(extension) = ANY (ARRAY['jpg'::text, 'jpeg'::text, 'png'::text, 'gif'::text, 'webp'::text, 'svg'::text, 'bmp'::text, 'tif'::text, 'tiff'::text, 'heic'::text]))) OR ((file_type = 'audio'::public.file_type) AND (lower(extension) = ANY (ARRAY['mp3'::text, 'wav'::text, 'aac'::text, 'flac'::text, 'ogg'::text, 'm4a'::text, 'aiff'::text, 'aif'::text]))) OR ((file_type = 'video'::public.file_type) AND (lower(extension) = ANY (ARRAY['mp4'::text, 'webm'::text, 'mov'::text, 'avi'::text, 'mkv'::text, 'flv'::text, 'wmv'::text]))) OR ((file_type = 'model3d'::public.file_type) AND (lower(extension) = ANY (ARRAY['gltf'::text, 'glb'::text, 'obj'::text, 'fbx'::text, 'stl'::text, 'dae'::text, '3ds'::text, 'usdz'::text]))) OR ((file_type = 'document'::public.file_type) AND (lower(extension) = ANY (ARRAY['pdf'::text, 'doc'::text, 'docx'::text, 'xls'::text, 'xlsx'::text, 'ppt'::text, 'pptx'::text, 'txt'::text]))) OR (file_type = 'other'::public.file_type))) not valid;

alter table "public"."file_library" validate constraint "valid_file_extension";

alter table "public"."gonasi_wallets" add constraint "gonasi_wallets_currency_code_key" UNIQUE using index "gonasi_wallets_currency_code_key";

alter table "public"."lesson_blocks" add constraint "lesson_blocks_chapter_id_fkey" FOREIGN KEY (chapter_id) REFERENCES public.chapters(id) ON DELETE CASCADE not valid;

alter table "public"."lesson_blocks" validate constraint "lesson_blocks_chapter_id_fkey";

alter table "public"."lesson_blocks" add constraint "lesson_blocks_course_id_fkey" FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE not valid;

alter table "public"."lesson_blocks" validate constraint "lesson_blocks_course_id_fkey";

alter table "public"."lesson_blocks" add constraint "lesson_blocks_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."lesson_blocks" validate constraint "lesson_blocks_created_by_fkey";

alter table "public"."lesson_blocks" add constraint "lesson_blocks_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE not valid;

alter table "public"."lesson_blocks" validate constraint "lesson_blocks_lesson_id_fkey";

alter table "public"."lesson_blocks" add constraint "lesson_blocks_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."lesson_blocks" validate constraint "lesson_blocks_organization_id_fkey";

alter table "public"."lesson_blocks" add constraint "lesson_blocks_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."lesson_blocks" validate constraint "lesson_blocks_updated_by_fkey";

alter table "public"."lesson_progress" add constraint "lesson_progress_chapter_progress_id_fkey" FOREIGN KEY (chapter_progress_id) REFERENCES public.chapter_progress(id) ON DELETE CASCADE not valid;

alter table "public"."lesson_progress" validate constraint "lesson_progress_chapter_progress_id_fkey";

alter table "public"."lesson_progress" add constraint "lesson_progress_chapter_progress_id_lesson_id_key" UNIQUE using index "lesson_progress_chapter_progress_id_lesson_id_key";

alter table "public"."lesson_progress" add constraint "lesson_progress_published_course_id_fkey" FOREIGN KEY (published_course_id) REFERENCES public.published_courses(id) ON DELETE CASCADE not valid;

alter table "public"."lesson_progress" validate constraint "lesson_progress_published_course_id_fkey";

alter table "public"."lesson_progress" add constraint "lesson_progress_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."lesson_progress" validate constraint "lesson_progress_user_id_fkey";

alter table "public"."lesson_progress" add constraint "lesson_progress_user_id_published_course_id_lesson_id_key" UNIQUE using index "lesson_progress_user_id_published_course_id_lesson_id_key";

alter table "public"."lesson_reset_count" add constraint "lesson_reset_count_published_course_id_fkey" FOREIGN KEY (published_course_id) REFERENCES public.published_courses(id) ON DELETE CASCADE not valid;

alter table "public"."lesson_reset_count" validate constraint "lesson_reset_count_published_course_id_fkey";

alter table "public"."lesson_reset_count" add constraint "lesson_reset_count_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."lesson_reset_count" validate constraint "lesson_reset_count_user_id_fkey";

alter table "public"."lesson_reset_count" add constraint "lesson_reset_count_user_id_published_course_id_lesson_id_key" UNIQUE using index "lesson_reset_count_user_id_published_course_id_lesson_id_key";

alter table "public"."lesson_types" add constraint "lesson_types_bg_color_key" UNIQUE using index "lesson_types_bg_color_key";

alter table "public"."lesson_types" add constraint "lesson_types_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."lesson_types" validate constraint "lesson_types_created_by_fkey";

alter table "public"."lesson_types" add constraint "lesson_types_name_key" UNIQUE using index "lesson_types_name_key";

alter table "public"."lesson_types" add constraint "lesson_types_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."lesson_types" validate constraint "lesson_types_updated_by_fkey";

alter table "public"."lessons" add constraint "lessons_chapter_id_fkey" FOREIGN KEY (chapter_id) REFERENCES public.chapters(id) ON DELETE CASCADE not valid;

alter table "public"."lessons" validate constraint "lessons_chapter_id_fkey";

alter table "public"."lessons" add constraint "lessons_course_id_fkey" FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE not valid;

alter table "public"."lessons" validate constraint "lessons_course_id_fkey";

alter table "public"."lessons" add constraint "lessons_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."lessons" validate constraint "lessons_created_by_fkey";

alter table "public"."lessons" add constraint "lessons_lesson_type_id_fkey" FOREIGN KEY (lesson_type_id) REFERENCES public.lesson_types(id) ON DELETE SET NULL not valid;

alter table "public"."lessons" validate constraint "lessons_lesson_type_id_fkey";

alter table "public"."lessons" add constraint "lessons_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."lessons" validate constraint "lessons_organization_id_fkey";

alter table "public"."lessons" add constraint "lessons_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."lessons" validate constraint "lessons_updated_by_fkey";

alter table "public"."organization_invites" add constraint "organization_invites_accepted_by_fkey" FOREIGN KEY (accepted_by) REFERENCES auth.users(id) not valid;

alter table "public"."organization_invites" validate constraint "organization_invites_accepted_by_fkey";

alter table "public"."organization_invites" add constraint "organization_invites_invited_by_fkey" FOREIGN KEY (invited_by) REFERENCES auth.users(id) not valid;

alter table "public"."organization_invites" validate constraint "organization_invites_invited_by_fkey";

alter table "public"."organization_invites" add constraint "organization_invites_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."organization_invites" validate constraint "organization_invites_organization_id_fkey";

alter table "public"."organization_invites" add constraint "organization_invites_token_key" UNIQUE using index "organization_invites_token_key";

alter table "public"."organization_members" add constraint "organization_members_invited_by_fkey" FOREIGN KEY (invited_by) REFERENCES auth.users(id) not valid;

alter table "public"."organization_members" validate constraint "organization_members_invited_by_fkey";

alter table "public"."organization_members" add constraint "organization_members_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."organization_members" validate constraint "organization_members_organization_id_fkey";

alter table "public"."organization_members" add constraint "organization_members_organization_id_user_id_key" UNIQUE using index "organization_members_organization_id_user_id_key";

alter table "public"."organization_members" add constraint "organization_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."organization_members" validate constraint "organization_members_user_id_fkey";

alter table "public"."organization_members" add constraint "organization_members_user_id_fkey_profiles" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."organization_members" validate constraint "organization_members_user_id_fkey_profiles";

alter table "public"."organization_subscriptions" add constraint "organization_subscriptions_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."organization_subscriptions" validate constraint "organization_subscriptions_created_by_fkey";

alter table "public"."organization_subscriptions" add constraint "organization_subscriptions_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."organization_subscriptions" validate constraint "organization_subscriptions_organization_id_fkey";

alter table "public"."organization_subscriptions" add constraint "organization_subscriptions_tier_fkey" FOREIGN KEY (tier) REFERENCES public.tier_limits(tier) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."organization_subscriptions" validate constraint "organization_subscriptions_tier_fkey";

alter table "public"."organization_subscriptions" add constraint "organization_subscriptions_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."organization_subscriptions" validate constraint "organization_subscriptions_updated_by_fkey";

alter table "public"."organization_subscriptions" add constraint "unique_subscription_per_org" UNIQUE using index "unique_subscription_per_org";

alter table "public"."organization_wallets" add constraint "organization_wallets_organization_id_currency_code_key" UNIQUE using index "organization_wallets_organization_id_currency_code_key";

alter table "public"."organization_wallets" add constraint "organization_wallets_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."organization_wallets" validate constraint "organization_wallets_organization_id_fkey";

alter table "public"."organizations" add constraint "handle_length" CHECK ((char_length(handle) >= 3)) not valid;

alter table "public"."organizations" validate constraint "handle_length";

alter table "public"."organizations" add constraint "handle_lowercase" CHECK ((handle = lower(handle))) not valid;

alter table "public"."organizations" validate constraint "handle_lowercase";

alter table "public"."organizations" add constraint "organizations_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."organizations" validate constraint "organizations_created_by_fkey";

alter table "public"."organizations" add constraint "organizations_deleted_by_fkey" FOREIGN KEY (deleted_by) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."organizations" validate constraint "organizations_deleted_by_fkey";

alter table "public"."organizations" add constraint "organizations_handle_key" UNIQUE using index "organizations_handle_key";

alter table "public"."organizations" add constraint "organizations_owned_by_fkey" FOREIGN KEY (owned_by) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."organizations" validate constraint "organizations_owned_by_fkey";

alter table "public"."organizations" add constraint "organizations_tier_fkey" FOREIGN KEY (tier) REFERENCES public.tier_limits(tier) not valid;

alter table "public"."organizations" validate constraint "organizations_tier_fkey";

alter table "public"."organizations" add constraint "organizations_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."organizations" validate constraint "organizations_updated_by_fkey";

alter table "public"."organizations_ai_credits" add constraint "organizations_ai_credits_org_id_fkey" FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."organizations_ai_credits" validate constraint "organizations_ai_credits_org_id_fkey";

alter table "public"."profiles" add constraint "email_valid" CHECK ((email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text)) not valid;

alter table "public"."profiles" validate constraint "email_valid";

alter table "public"."profiles" add constraint "mode_organization_consistency" CHECK ((((mode = 'personal'::public.profile_mode) AND (active_organization_id IS NULL)) OR ((mode = 'organization'::public.profile_mode) AND (active_organization_id IS NOT NULL)))) not valid;

alter table "public"."profiles" validate constraint "mode_organization_consistency";

alter table "public"."profiles" add constraint "profiles_active_organization_id_fkey" FOREIGN KEY (active_organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL not valid;

alter table "public"."profiles" validate constraint "profiles_active_organization_id_fkey";

alter table "public"."profiles" add constraint "profiles_country_code_check" CHECK ((country_code ~* '^[A-Z]{2}$'::text)) not valid;

alter table "public"."profiles" validate constraint "profiles_country_code_check";

alter table "public"."profiles" add constraint "profiles_email_key" UNIQUE using index "profiles_email_key";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."profiles" add constraint "profiles_preferred_language_check" CHECK ((preferred_language ~* '^[a-z]{2}$'::text)) not valid;

alter table "public"."profiles" validate constraint "profiles_preferred_language_check";

alter table "public"."profiles" add constraint "profiles_username_key" UNIQUE using index "profiles_username_key";

alter table "public"."profiles" add constraint "username_length" CHECK ((char_length(username) >= 3)) not valid;

alter table "public"."profiles" validate constraint "username_length";

alter table "public"."profiles" add constraint "username_lowercase" CHECK ((username = lower(username))) not valid;

alter table "public"."profiles" validate constraint "username_lowercase";

alter table "public"."published_course_structure_content" add constraint "chk_course_structure_content_valid" CHECK (extensions.jsonb_matches_schema('{
      "type": "object",
      "required": ["total_chapters", "total_lessons", "total_blocks", "chapters"],
      "properties": {
        "total_chapters": { "type": "number", "minimum": 1 },
        "total_lessons": { "type": "number", "minimum": 1 },
        "total_blocks": { "type": "number", "minimum": 1 },
        "chapters": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["id", "course_id", "lesson_count", "name", "description", "position", "total_lessons", "total_blocks", "lessons"],
            "properties": {
              "id": { "type": "string", "format": "uuid" },
              "course_id": { "type": "string", "format": "uuid" },
              "lesson_count": { "type": "number", "minimum": 0 },
              "name": { "type": "string", "minLength": 1 },
              "description": { "type": "string", "minLength": 1 },
              "position": { "type": "number", "minimum": 0 },
              "total_lessons": { "type": "number", "minimum": 1 },
              "total_blocks": { "type": "number", "minimum": 1 },
              "lessons": {
                "type": "array",
                "items": {
                  "type": "object",
                  "required": ["id", "course_id", "chapter_id", "lesson_type_id", "name", "position", "settings", "lesson_types", "total_blocks", "blocks"],
                  "properties": {
                    "id": { "type": "string", "format": "uuid" },
                    "course_id": { "type": "string", "format": "uuid" },
                    "chapter_id": { "type": "string", "format": "uuid" },
                    "lesson_type_id": { "type": "string", "format": "uuid" },
                    "name": { "type": "string", "minLength": 1 },
                    "position": { "type": "number", "minimum": 0 },
                    "settings": {},
                    "lesson_types": {
                      "type": "object",
                      "required": ["id", "name", "description", "lucide_icon", "bg_color"],
                      "properties": {
                        "id": { "type": "string", "format": "uuid" },
                        "name": { "type": "string" },
                        "description": { "type": "string" },
                        "lucide_icon": { "type": "string" },
                        "bg_color": { "type": "string" }
                      }
                    },
                    "total_blocks": { "type": "number", "minimum": 1 },
                    "blocks": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "required": [
                          "id",
                          "lesson_id",
                          "plugin_type",
                          "content",
                          "settings",
                          "position",
                          "course_id",
                          "organization_id"
                        ],
                        "properties": {
                          "id": { "type": "string", "format": "uuid" },
                          "lesson_id": { "type": "string", "format": "uuid" },
                          "course_id": { "type": "string", "format": "uuid" },
                          "organization_id": { "type": "string", "format": "uuid" },
                          "plugin_type": { "type": "string" },
                          "content": {}, 
                          "settings": {}, 
                          "position": { "type": "number", "minimum": 0 }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }'::json, course_structure_content)) not valid;

alter table "public"."published_course_structure_content" validate constraint "chk_course_structure_content_valid";

alter table "public"."published_course_structure_content" add constraint "published_course_structure_content_id_fkey" FOREIGN KEY (id) REFERENCES public.published_courses(id) ON DELETE CASCADE not valid;

alter table "public"."published_course_structure_content" validate constraint "published_course_structure_content_id_fkey";

alter table "public"."published_courses" add constraint "chk_average_rating" CHECK (((average_rating >= (1)::numeric) AND (average_rating <= (5)::numeric))) not valid;

alter table "public"."published_courses" validate constraint "chk_average_rating";

alter table "public"."published_courses" add constraint "chk_completion_rate" CHECK (((completion_rate >= (0)::numeric) AND (completion_rate <= (100)::numeric))) not valid;

alter table "public"."published_courses" validate constraint "chk_completion_rate";

alter table "public"."published_courses" add constraint "chk_course_structure_overview_valid" CHECK (extensions.jsonb_matches_schema('{
      "type": "object",
      "required": ["total_chapters", "total_lessons", "total_blocks", "chapters"],
      "properties": {
        "total_chapters": { "type": "number", "minimum": 1 },
        "total_lessons": { "type": "number", "minimum": 1 },
        "total_blocks": { "type": "number", "minimum": 1 },
        "chapters": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["id", "course_id", "lesson_count", "name", "description", "position", "total_lessons", "total_blocks", "lessons"],
            "properties": {
              "id": { "type": "string", "format": "uuid" },
              "course_id": { "type": "string", "format": "uuid" },
              "lesson_count": { "type": "number", "minimum": 0 },
              "name": { "type": "string", "minLength": 1 },
              "description": { "type": "string", "minLength": 1 },
              "position": { "type": "number", "minimum": 0 },
              "total_lessons": { "type": "number", "minimum": 1 },
              "total_blocks": { "type": "number", "minimum": 1 },
              "lessons": {
                "type": "array",
                "items": {
                  "type": "object",
                  "required": ["id", "course_id", "chapter_id", "lesson_type_id", "name", "position", "total_blocks", "lesson_types"],
                  "properties": {
                    "id": { "type": "string", "format": "uuid" },
                    "course_id": { "type": "string", "format": "uuid" },
                    "chapter_id": { "type": "string", "format": "uuid" },
                    "lesson_type_id": { "type": "string", "format": "uuid" },
                    "name": { "type": "string", "minLength": 1 },
                    "position": { "type": "number", "minimum": 0 },
                    "total_blocks": { "type": "number", "minimum": 1 },
                    "lesson_types": {
                      "type": "object",
                      "required": ["id", "name", "description", "lucide_icon", "bg_color"],
                      "properties": {
                        "id": { "type": "string", "format": "uuid" },
                        "name": { "type": "string" },
                        "description": { "type": "string" },
                        "lucide_icon": { "type": "string" },
                        "bg_color": { "type": "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }'::json, course_structure_overview)) not valid;

alter table "public"."published_courses" validate constraint "chk_course_structure_overview_valid";

alter table "public"."published_courses" add constraint "chk_pricing_tiers_valid" CHECK (extensions.jsonb_matches_schema('{
      "type": "array",
      "items": {
        "type": "object",
        "required": [
          "id",
          "course_id",
          "organization_id",
          "payment_frequency",
          "is_free",
          "price",
          "currency_code",
          "is_active",
          "position",
          "is_popular",
          "is_recommended"
        ],
        "properties": {
          "id": { "type": "string", "format": "uuid" },
          "course_id": { "type": "string", "format": "uuid" },
          "organization_id": { "type": "string", "format": "uuid" },
          "payment_frequency": {
            "type": "string",
            "enum": ["monthly", "bi_monthly", "quarterly", "semi_annual", "annual"]
          },
          "is_free": { "type": "boolean" },
          "price": { "type": "number", "minimum": 0 },
          "currency_code": { "type": "string", "minLength": 3, "maxLength": 3 },
          "promotional_price": { "type": ["number", "null"], "minimum": 0 },
          "promotion_start_date": {
            "oneOf": [
              { "type": "string", "format": "date-time" },
              { "type": "null" }
            ]
          },
          "promotion_end_date": {
            "oneOf": [
              { "type": "string", "format": "date-time" },
              { "type": "null" }
            ]
          },
          "tier_name": { "type": ["string", "null"] },
          "tier_description": { "type": ["string", "null"] },
          "is_active": { "type": "boolean" },
          "position": { "type": "number", "minimum": 0 },
          "is_popular": { "type": "boolean" },
          "is_recommended": { "type": "boolean" }
        }
      }
    }'::json, pricing_tiers)) not valid;

alter table "public"."published_courses" validate constraint "chk_pricing_tiers_valid";

alter table "public"."published_courses" add constraint "chk_version_positive" CHECK ((version > 0)) not valid;

alter table "public"."published_courses" validate constraint "chk_version_positive";

alter table "public"."published_courses" add constraint "published_courses_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.course_categories(id) ON DELETE SET NULL not valid;

alter table "public"."published_courses" validate constraint "published_courses_category_id_fkey";

alter table "public"."published_courses" add constraint "published_courses_id_fkey" FOREIGN KEY (id) REFERENCES public.courses(id) ON DELETE CASCADE not valid;

alter table "public"."published_courses" validate constraint "published_courses_id_fkey";

alter table "public"."published_courses" add constraint "published_courses_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."published_courses" validate constraint "published_courses_organization_id_fkey";

alter table "public"."published_courses" add constraint "published_courses_published_by_fkey" FOREIGN KEY (published_by) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."published_courses" validate constraint "published_courses_published_by_fkey";

alter table "public"."published_courses" add constraint "published_courses_subcategory_id_fkey" FOREIGN KEY (subcategory_id) REFERENCES public.course_sub_categories(id) ON DELETE SET NULL not valid;

alter table "public"."published_courses" validate constraint "published_courses_subcategory_id_fkey";

alter table "public"."published_courses" add constraint "published_courses_total_blocks_check" CHECK ((total_blocks > 0)) not valid;

alter table "public"."published_courses" validate constraint "published_courses_total_blocks_check";

alter table "public"."published_courses" add constraint "published_courses_total_chapters_check" CHECK ((total_chapters > 0)) not valid;

alter table "public"."published_courses" validate constraint "published_courses_total_chapters_check";

alter table "public"."published_courses" add constraint "published_courses_total_lessons_check" CHECK ((total_lessons > 0)) not valid;

alter table "public"."published_courses" validate constraint "published_courses_total_lessons_check";

alter table "public"."published_courses" add constraint "uq_one_active_published_course" UNIQUE using index "uq_one_active_published_course" DEFERRABLE INITIALLY DEFERRED;

alter table "public"."published_file_library" add constraint "published_file_library_course_id_fkey" FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE not valid;

alter table "public"."published_file_library" validate constraint "published_file_library_course_id_fkey";

alter table "public"."published_file_library" add constraint "published_file_library_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."published_file_library" validate constraint "published_file_library_created_by_fkey";

alter table "public"."published_file_library" add constraint "published_file_library_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."published_file_library" validate constraint "published_file_library_organization_id_fkey";

alter table "public"."published_file_library" add constraint "published_file_library_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."published_file_library" validate constraint "published_file_library_updated_by_fkey";

alter table "public"."published_file_library" add constraint "unique_published_file_path_per_course" UNIQUE using index "unique_published_file_path_per_course";

alter table "public"."published_file_library" add constraint "valid_file_extension" CHECK ((((file_type = 'image'::public.file_type) AND (lower(extension) = ANY (ARRAY['jpg'::text, 'jpeg'::text, 'png'::text, 'gif'::text, 'webp'::text, 'svg'::text, 'bmp'::text, 'tif'::text, 'tiff'::text, 'heic'::text]))) OR ((file_type = 'audio'::public.file_type) AND (lower(extension) = ANY (ARRAY['mp3'::text, 'wav'::text, 'aac'::text, 'flac'::text, 'ogg'::text, 'm4a'::text, 'aiff'::text, 'aif'::text]))) OR ((file_type = 'video'::public.file_type) AND (lower(extension) = ANY (ARRAY['mp4'::text, 'webm'::text, 'mov'::text, 'avi'::text, 'mkv'::text, 'flv'::text, 'wmv'::text]))) OR ((file_type = 'model3d'::public.file_type) AND (lower(extension) = ANY (ARRAY['gltf'::text, 'glb'::text, 'obj'::text, 'fbx'::text, 'stl'::text, 'dae'::text, '3ds'::text, 'usdz'::text]))) OR ((file_type = 'document'::public.file_type) AND (lower(extension) = ANY (ARRAY['pdf'::text, 'doc'::text, 'docx'::text, 'xls'::text, 'xlsx'::text, 'ppt'::text, 'pptx'::text, 'txt'::text]))) OR (file_type = 'other'::public.file_type))) not valid;

alter table "public"."published_file_library" validate constraint "valid_file_extension";

alter table "public"."role_permissions" add constraint "role_permissions_role_permission_key" UNIQUE using index "role_permissions_role_permission_key";

alter table "public"."tier_limits" add constraint "tier_limits_ai_usage_limit_monthly_check" CHECK (((ai_usage_limit_monthly IS NULL) OR (ai_usage_limit_monthly >= 0))) not valid;

alter table "public"."tier_limits" validate constraint "tier_limits_ai_usage_limit_monthly_check";

alter table "public"."tier_limits" add constraint "tier_limits_max_custom_domains_check" CHECK (((max_custom_domains IS NULL) OR (max_custom_domains >= 0))) not valid;

alter table "public"."tier_limits" validate constraint "tier_limits_max_custom_domains_check";

alter table "public"."tier_limits" add constraint "tier_limits_max_free_courses_per_org_check" CHECK ((max_free_courses_per_org >= 0)) not valid;

alter table "public"."tier_limits" validate constraint "tier_limits_max_free_courses_per_org_check";

alter table "public"."tier_limits" add constraint "tier_limits_max_members_per_org_check" CHECK ((max_members_per_org >= 0)) not valid;

alter table "public"."tier_limits" validate constraint "tier_limits_max_members_per_org_check";

alter table "public"."tier_limits" add constraint "tier_limits_max_organizations_per_user_check" CHECK ((max_organizations_per_user >= 0)) not valid;

alter table "public"."tier_limits" validate constraint "tier_limits_max_organizations_per_user_check";

alter table "public"."tier_limits" add constraint "tier_limits_paystack_plan_code_key" UNIQUE using index "tier_limits_paystack_plan_code_key";

alter table "public"."tier_limits" add constraint "tier_limits_paystack_plan_id_key" UNIQUE using index "tier_limits_paystack_plan_id_key";

alter table "public"."tier_limits" add constraint "tier_limits_platform_fee_percentage_check" CHECK (((platform_fee_percentage >= (0)::numeric) AND (platform_fee_percentage <= (100)::numeric))) not valid;

alter table "public"."tier_limits" validate constraint "tier_limits_platform_fee_percentage_check";

alter table "public"."tier_limits" add constraint "tier_limits_price_monthly_usd_check" CHECK ((price_monthly_usd >= (0)::numeric)) not valid;

alter table "public"."tier_limits" validate constraint "tier_limits_price_monthly_usd_check";

alter table "public"."tier_limits" add constraint "tier_limits_price_yearly_usd_check" CHECK ((price_yearly_usd >= (0)::numeric)) not valid;

alter table "public"."tier_limits" validate constraint "tier_limits_price_yearly_usd_check";

alter table "public"."tier_limits" add constraint "tier_limits_storage_limit_mb_per_org_check" CHECK ((storage_limit_mb_per_org >= 0)) not valid;

alter table "public"."tier_limits" validate constraint "tier_limits_storage_limit_mb_per_org_check";

alter table "public"."user_notifications" add constraint "user_notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_notifications" validate constraint "user_notifications_user_id_fkey";

alter table "public"."user_notifications_types" add constraint "user_notifications_types_key_key" UNIQUE using index "user_notifications_types_key_key";

alter table "public"."user_purchases" add constraint "user_purchases_amount_paid_check" CHECK ((amount_paid > (0)::numeric)) not valid;

alter table "public"."user_purchases" validate constraint "user_purchases_amount_paid_check";

alter table "public"."user_purchases" add constraint "user_purchases_payment_reference_key" UNIQUE using index "user_purchases_payment_reference_key";

alter table "public"."user_purchases" add constraint "user_purchases_published_course_id_fkey" FOREIGN KEY (published_course_id) REFERENCES public.published_courses(id) ON DELETE SET NULL not valid;

alter table "public"."user_purchases" validate constraint "user_purchases_published_course_id_fkey";

alter table "public"."user_purchases" add constraint "user_purchases_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_purchases" validate constraint "user_purchases_user_id_fkey";

alter table "public"."user_roles" add constraint "user_roles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."user_roles" validate constraint "user_roles_user_id_fkey";

alter table "public"."user_roles" add constraint "user_roles_user_id_role_key" UNIQUE using index "user_roles_user_id_role_key";

alter table "public"."user_wallets" add constraint "user_wallets_user_id_currency_code_key" UNIQUE using index "user_wallets_user_id_currency_code_key";

alter table "public"."user_wallets" add constraint "user_wallets_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_wallets" validate constraint "user_wallets_user_id_fkey";

alter table "public"."wallet_ledger_entries" add constraint "wallet_ledger_entries_amount_check" CHECK ((amount > (0)::numeric)) not valid;

alter table "public"."wallet_ledger_entries" validate constraint "wallet_ledger_entries_amount_check";

alter table "public"."wallet_ledger_entries" add constraint "wallet_tx_external_dest_id_null" CHECK ((((destination_wallet_type = 'external'::public.wallet_type) AND (destination_wallet_id IS NULL)) OR (destination_wallet_type <> 'external'::public.wallet_type))) not valid;

alter table "public"."wallet_ledger_entries" validate constraint "wallet_tx_external_dest_id_null";

alter table "public"."wallet_ledger_entries" add constraint "wallet_tx_external_source_id_null" CHECK ((((source_wallet_type = 'external'::public.wallet_type) AND (source_wallet_id IS NULL)) OR (source_wallet_type <> 'external'::public.wallet_type))) not valid;

alter table "public"."wallet_ledger_entries" validate constraint "wallet_tx_external_source_id_null";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.accept_organization_invite(invite_token text, user_id uuid, user_email text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_invite record;
  v_organization record;
  v_existing_member_id uuid;
  now_ts timestamptz := now();
  v_original_rls_setting text;
begin
  -- Store the original RLS setting for restoration later
  select current_setting('row_security', true)
  into v_original_rls_setting;

  -- Temporarily disable RLS for this function
  execute 'set row_security = off';

  -- Step 1: Validate input parameters
  if invite_token is null or trim(invite_token) = '' then
    execute format('set row_security = %L', coalesce(v_original_rls_setting, 'on'));
    return json_build_object(
      'success', false, 
      'message', 'Invalid invitation token.',
      'error_code', 'INVALID_TOKEN'
    );
  end if;

  if user_id is null then
    execute format('set row_security = %L', coalesce(v_original_rls_setting, 'on'));
    return json_build_object(
      'success', false, 
      'message', 'User authentication required.',
      'error_code', 'AUTH_REQUIRED'
    );
  end if;

  if user_email is null or trim(user_email) = '' then
    execute format('set row_security = %L', coalesce(v_original_rls_setting, 'on'));
    return json_build_object(
      'success', false, 
      'message', 'User email is required.',
      'error_code', 'EMAIL_REQUIRED'
    );
  end if;

  -- Step 2: Fetch the invite by token
  select oi.id, oi.organization_id, oi.email, oi.role, oi.invited_by, oi.accepted_at, oi.revoked_at, oi.expires_at
  into v_invite
  from public.organization_invites oi
  where oi.token = accept_organization_invite.invite_token;

  if not found then
    execute format('set row_security = %L', coalesce(v_original_rls_setting, 'on'));
    return json_build_object(
      'success', false, 
      'message', 'This invite link is invalid or no longer exists.',
      'error_code', 'INVITE_NOT_FOUND'
    );
  end if;

  -- Step 3: Get organization details for response
  select o.id, o.name, o.tier
  into v_organization
  from public.organizations o
  where o.id = v_invite.organization_id;

  if not found then
    execute format('set row_security = %L', coalesce(v_original_rls_setting, 'on'));
    return json_build_object(
      'success', false, 
      'message', 'The organization for this invite no longer exists.',
      'error_code', 'ORGANIZATION_NOT_FOUND'
    );
  end if;

  -- Step 4: Validate invite state
  if v_invite.revoked_at is not null then
    execute format('set row_security = %L', coalesce(v_original_rls_setting, 'on'));
    return json_build_object(
      'success', false, 
      'message', 'This invite was revoked by the organization.',
      'error_code', 'INVITE_REVOKED'
    );
  end if;

  if v_invite.accepted_at is not null then
    execute format('set row_security = %L', coalesce(v_original_rls_setting, 'on'));
    return json_build_object(
      'success', false, 
      'message', 'This invite has already been accepted.',
      'error_code', 'INVITE_ALREADY_ACCEPTED'
    );
  end if;

  if v_invite.expires_at is not null and v_invite.expires_at < now_ts then
    execute format('set row_security = %L', coalesce(v_original_rls_setting, 'on'));
    return json_build_object(
      'success', false, 
      'message', 'This invite has expired. Please request a new one.',
      'error_code', 'INVITE_EXPIRED'
    );
  end if;

  -- Step 5: Validate email match (case-insensitive)
  if v_invite.email is not null and lower(v_invite.email) != lower(accept_organization_invite.user_email) then
    execute format('set row_security = %L', coalesce(v_original_rls_setting, 'on'));
    return json_build_object(
      'success', false, 
      'message', 'This invite was sent to a different email address.',
      'error_code', 'EMAIL_MISMATCH'
    );
  end if;

  -- Step 6: Check if the user is already a member
  select om.id
  into v_existing_member_id
  from public.organization_members om
  where om.organization_id = v_invite.organization_id
    and om.user_id = accept_organization_invite.user_id;

  if found then
    execute format('set row_security = %L', coalesce(v_original_rls_setting, 'on'));
    return json_build_object(
      'success', false, 
      'message', 'You are already a member of this organization.',
      'error_code', 'ALREADY_MEMBER'
    );
  end if;

  -- Step 7: Check if organization can accept new members
  if not public.can_accept_new_member(v_invite.organization_id, 'accept') then
    execute format('set row_security = %L', coalesce(v_original_rls_setting, 'on'));
    return json_build_object(
      'success', false, 
      'message', 'This organization has reached its member limit.',
      'error_code', 'MEMBER_LIMIT_REACHED'
    );
  end if;
 
  -- Step 8: Mark invite as accepted
  update public.organization_invites
  set accepted_at = now_ts,
      accepted_by = accept_organization_invite.user_id,
      updated_at = now_ts
  where id = v_invite.id;

  -- Step 9: Add user to organization_members
  insert into public.organization_members (
    organization_id,
    user_id,
    role,
    invited_by,
    created_at,
    updated_at
  )
  values (
    v_invite.organization_id,
    accept_organization_invite.user_id,
    v_invite.role,
    v_invite.invited_by,
    now_ts,
    now_ts
  );

  -- Step 10: Restore original RLS setting
  execute format('set row_security = %L', coalesce(v_original_rls_setting, 'on'));

  -- Step 11: Return success response with enhanced data
  return json_build_object(
    'success', true,
    'message', format('Welcome to %s! You''ve successfully joined as %s.', v_organization.name, v_invite.role),
    'data', json_build_object(
      'organization_id', v_invite.organization_id,
      'organization_name', v_organization.name,
      'role', v_invite.role,
      'user_id', accept_organization_invite.user_id,
      'joined_at', now_ts
    )
  );

exception
  when others then
    -- Restore RLS setting in case of any exception
    execute format('set row_security = %L', coalesce(v_original_rls_setting, 'on'));
    
    -- Log the error for debugging
    raise log 'Error in accept_organization_invite: % %', sqlstate, sqlerrm;
    
    -- Return user-friendly error
    return json_build_object(
      'success', false,
      'message', 'An unexpected error occurred while processing your invitation.',
      'error_code', 'INTERNAL_ERROR'
    );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.add_creator_as_course_editor()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_role text;
  v_user uuid := (select auth.uid()); -- Authenticated user performing the insert
begin
  -- Fetch user's role within the course's organization
  select public.get_user_org_role(NEW.organization_id, v_user)
    into v_role;

  -- Only auto-add if user is an editor
  if v_role = 'editor' then
    insert into public.course_editors (course_id, user_id, organization_id, added_by)
    values (NEW.id, v_user, NEW.organization_id, v_user)
    on conflict (course_id, user_id) do nothing;
  end if;

  return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.add_default_free_pricing_tier()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  insert into public.course_pricing_tiers (
    course_id,
    organization_id,
    is_free,
    price,
    currency_code,
    created_by,
    updated_by,
    payment_frequency,
    tier_name
  ) values (
    new.id,
    new.organization_id,
    true,
    0,
    'USD',
    new.created_by,
    new.created_by,
    'monthly',
    'free'
  );
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.add_or_update_owner_in_organization_members()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  -- On insert: add initial owner
  if tg_op = 'INSERT' and new.owned_by is not null then
    insert into public.organization_members (
      organization_id,
      user_id,
      role,
      invited_by
    )
    values (
      new.id,
      new.owned_by,
      'owner',
      new.owned_by
    )
    on conflict do nothing;

  -- On update: ownership transfer
  elsif tg_op = 'UPDATE' and new.owned_by is distinct from old.owned_by then
    if new.owned_by is not null then
      insert into public.organization_members (
        organization_id,
        user_id,
        role,
        invited_by
      )
      values (
        new.id,
        new.owned_by,
        'owner',
        new.owned_by
      )
      on conflict do nothing;
    end if;
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.assign_launch_subscription_to_new_org()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  -- Skip if this organization already has a subscription (safety check)
  if exists (
    select 1
    from public.organization_subscriptions s
    where s.organization_id = new.id
  ) then
    return new;
  end if;

  -- Insert default subscription record
  insert into public.organization_subscriptions (
    organization_id,
    tier,
    status,
    start_date,
    current_period_start,
    current_period_end,
    created_by,
    updated_by
  )
  values (
    new.id,                 -- new organization ID
    'launch',               -- default free tier
    'active',               -- active subscription
    timezone('utc', now()), -- subscription start date
    timezone('utc', now()), -- current period start
    null,                   -- 'launch' tier has no expiry
    new.created_by,         -- who created the organization (if tracked)
    new.created_by
  );

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.authorize(requested_permission public.app_permission)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  has_permission int;
  user_role public.app_role;
begin
  -- Extract the user's role from the JWT claims
  select (auth.jwt() ->> 'user_role')::public.app_role
    into user_role;

  -- Check if the role has the requested permission
  select count(*) into has_permission
  from public.role_permissions
  where role = user_role
    and permission = requested_permission;

  -- Return true if the permission is granted
  return has_permission > 0;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_access_end_date(start_date timestamp with time zone, frequency public.payment_frequency)
 RETURNS timestamp with time zone
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
begin
  -- Return the corresponding interval added to the start_date
  return case frequency
    when 'monthly' then       start_date + interval '1 month'
    when 'bi_monthly' then    start_date + interval '2 months'
    when 'quarterly' then     start_date + interval '3 months'
    when 'semi_annual' then   start_date + interval '6 months'
    when 'annual' then        start_date + interval '12 months'
  end;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.can_accept_new_member(arg_org_id uuid, arg_check_type text DEFAULT 'invite'::text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  with counts as (
    select 
      count(distinct om.user_id) as active_members,
      count(distinct oi.email) filter (
        where oi.accepted_at is null 
          and oi.revoked_at is null 
          and oi.expires_at > now()
      ) as pending_invites
    from public.organizations o
    left join public.organization_members om on o.id = om.organization_id
    left join public.organization_invites oi on o.id = oi.organization_id
    where o.id = arg_org_id
  ),
  limits as (
    select tl.max_members_per_org
    from public.organizations o
    join public.tier_limits tl on o.tier = tl.tier
    where o.id = arg_org_id
  )
  select case 
    when arg_check_type = 'accept' then
      -- When accepting, only check active members
      -- (the pending invite will become an active member)
      counts.active_members < limits.max_members_per_org
    else
      -- When inviting, check both active members + pending invites
      -- to prevent over-inviting
      (counts.active_members + counts.pending_invites) < limits.max_members_per_org
  end
  from counts, limits;
$function$
;

CREATE OR REPLACE FUNCTION public.can_create_organization(tier_name text, arg_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  with user_org_count as (
    select count(*) as count
    from public.organizations
    where owned_by = coalesce(arg_user_id, auth.uid())
      and tier = tier_name::public.subscription_tier
  ),
  tier_limit as (
    select max_organizations_per_user
    from public.tier_limits
    where tier = tier_name::public.subscription_tier
  )
  select user_org_count.count < tier_limit.max_organizations_per_user
  from user_org_count, tier_limit;
$function$
;

CREATE OR REPLACE FUNCTION public.can_publish_course(course_id uuid, org_id uuid, user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  select 
    public.get_user_org_role(org_id, user_id) in ('owner', 'admin')
    or exists (
      select 1
      from public.course_editors ce
      where ce.course_id = course_id
        and ce.user_id = user_id
    );
$function$
;

CREATE OR REPLACE FUNCTION public.can_user_edit_course(arg_course_id uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  -- Determine if the current user has permission to edit the specified course
  select coalesce(
    (
      -- User is an owner or admin in the course's organization
      public.get_user_org_role(c.organization_id, (select auth.uid())) in ('owner', 'admin')

      -- OR user is an assigned course editor
      or exists (
        select 1
        from public.course_editors ce
        where ce.course_id = c.id
          and ce.user_id = (select auth.uid())
      )
    ),
    false  -- Default to false if no course or permission
  )
  from public.courses c
  where c.id = arg_course_id
$function$
;

CREATE OR REPLACE FUNCTION public.check_storage_limit(p_organization_id uuid, p_new_file_size bigint, p_exclude_file_path text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_current_usage bigint;
  v_storage_limit_mb integer;
  v_storage_limit_bytes bigint;
begin
  select coalesce(sum(size), 0)
  into v_current_usage
  from public.file_library
  where organization_id = p_organization_id
    and (p_exclude_file_path is null or path != p_exclude_file_path);
  
  select tl.storage_limit_mb_per_org
  into v_storage_limit_mb
  from public.organizations o
  join public.tier_limits tl on tl.tier = o.tier
  where o.id = p_organization_id;
  
  if v_storage_limit_mb is null then
    return false;
  end if;
  
  v_storage_limit_bytes := v_storage_limit_mb * 1024 * 1024;
  
  return (v_current_usage + p_new_file_size) <= v_storage_limit_bytes;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.complete_block(p_published_course_id uuid, p_chapter_id uuid, p_lesson_id uuid, p_block_id uuid, p_earned_score numeric DEFAULT NULL::numeric, p_time_spent_seconds integer DEFAULT 0, p_interaction_data jsonb DEFAULT NULL::jsonb, p_last_response jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  current_user_id uuid;
  v_organization_id uuid;
  course_structure jsonb;
  block_weight numeric;
  course_total_blocks integer := 0;
  course_total_lessons integer := 0;
  course_total_chapters integer := 0;
  course_total_weight numeric := 0;
  course_total_lesson_weight numeric := 0;
  chapter_total_blocks integer := 0;
  chapter_total_lessons integer := 0;
  chapter_total_weight numeric := 0;
  chapter_total_lesson_weight numeric := 0;
  lesson_total_blocks integer := 0;
  lesson_total_weight numeric := 0;
  v_course_progress_id uuid;
  v_chapter_progress_id uuid;
  v_lesson_progress_id uuid;
  v_block_progress_id uuid;
  was_already_completed boolean := false;
  existing_completed_at timestamptz;
  navigation_data jsonb;
  result jsonb;
begin
  current_user_id := auth.uid();
  if current_user_id is null then
    raise exception 'User not authenticated';
  end if;

  select 
    pcsc.course_structure_content,
    pc.organization_id
  into 
    course_structure,
    v_organization_id
  from public.published_course_structure_content pcsc
  inner join public.published_courses pc on pc.id = pcsc.id
  where pcsc.id = p_published_course_id;

  if course_structure is null then
    raise exception 'Course structure not found for published_course_id: %', p_published_course_id;
  end if;

  select coalesce(
    (block_obj->>'weight')::numeric,
    1.0
  )
  into block_weight
  from jsonb_path_query(
    course_structure,
    '$.chapters[*].lessons[*].blocks[*] ? (@.id == $block_id)',
    jsonb_build_object('block_id', p_block_id::text)
  ) as block_obj
  limit 1;

  if block_weight is null then
    raise exception 'Block weight not found in structure for block_id: %', p_block_id;
  end if;

  with course_blocks as (
    select 
      (chapter_obj->>'id')::uuid as chapter_id,
      (lesson_obj->>'id')::uuid as lesson_id,
      (block_obj->>'id')::uuid as block_id,
      coalesce((block_obj->>'weight')::numeric, 1.0) as weight
    from jsonb_array_elements(course_structure->'chapters') as chapter_obj,
         jsonb_array_elements(chapter_obj->'lessons') as lesson_obj,
         jsonb_array_elements(lesson_obj->'blocks') as block_obj
  ),
  lesson_weights as (
    select lesson_id, sum(weight) as lesson_weight
    from course_blocks
    group by lesson_id
  )
  select 
    count(distinct cb.block_id),
    count(distinct cb.lesson_id),
    count(distinct cb.chapter_id),
    sum(cb.weight),
    sum(lw.lesson_weight)
  into 
    course_total_blocks,
    course_total_lessons,
    course_total_chapters,
    course_total_weight,
    course_total_lesson_weight
  from course_blocks cb
  inner join lesson_weights lw on lw.lesson_id = cb.lesson_id;

  with chapter_blocks as (
    select 
      (lesson_obj->>'id')::uuid as lesson_id,
      (block_obj->>'id')::uuid as block_id,
      coalesce((block_obj->>'weight')::numeric, 1.0) as weight
    from jsonb_path_query(
      course_structure,
      '$.chapters[*] ? (@.id == $chapter_id)',
      jsonb_build_object('chapter_id', p_chapter_id::text)
    ) as chapter_obj,
    jsonb_array_elements(chapter_obj->'lessons') as lesson_obj,
    jsonb_array_elements(lesson_obj->'blocks') as block_obj
  ),
  chapter_lesson_weights as (
    select lesson_id, sum(weight) as lesson_weight
    from chapter_blocks
    group by lesson_id
  )
  select 
    count(distinct cb.block_id),
    count(distinct cb.lesson_id),
    sum(cb.weight),
    sum(clw.lesson_weight)
  into 
    chapter_total_blocks,
    chapter_total_lessons,
    chapter_total_weight,
    chapter_total_lesson_weight
  from chapter_blocks cb
  inner join chapter_lesson_weights clw on clw.lesson_id = cb.lesson_id;

  select 
    count(*),
    sum(coalesce((block_obj->>'weight')::numeric, 1.0))
  into 
    lesson_total_blocks,
    lesson_total_weight
  from jsonb_path_query(
    course_structure,
    '$.chapters[*].lessons[*] ? (@.id == $lesson_id)',
    jsonb_build_object('lesson_id', p_lesson_id::text)
  ) as lesson_obj,
  jsonb_array_elements(lesson_obj->'blocks') as block_obj;

  insert into public.course_progress (
    user_id,
    published_course_id,
    total_blocks,
    total_lessons,
    total_chapters,
    total_weight,
    total_lesson_weight
  ) 
  values (
    current_user_id,
    p_published_course_id,
    course_total_blocks,
    course_total_lessons,
    course_total_chapters,
    course_total_weight,
    course_total_lesson_weight
  )
  on conflict (user_id, published_course_id)
  do update set
    total_blocks = excluded.total_blocks,
    total_lessons = excluded.total_lessons,
    total_chapters = excluded.total_chapters,
    total_weight = excluded.total_weight,
    total_lesson_weight = excluded.total_lesson_weight,
    updated_at = timezone('utc', now())
  returning id into v_course_progress_id;

  insert into public.chapter_progress (
    course_progress_id,
    user_id,
    published_course_id,
    chapter_id,
    total_blocks,
    total_lessons,
    total_weight,
    total_lesson_weight
  )
  values (
    v_course_progress_id,
    current_user_id,
    p_published_course_id,
    p_chapter_id,
    chapter_total_blocks,
    chapter_total_lessons,
    chapter_total_weight,
    chapter_total_lesson_weight
  )
  on conflict (user_id, published_course_id, chapter_id)
  do update set
    course_progress_id = excluded.course_progress_id,
    total_blocks = excluded.total_blocks,
    total_lessons = excluded.total_lessons,
    total_weight = excluded.total_weight,
    total_lesson_weight = excluded.total_lesson_weight,
    updated_at = timezone('utc', now())
  returning id into v_chapter_progress_id;

  insert into public.lesson_progress (
    chapter_progress_id,
    user_id,
    published_course_id,
    lesson_id,
    total_blocks,
    total_weight
  )
  values (
    v_chapter_progress_id,
    current_user_id,
    p_published_course_id,
    p_lesson_id,
    lesson_total_blocks,
    lesson_total_weight
  )
  on conflict (user_id, published_course_id, lesson_id)
  do update set
    chapter_progress_id = excluded.chapter_progress_id,
    total_blocks = excluded.total_blocks,
    total_weight = excluded.total_weight,
    updated_at = timezone('utc', now())
  returning id into v_lesson_progress_id;

  select is_completed, completed_at
  into was_already_completed, existing_completed_at
  from public.block_progress
  where user_id = current_user_id
    and published_course_id = p_published_course_id
    and block_id = p_block_id;

  if was_already_completed is null then
    was_already_completed := false;
  end if;

  insert into public.block_progress (
    lesson_progress_id,
    organization_id,
    published_course_id,
    chapter_id,
    lesson_id,
    block_id,
    block_weight,
    is_completed,
    completed_at,
    time_spent_seconds,
    earned_score,
    attempt_count,
    interaction_data,
    last_response,
    user_id
  )
  values (
    v_lesson_progress_id,
    v_organization_id,
    p_published_course_id,
    p_chapter_id,
    p_lesson_id,
    p_block_id,
    block_weight,
    true,
    timezone('utc', now()),
    p_time_spent_seconds,
    p_earned_score,
    1,
    p_interaction_data,
    p_last_response,
    current_user_id
  )
  on conflict (user_id, published_course_id, block_id)
  do update set
    lesson_progress_id = excluded.lesson_progress_id,
    block_weight = excluded.block_weight,
    is_completed = true,
    completed_at = coalesce(block_progress.completed_at, timezone('utc', now())),
    time_spent_seconds = block_progress.time_spent_seconds + excluded.time_spent_seconds,
    earned_score = coalesce(excluded.earned_score, block_progress.earned_score),
    attempt_count = coalesce(block_progress.attempt_count, 0) + 1,
    interaction_data = coalesce(excluded.interaction_data, block_progress.interaction_data),
    last_response = coalesce(excluded.last_response, block_progress.last_response),
    updated_at = timezone('utc', now())
  returning id into v_block_progress_id;

  if not was_already_completed then
    perform public.update_lesson_progress_for_user(current_user_id, p_published_course_id, p_lesson_id);
    perform public.update_chapter_progress_for_user(current_user_id, p_published_course_id, p_chapter_id, v_course_progress_id);
    perform public.update_course_progress_for_user(current_user_id, p_published_course_id);
  end if;

  begin
    select public.get_unified_navigation(
      current_user_id,
      p_published_course_id,
      p_block_id,
      p_lesson_id,
      p_chapter_id
    ) into navigation_data;
  exception
    when others then
      navigation_data := jsonb_build_object('error', 'Navigation data unavailable');
  end;

  result := jsonb_build_object(
    'success', true,
    'user_id', current_user_id,
    'published_course_id', p_published_course_id,
    'chapter_id', p_chapter_id,
    'lesson_id', p_lesson_id,
    'block_id', p_block_id,
    'course_progress_id', v_course_progress_id,
    'chapter_progress_id', v_chapter_progress_id,
    'lesson_progress_id', v_lesson_progress_id,
    'block_progress_id', v_block_progress_id,
    'was_already_completed', was_already_completed,
    'block_weight', block_weight,
    'earned_score', p_earned_score,
    'time_spent_seconds', p_time_spent_seconds,
    'completed_at', date_trunc('second', timezone('utc', coalesce(existing_completed_at, now())))::timestamptz,
    'navigation', navigation_data
  );

  return result;

exception
  when others then
    return jsonb_build_object(
      'success', false,
      'error', sqlerrm,
      'error_detail', sqlstate
    );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.count_active_students(org_id uuid)
 RETURNS bigint
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select count(distinct user_id)
  from public.course_enrollments
  where organization_id = org_id
    and is_active = true;
$function$
;

CREATE OR REPLACE FUNCTION public.count_total_unique_students(org_id uuid)
 RETURNS bigint
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select count(distinct user_id)
  from public.course_enrollments
  where organization_id = org_id;
$function$
;

CREATE OR REPLACE FUNCTION public.create_organization_wallets()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  currency public.currency_code;
begin
  -- For each defined currency, create a wallet for the new organization
  for currency in select unnest(enum_range(null::public.currency_code)) 
  loop
    -- Log which wallet is being created
    raise notice 'Creating wallet in % for org %', currency, new.id;

    insert into public.organization_wallets (
      organization_id,
      currency_code
    )
    values (
      new.id,                     -- organization_id
      currency                    -- currency_code
    )
    on conflict (organization_id, currency_code) do nothing;
  end loop;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.create_user_wallets()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  currency public.currency_code;
begin
  for currency in select unnest(enum_range(null::public.currency_code)) 
  loop
    -- Log which wallet is being created
    raise notice 'Creating user wallet in % for org %', currency, new.id;

    insert into public.user_wallets (
      user_id,
      currency_code
    )
    values (
      new.id,
      currency
    )
    on conflict (user_id, currency_code) do nothing;
  end loop;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  claims jsonb;
  user_role public.app_role;
begin
  -- Look up user's role from the user_roles table
  select role into user_role
  from public.user_roles
  where user_id = (event->>'user_id')::uuid;

  -- Get current claims from the event
  claims := event->'claims';

  -- Inject user_role into claims (set to null if role is not found)
  if user_role is not null then
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  else
    claims := jsonb_set(claims, '{user_role}', 'null');
  end if;

  -- Return the modified JWT payload
  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_chapter(p_chapter_id uuid, p_deleted_by uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_course_id uuid;
  v_org_id uuid;
  v_course_creator uuid;
  v_chapter_position int;
begin
  -- Step 1: Fetch chapter metadata
  select c.course_id, cr.organization_id, cr.created_by, c.position
  into v_course_id, v_org_id, v_course_creator, v_chapter_position
  from public.chapters c
  join public.courses cr on c.course_id = cr.id
  where c.id = p_chapter_id;

  if v_course_id is null then
    raise exception 'Chapter does not exist';
  end if;

  -- Step 2: Permission check
  if not (
    public.has_org_role(v_org_id, 'admin', p_deleted_by) or
    v_course_creator = p_deleted_by
  ) then
    raise exception 'You do not have permission to delete this chapter';
  end if;

  -- Step 3: Delete chapter
  delete from public.chapters
  where id = p_chapter_id;

  if not found then
    raise exception 'Chapter deletion failed';
  end if;

  -- Step 4: Shift remaining chapters down
  update public.chapters
  set position = position - 1000000
  where course_id = v_course_id
    and position > v_chapter_position;

  -- Step 5: Normalize remaining chapter positions
  update public.chapters
  set 
    position = position + 999999,
    updated_at = timezone('utc', now()),
    updated_by = p_deleted_by
  where course_id = v_course_id
    and position < 0;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_course_editors_on_role_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  -- Only act if the role changed from 'editor' to something else
  if old.role = 'editor' and new.role <> 'editor' then
    delete from public.course_editors
    using public.courses c
    where course_editors.user_id = old.user_id
      and course_editors.course_id = c.id
      and c.organization_id = old.organization_id;
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_lesson(p_lesson_id uuid, p_deleted_by uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_chapter_id uuid;
  v_course_id uuid;
  v_org_id uuid;
  v_course_created_by uuid;
  v_lesson_position int;
begin
  -- Fetch the lesson's chapter, course, and org context
  select 
    l.chapter_id, 
    l.course_id, 
    c.organization_id, 
    c.created_by,
    l.position
  into 
    v_chapter_id, 
    v_course_id, 
    v_org_id, 
    v_course_created_by,
    v_lesson_position
  from public.lessons l
  join public.courses c on c.id = l.course_id
  where l.id = p_lesson_id;

  -- Ensure the lesson exists
  if v_course_id is null then
    raise exception 'Lesson does not exist';
  end if;

  -- Check org role and ownership
  if not (
    public.has_org_role(v_org_id, 'admin', p_deleted_by) or
    public.has_org_role(v_org_id, 'owner', p_deleted_by) or
    (public.has_org_role(v_org_id, 'editor', p_deleted_by) and v_course_created_by = p_deleted_by)
  ) then
    raise exception 'Insufficient permissions to delete this lesson';
  end if;

  -- Delete the lesson
  delete from public.lessons
  where id = p_lesson_id;

  if not found then
    raise exception 'Failed to delete lesson';
  end if;

  -- Step 1: Temporarily shift down positions of remaining lessons to avoid conflicts
  update public.lessons
  set position = position - 1000000
  where chapter_id = v_chapter_id
    and position > v_lesson_position;

  -- Step 2: Normalize final positions and update audit metadata
  update public.lessons
  set 
    position = position + 999999,
    updated_at = timezone('utc', now()),
    updated_by = p_deleted_by
  where chapter_id = v_chapter_id
    and position < 0;

end;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_lesson_block(p_block_id uuid, p_deleted_by uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_lesson_id uuid;
  v_course_id uuid;
  v_org_id uuid;
  v_course_creator uuid;
  v_block_position int;
begin
  -- Step 1: Fetch lesson ID and current block position
  select lb.lesson_id, lb.position
  into v_lesson_id, v_block_position
  from public.lesson_blocks lb
  where lb.id = p_block_id;

  if v_lesson_id is null then
    raise exception 'Lesson block does not exist';
  end if;

  -- Step 2: Fetch course/org context and creator
  select c.id, c.organization_id, c.created_by
  into v_course_id, v_org_id, v_course_creator
  from public.lessons l
  join public.courses c on l.course_id = c.id
  where l.id = v_lesson_id;

  if v_course_id is null then
    raise exception 'Associated course does not exist';
  end if;

  -- Step 3: Permission check
  if not (
    public.has_org_role(v_org_id, 'admin', p_deleted_by) or
    v_course_creator = p_deleted_by
  ) then
    raise exception 'You do not have permission to delete this block';
  end if;

  -- Step 4: Delete the block
  delete from public.lesson_blocks
  where id = p_block_id;

  if not found then
    raise exception 'Failed to delete lesson block';
  end if;

  -- Step 5: Shift down remaining block positions
  update public.lesson_blocks
  set position = position - 1000000
  where lesson_id = v_lesson_id
    and position > v_block_position;

  -- Step 6: Normalize final positions and set audit metadata
  update public.lesson_blocks
  set 
    position = position + 999999,
    updated_at = timezone('utc', now()),
    updated_by = p_deleted_by
  where lesson_id = v_lesson_id
    and position < 0;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_pricing_tier(p_tier_id uuid, p_deleted_by uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_course_id uuid;
  v_org_id uuid;
  v_position int;
begin
  select t.course_id, c.organization_id, t.position
  into v_course_id, v_org_id, v_position
  from public.course_pricing_tiers t
  join public.courses c on c.id = t.course_id
  where t.id = p_tier_id;

  if v_course_id is null then
    raise exception 'Pricing tier not found';
  end if;

  if not (
    public.has_org_role(v_org_id, 'owner', p_deleted_by)
    or public.has_org_role(v_org_id, 'admin', p_deleted_by)
    or exists (select 1 from public.course_editors where course_id = v_course_id and user_id = p_deleted_by)
  ) then
    raise exception 'Insufficient permissions to delete pricing tiers in this course';
  end if;

  delete from public.course_pricing_tiers
  where id = p_tier_id;

  update public.course_pricing_tiers
  set 
    position = position - 1,
    updated_at = timezone('utc', now()),
    updated_by = p_deleted_by
  where course_id = v_course_id and position > v_position;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.determine_file_type(extension text)
 RETURNS public.file_type
 LANGUAGE plpgsql
 IMMUTABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  return case
    when extension in ('jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tif', 'tiff', 'heic') then 'image'::public.file_type
    when extension in ('mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'aiff', 'aif') then 'audio'::public.file_type
    when extension in ('mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv') then 'video'::public.file_type
    when extension in ('gltf', 'glb', 'obj', 'fbx', 'stl', 'dae', '3ds', 'usdz') then 'model3d'::public.file_type
    when extension in ('pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt') then 'document'::public.file_type
    else 'other'::public.file_type
  end;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.enforce_at_least_one_active_pricing_tier()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  bypass_check boolean;
  remaining_active_count integer;
begin
  begin
    select coalesce(nullif(current_setting('app.converting_course_pricing', true), '')::boolean, false)
    into bypass_check;
  exception when others then
    bypass_check := false;
  end;

  if bypass_check then
    return coalesce(new, old);
  end if;

  if tg_op = 'update' and old.is_active = true and new.is_active = false then
    select count(*) into remaining_active_count
    from public.course_pricing_tiers
    where course_id = old.course_id
      and organization_id = old.organization_id
      and id != old.id
      and is_active = true;

    if remaining_active_count = 0 then
      raise exception
        'Each course must have at least one active pricing tier. Please ensure at least one remains active.';
    end if;
  end if;

  return coalesce(new, old);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.enqueue_delete_course_progress(course_id uuid)
 RETURNS void
 LANGUAGE sql
 SET search_path TO ''
AS $function$
  select pgmq.send(
    'delete_course_progress_queue',
    jsonb_build_object('course_id', course_id)
  );
$function$
;

CREATE OR REPLACE FUNCTION public.enroll_user_in_free_course(p_user_id uuid, p_published_course_id uuid, p_tier_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_now timestamptz := timezone('utc', now());
  v_access_start timestamptz := v_now;
  v_access_end timestamptz := v_access_start + interval '1 month';

  -- course / org
  v_org_id uuid;
  v_course_title text;

  -- tier
  v_tier_name text;
  v_tier_description text;
  v_tier_promotional_price numeric(19,4);
  v_tier_price numeric(19,4);
  v_tier_currency public.currency_code;
  v_tier_frequency public.payment_frequency;
  v_tier_is_free boolean;

  -- enrollment
  v_enrollment_id uuid;
  v_existing_enrollment record;

  -- activity
  v_activity_id uuid;
begin
  ---------------------------------------------------------------
  -- Validate published course and get organization
  ---------------------------------------------------------------
  select pc.name, pc.organization_id
  into v_course_title, v_org_id
  from public.published_courses pc
  where pc.id = p_published_course_id
    and pc.is_active = true;

  if not found then
    raise exception 'Published course not found or inactive: %', p_published_course_id;
  end if;

  ---------------------------------------------------------------
  -- Validate pricing tier belongs to the course and is free
  ---------------------------------------------------------------
  select
    pt.tier_name,
    pt.tier_description,
    pt.price      as price_amount,
    pt.promotional_price,
    pt.currency_code::public.currency_code,
    pt.payment_frequency::public.payment_frequency,
    pt.is_free
  into
    v_tier_name,
    v_tier_description,
    v_tier_price,
    v_tier_promotional_price,
    v_tier_currency,
    v_tier_frequency,
    v_tier_is_free
  from public.course_pricing_tiers pt
  where pt.id = p_tier_id
    and pt.course_id = p_published_course_id
    and pt.is_active = true;

  if not found then
    raise exception 'Pricing tier not found for this course: %', p_tier_id;
  end if;

  if not v_tier_is_free then
    raise exception 'TIER_NOT_FREE: tier % is not marked free', p_tier_id;
  end if;

  -- Optional sanity: ensure price is zero if you store numeric price
  if v_tier_price is not null and v_tier_price <> 0 then
    raise exception 'TIER_PRICE_MISMATCH: tier % price is % (expected 0)', p_tier_id, v_tier_price;
  end if;

  ---------------------------------------------------------------
  -- Check for existing enrollment (locks the row when present)
  ---------------------------------------------------------------
  select id, user_id, published_course_id, organization_id, enrolled_at, expires_at, is_active
  into v_existing_enrollment
  from public.course_enrollments e
  where e.user_id = p_user_id
    and e.published_course_id = p_published_course_id
  for update;

  if found then
    -- If already active and not expired, return existing
    if v_existing_enrollment.is_active = true
       and (v_existing_enrollment.expires_at is null or v_existing_enrollment.expires_at > v_now) then
      return jsonb_build_object(
        'success', true,
        'message', 'User already actively enrolled in free course',
        'enrollment_id', v_existing_enrollment.id,
        'was_created', false
      );
    end if;

    -- Otherwise renew / reactivate the enrollment
    update public.course_enrollments
    set expires_at = v_access_end,
        is_active = true,
        updated_at = v_now,
        enrolled_at = coalesce(v_existing_enrollment.enrolled_at, v_now),
        completed_at = null
    where id = v_existing_enrollment.id
    returning id into v_enrollment_id;
  else
    -- Create a new enrollment
    insert into public.course_enrollments (
      id, user_id, published_course_id, organization_id,
      enrolled_at, expires_at, completed_at, is_active,
      created_at, updated_at
    ) values (
      gen_random_uuid(), p_user_id, p_published_course_id, v_org_id,
      v_access_start, v_access_end, null, true,
      v_now, v_now
    )
    returning id into v_enrollment_id;
  end if;

  ---------------------------------------------------------------
  -- Insert enrollment activity (mirrors paid flow activity shape)
  ---------------------------------------------------------------
  insert into public.course_enrollment_activities (
    enrollment_id, tier_name, tier_description, payment_frequency,
    currency_code, is_free, price_paid, promotional_price, was_promotional,
    access_start, access_end, created_by, created_at
  ) values (
    v_enrollment_id, v_tier_name, v_tier_description, v_tier_frequency,
    v_tier_currency, true, 0, v_tier_promotional_price,
    (v_tier_promotional_price is not null and v_tier_promotional_price < coalesce(v_tier_price, 0)),
    v_access_start, v_access_end, p_user_id, v_now
  ) returning id into v_activity_id;

  ---------------------------------------------------------------
  -- Insert user notification for free enrollment success
  ---------------------------------------------------------------
  begin
    perform public.insert_user_notification(
      p_user_id := p_user_id,
      p_type_key := 'course_enrollment_free_success',
      p_metadata := jsonb_build_object(
        'enrollment_id', v_enrollment_id,
        'course_title', v_course_title,
        'tier_name', v_tier_name,
        'access_start', v_access_start,
        'access_end', v_access_end
      )
    );
  exception
    when others then
      -- Log or ignore notification errors, but don't fail the enrollment
      raise notice 'Failed to insert user notification: %', sqlerrm;
  end;

  
  ---------------------------------------------------------------
  -- Return success summary
  ---------------------------------------------------------------
  return jsonb_build_object(
    'success', true,
    'message', 'User enrolled (free tier) successfully',
    'enrollment_id', v_enrollment_id,
    'activity_id', v_activity_id,
    'user_id', p_user_id,
    'course_title', v_course_title,
    'tier_name', v_tier_name,
    'access_start', v_access_start,
    'access_end', v_access_end
  );

exception
  when unique_violation then
    -- Defensive: if concurrent insert violated unique constraint, fetch the row and return it
    perform 1
    from public.course_enrollments e
    where e.user_id = p_user_id
      and e.published_course_id = p_published_course_id
    limit 1;

    select id into v_enrollment_id
    from public.course_enrollments e
    where e.user_id = p_user_id
      and e.published_course_id = p_published_course_id
    limit 1;

    return jsonb_build_object(
      'success', true,
      'message', 'User already enrolled (race condition handled)',
      'enrollment_id', v_enrollment_id,
      'was_created', false
    );

  when others then
    raise exception 'Free enrollment failed: %', sqlerrm;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.ensure_editor_is_valid()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  course_org uuid;
begin
  -- ✅ Fetch course organization_id (and confirm course exists)
  select c.organization_id into course_org
  from public.courses c
  where c.id = new.course_id;

  if course_org is null then
    raise exception
      'Invalid course_id: course % does not exist', new.course_id
      using errcode = 'P0001';
  end if;

  -- ✅ Ensure the editor's organization_id matches the course's org
  if new.organization_id <> course_org then
    raise exception
      'organization_id % does not match course''s organization_id % for course %',
      new.organization_id, course_org, new.course_id
      using errcode = 'P0001';
  end if;

  -- ✅ Ensure the user is a member of this organization
  if not exists (
    select 1
    from public.organization_members m
    where m.organization_id = course_org
      and m.user_id = new.user_id
  ) then
    raise exception
      'User % is not a member of organization % (course %)',
      new.user_id, course_org, new.course_id
      using errcode = 'P0001';
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.ensure_incremented_course_version()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  latest_version int;
  content_changed boolean := false;
begin
  select coalesce(max(version), 0)
  into latest_version
  from public.published_courses
  where id = NEW.id;

  if TG_OP = 'INSERT' then
    if NEW.version is null or NEW.version <= latest_version then
      NEW.version := latest_version + 1;
    end if;
    NEW.published_at := timezone('utc', now());

  elsif TG_OP = 'UPDATE' then
    content_changed := (
      NEW.name IS DISTINCT FROM OLD.name OR
      NEW.description IS DISTINCT FROM OLD.description OR
      NEW.image_url IS DISTINCT FROM OLD.image_url OR
      NEW.blur_hash IS DISTINCT FROM OLD.blur_hash OR
      NEW.visibility IS DISTINCT FROM OLD.visibility OR
      NEW.course_structure_overview IS DISTINCT FROM OLD.course_structure_overview OR
      NEW.pricing_tiers IS DISTINCT FROM OLD.pricing_tiers
    );

    if content_changed then
      NEW.version := greatest(OLD.version + 1, latest_version + 1);
      NEW.published_at := timezone('utc', now());
    else
      NEW.version := OLD.version;
      NEW.published_at := OLD.published_at;
    end if;
  end if;

  return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_active_organization_members(_organization_id uuid, _user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  result jsonb;
begin
  -- Ensure the calling user is part of the organization
  if not exists (
    select 1
    from public.organization_members
    where organization_id = _organization_id
      and user_id = _user_id
  ) then
    raise exception 'Access denied: you are not a member of this organization';
  end if;

  -- Fetch all members in the organization
  select jsonb_agg(jsonb_build_object(
    'user', jsonb_build_object(
      'id', u.id,
      'username', u.username,
      'full_name', u.full_name,
      'avatar_url', u.avatar_url,
      'blur_hash', u.blur_hash,
      'phone_number', u.phone_number,
      'country_code', u.country_code,
      'active_organization_id', u.active_organization_id
    ),
    'invited_by', case
      when inviter.id is not null then jsonb_build_object(
        'id', inviter.id,
        'username', inviter.username,
        'full_name', inviter.full_name,
        'avatar_url', inviter.avatar_url,
        'blur_hash', inviter.blur_hash
      )
      else null
    end,
    'membership_id', m.id,
    'organization_id', m.organization_id,
    'role', m.role,
    'membership_created_at', m.created_at,
    'membership_updated_at', m.updated_at
  ))
  into result
  from public.organization_members m
  join public.profiles u on u.id = m.user_id
  left join public.profiles inviter on inviter.id = m.invited_by
  where m.organization_id = _organization_id;

  return coalesce(result, '[]'::jsonb);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_available_payment_frequencies(p_course_id uuid)
 RETURNS public.payment_frequency[]
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  all_frequencies public.payment_frequency[];
  used_frequencies public.payment_frequency[];
  v_org_id uuid;
begin
  select organization_id into v_org_id
  from public.courses
  where id = p_course_id;

  select enum_range(null::public.payment_frequency)
  into all_frequencies;

  select array_agg(payment_frequency)
  into used_frequencies
  from public.course_pricing_tiers
  where course_id = p_course_id and organization_id = v_org_id;

  return (
    select array_agg(freq)
    from unnest(all_frequencies) as freq
    where used_frequencies is null or freq != all(used_frequencies)
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_completion_navigation_state(p_user_id uuid, p_published_course_id uuid, course_structure jsonb, current_context record)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  completion_stats record;
begin
  with
  -- extract all block ids from course structure
  all_blocks as (
    select (block_obj ->> 'id')::uuid as block_id
    from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
          jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj,
          jsonb_array_elements(lesson_obj -> 'blocks') as block_obj
  ),

  -- extract all lesson ids
  all_lessons as (
    select (lesson_obj ->> 'id')::uuid as lesson_id
    from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
          jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj
  ),

  -- extract all chapter ids
  all_chapters as (
    select (chapter_obj ->> 'id')::uuid as chapter_id
    from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj
  ),

  -- count of completed blocks for the user (CHANGED TO LEFT JOIN)
  completed_blocks as (
    select count(*) as count
    from all_blocks ab
    left join public.block_progress bp on bp.block_id = ab.block_id
    where (bp.user_id = p_user_id or bp.user_id is null)
      and (bp.published_course_id = p_published_course_id or bp.published_course_id is null)
      and coalesce(bp.is_completed, false) = true
  ),

  -- count of completed lessons for the user (CHANGED TO LEFT JOIN)
  completed_lessons as (
    select count(*) as count
    from all_lessons al
    left join public.lesson_progress lp on lp.lesson_id = al.lesson_id
    where (lp.user_id = p_user_id or lp.user_id is null)
      and (lp.published_course_id = p_published_course_id or lp.published_course_id is null)
      and lp.completed_at is not null
  ),

  -- count of completed chapters for the user (CHANGED TO LEFT JOIN)
  completed_chapters as (
    select count(*) as count
    from all_chapters ac
    left join public.chapter_progress cp on cp.chapter_id = ac.chapter_id
    where (cp.user_id = p_user_id or cp.user_id is null)
      and (cp.published_course_id = p_published_course_id or cp.published_course_id is null)
      and cp.completed_at is not null
  )

  -- fetch total and completed counts into a single row
  select
    (select count(*) from all_blocks) as total_blocks,
    (select count from completed_blocks) as completed_blocks,
    (select count(*) from all_lessons) as total_lessons,
    (select count from completed_lessons) as completed_lessons,
    (select count(*) from all_chapters) as total_chapters,
    (select count from completed_chapters) as completed_chapters
  into completion_stats;

  -- Build and return detailed jsonb completion object
  return jsonb_build_object(
    'blocks', jsonb_build_object(
      'total', completion_stats.total_blocks,
      'completed', completion_stats.completed_blocks,
      'percentage', case
        when completion_stats.total_blocks > 0 then
          round((completion_stats.completed_blocks::numeric / completion_stats.total_blocks) * 100, 2)
        else 0
      end,
      'is_complete', (
        completion_stats.completed_blocks = completion_stats.total_blocks
        and completion_stats.total_blocks > 0
      )
    ),
    'lessons', jsonb_build_object(
      'total', completion_stats.total_lessons,
      'completed', completion_stats.completed_lessons,
      'percentage', case
        when completion_stats.total_lessons > 0 then
          round((completion_stats.completed_lessons::numeric / completion_stats.total_lessons) * 100, 2)
        else 0
      end,
      'is_complete', (
        completion_stats.completed_lessons = completion_stats.total_lessons
        and completion_stats.total_lessons > 0
      )
    ),
    'chapters', jsonb_build_object(
      'total', completion_stats.total_chapters,
      'completed', completion_stats.completed_chapters,
      'percentage', case
        when completion_stats.total_chapters > 0 then
          round((completion_stats.completed_chapters::numeric / completion_stats.total_chapters) * 100, 2)
        else 0
      end,
      'is_complete', (
        completion_stats.completed_chapters = completion_stats.total_chapters
        and completion_stats.total_chapters > 0
      )
    ),
    'course', jsonb_build_object(
      'is_complete', (
        completion_stats.completed_blocks = completion_stats.total_blocks
        and completion_stats.total_blocks > 0
      )
    )
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_continue_navigation_state(p_user_id uuid, p_published_course_id uuid, course_structure jsonb, current_context record)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  continue_block record;
  continue_lesson record;
  continue_chapter record;
begin
  -- Context: BLOCK LEVEL
  if current_context.block_id is not null then
    -- Next incomplete block (check ALL blocks, not just those after current)
    select
      bs.chapter_id, bs.lesson_id, bs.block_id
    into continue_block
    from (
      select
        (chapter_obj ->> 'id')::uuid as chapter_id,
        (lesson_obj ->> 'id')::uuid as lesson_id,
        (block_obj ->> 'id')::uuid as block_id,
        row_number() over (
          order by
            (chapter_obj ->> 'order_index')::int,
            (lesson_obj ->> 'order_index')::int,
            (block_obj ->> 'order_index')::int
        ) as global_order
      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
           jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj,
           jsonb_array_elements(lesson_obj -> 'blocks') as block_obj
    ) bs
    left join public.block_progress bp on (
      bp.user_id = p_user_id
      and bp.published_course_id = p_published_course_id
      and bp.block_id = bs.block_id
      and bp.is_completed = true
    )
    where bp.id is null -- Find incomplete blocks
    order by bs.global_order
    limit 1;

    -- Next incomplete lesson (check ALL lessons, not just those after current)
    select
      ls.chapter_id, ls.lesson_id
    into continue_lesson
    from (
      select
        (chapter_obj ->> 'id')::uuid as chapter_id,
        (lesson_obj ->> 'id')::uuid as lesson_id,
        row_number() over (
          order by
            (chapter_obj ->> 'order_index')::int,
            (lesson_obj ->> 'order_index')::int
        ) as global_order
      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
           jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj
    ) ls
    left join public.lesson_progress lp on (
      lp.user_id = p_user_id
      and lp.published_course_id = p_published_course_id
      and lp.lesson_id = ls.lesson_id
      and lp.completed_at is not null
    )
    where lp.id is null -- Find incomplete lessons
    order by ls.global_order
    limit 1;

    -- Next incomplete chapter (check ALL chapters, not just those after current)
    select
      cs.chapter_id
    into continue_chapter
    from (
      select
        (chapter_obj ->> 'id')::uuid as chapter_id,
        row_number() over (
          order by (chapter_obj ->> 'order_index')::int
        ) as global_order
      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj
    ) cs
    left join public.chapter_progress cp on (
      cp.user_id = p_user_id
      and cp.published_course_id = p_published_course_id
      and cp.chapter_id = cs.chapter_id
      and cp.completed_at is not null
    )
    where cp.id is null -- Find incomplete chapters
    order by cs.global_order
    limit 1;

    return jsonb_build_object(
      'block', case when continue_block.block_id is not null then
        jsonb_build_object(
          'id', continue_block.block_id,
          'lesson_id', continue_block.lesson_id,
          'chapter_id', continue_block.chapter_id,
          'course_id', p_published_course_id
        ) else null end,
      'lesson', case when continue_lesson.lesson_id is not null then
        jsonb_build_object(
          'id', continue_lesson.lesson_id,
          'chapter_id', continue_lesson.chapter_id,
          'course_id', p_published_course_id
        ) else null end,
      'chapter', case when continue_chapter.chapter_id is not null then
        jsonb_build_object(
          'id', continue_chapter.chapter_id,
          'course_id', p_published_course_id
        ) else null end
    );

  -- Context: LESSON LEVEL
  elsif current_context.lesson_id is not null then
    -- Next incomplete lesson (check ALL lessons, not just those after current)
    select
      ls.chapter_id, ls.lesson_id
    into continue_lesson
    from (
      select
        (chapter_obj ->> 'id')::uuid as chapter_id,
        (lesson_obj ->> 'id')::uuid as lesson_id,
        row_number() over (
          order by
            (chapter_obj ->> 'order_index')::int,
            (lesson_obj ->> 'order_index')::int
        ) as global_order
      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
           jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj
    ) ls
    left join public.lesson_progress lp on (
      lp.user_id = p_user_id
      and lp.published_course_id = p_published_course_id
      and lp.lesson_id = ls.lesson_id
      and lp.completed_at is not null
    )
    where lp.id is null -- Find incomplete lessons
    order by ls.global_order
    limit 1;

    -- Next incomplete chapter (check ALL chapters, not just those after current)
    select
      cs.chapter_id
    into continue_chapter
    from (
      select
        (chapter_obj ->> 'id')::uuid as chapter_id,
        row_number() over (
          order by (chapter_obj ->> 'order_index')::int
        ) as global_order
      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj
    ) cs
    left join public.chapter_progress cp on (
      cp.user_id = p_user_id
      and cp.published_course_id = p_published_course_id
      and cp.chapter_id = cs.chapter_id
      and cp.completed_at is not null
    )
    where cp.id is null -- Find incomplete chapters
    order by cs.global_order
    limit 1;

    return jsonb_build_object(
      'block', null,
      'lesson', case when continue_lesson.lesson_id is not null then
        jsonb_build_object(
          'id', continue_lesson.lesson_id,
          'chapter_id', continue_lesson.chapter_id,
          'course_id', p_published_course_id
        ) else null end,
      'chapter', case when continue_chapter.chapter_id is not null then
        jsonb_build_object(
          'id', continue_chapter.chapter_id,
          'course_id', p_published_course_id
        ) else null end
    );

  -- Context: CHAPTER LEVEL
  elsif current_context.chapter_id is not null then
    -- Next incomplete chapter (check ALL chapters, not just those after current)
    select
      cs.chapter_id
    into continue_chapter
    from (
      select
        (chapter_obj ->> 'id')::uuid as chapter_id,
        row_number() over (
          order by (chapter_obj ->> 'order_index')::int
        ) as global_order
      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj
    ) cs
    left join public.chapter_progress cp on (
      cp.user_id = p_user_id
      and cp.published_course_id = p_published_course_id
      and cp.chapter_id = cs.chapter_id
      and cp.completed_at is not null
    )
    where cp.id is null -- Find incomplete chapters
    order by cs.global_order
    limit 1;

    return jsonb_build_object(
      'block', null,
      'lesson', null,
      'chapter', case when continue_chapter.chapter_id is not null then
        jsonb_build_object(
          'id', continue_chapter.chapter_id,
          'course_id', p_published_course_id
        ) else null end
    );
  end if;

  -- Fallback (should not reach here)
  return jsonb_build_object('block', null, 'lesson', null, 'chapter', null);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_course_navigation_info(p_user_id uuid, p_published_course_id uuid, course_structure jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  course_info record;
begin
  -- fetch basic metadata about the course
  select 
    pc.id,
    pc.name,
    pc.description,
    pc.organization_id
  into course_info
  from public.published_courses pc
  where pc.id = p_published_course_id;

  -- return the course metadata as a jsonb object
  return jsonb_build_object(
    'id', course_info.id,
    'name', course_info.name,
    'description', course_info.description,
    'organization_id', course_info.organization_id
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_course_progress_overview(p_published_course_id uuid, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_result json;
  v_course_exists boolean;
  v_user_id uuid := coalesce(p_user_id, (select auth.uid()));
  v_user_enrolled boolean;
  v_active_chapter_id uuid;
  v_active_lesson_id uuid;
begin
  if p_published_course_id is null then
    raise exception 'Published course ID cannot be null';
  end if;

  select exists (
    select 1 from public.published_courses
    where id = p_published_course_id and is_active = true
  ) into v_course_exists;

  if not v_course_exists then
    raise exception 'Course not found or not active';
  end if;

  select exists (
    select 1
    from public.course_enrollments ce
    where ce.published_course_id = p_published_course_id
      and ce.user_id = v_user_id
      and ce.is_active = true
      and (ce.expires_at is null or ce.expires_at > now())
  ) into v_user_enrolled;

  if v_user_enrolled then
    select 
      (lesson->>'id')::uuid,
      (chapter->>'id')::uuid
    into v_active_lesson_id, v_active_chapter_id
    from public.published_courses pc_inner
    cross join jsonb_array_elements((pc_inner.course_structure_overview->'chapters')::jsonb) as chapter
    cross join jsonb_array_elements((chapter->'lessons')::jsonb) as lesson
    left join public.lesson_progress lp 
      on lp.user_id = v_user_id
      and lp.published_course_id = p_published_course_id
      and lp.lesson_id = (lesson->>'id')::uuid
    where pc_inner.id = p_published_course_id
      and (lp.completed_at is null)
    order by 
      (chapter->>'position')::integer,
      (lesson->>'position')::integer
    limit 1;
  end if;

  select json_build_object(
    'course', json_build_object(
      'id', pc.id,
      'name', pc.name,
      'description', pc.description,
      'image_url', pc.image_url,
      'blur_hash', pc.blur_hash,
      'total_chapters', pc.total_chapters,
      'total_lessons', pc.total_lessons,
      'total_blocks', pc.total_blocks,
      'pricing_tiers', pc.pricing_tiers,
      'average_rating', pc.average_rating,
      'total_reviews', pc.total_reviews,
      'total_enrollments', pc.total_enrollments,
      'published_at', date_trunc('milliseconds', pc.published_at at time zone 'UTC')::timestamptz,
      'category_id', pc.category_id,
      'category_name', cat.name,
      'subcategory_id', pc.subcategory_id,
      'subcategory_name', subcat.name
    ),

    'organization', json_build_object(
      'id', org.id,
      'name', org.name,
      'handle', org.handle,
      'avatar_url', org.avatar_url,
      'blur_hash', org.blur_hash,
      'is_verified', org.is_verified
    ),

    'overall_progress', case
      when v_user_enrolled then
        case
          when cp.id is not null then
            json_build_object(
              'total_blocks', cp.total_blocks,
              'completed_blocks', cp.completed_blocks,
              'total_lessons', cp.total_lessons,
              'completed_lessons', cp.completed_lessons,
              'total_chapters', cp.total_chapters,
              'completed_chapters', cp.completed_chapters,
              'total_weight', cp.total_weight,
              'completed_weight', cp.completed_weight,
              'progress_percentage', cp.progress_percentage,
              'total_lesson_weight', cp.total_lesson_weight,
              'completed_lesson_weight', cp.completed_lesson_weight,
              'lesson_progress_percentage', cp.lesson_progress_percentage,
              'completed_at', date_trunc('milliseconds', cp.completed_at at time zone 'UTC')::timestamptz,
              'updated_at', date_trunc('milliseconds', cp.updated_at at time zone 'UTC')::timestamptz,
              'active_chapter_id', v_active_chapter_id,
              'active_lesson_id', v_active_lesson_id,
              'is_completed', cp.is_completed
            )
          else
            json_build_object(
              'total_blocks', pc.total_blocks,
              'completed_blocks', 0,
              'total_lessons', pc.total_lessons,
              'completed_lessons', 0,
              'total_chapters', pc.total_chapters,
              'completed_chapters', 0,
              'total_weight', 0,
              'completed_weight', 0,
              'progress_percentage', 0,
              'total_lesson_weight', 0,
              'completed_lesson_weight', 0,
              'lesson_progress_percentage', 0,
              'completed_at', null,
              'updated_at', null,
              'active_chapter_id', v_active_chapter_id,
              'active_lesson_id', v_active_lesson_id,
              'is_completed', false
            )
        end
      else null
    end,

    'chapters', (
      select json_agg(
        json_build_object(
          'id', chapter_data.id,
          'name', chapter_data.name,
          'description', chapter_data.description,
          'position', chapter_data.position,
          'total_lessons', chapter_data.total_lessons,
          'total_blocks', chapter_data.total_blocks,
          'completed_lessons', case when v_user_enrolled then coalesce(chapter_progress.completed_lessons, 0) else null end,
          'completed_blocks', case when v_user_enrolled then coalesce(chapter_progress.completed_blocks, 0) else null end,
          'progress_percentage', case
            when v_user_enrolled then
              coalesce(
                case
                  when chapter_data.total_blocks > 0 then
                    round((coalesce(chapter_progress.completed_blocks, 0)::numeric / chapter_data.total_blocks * 100), 2)
                  else 0
                end, 0
              )
            else null
          end,
          'is_active', case when v_user_enrolled then (chapter_data.id = v_active_chapter_id) else false end,
          'is_completed', case
            when v_user_enrolled and chapter_data.total_lessons > 0 then
              coalesce(chapter_progress.completed_lessons, 0) = chapter_data.total_lessons
            else false
          end,
          'lessons', chapter_data.lessons
        )
        order by chapter_data.position
      )
      from (
        select
          (chapter->>'id')::uuid as id,
          chapter->>'name' as name,
          chapter->>'description' as description,
          (chapter->>'position')::integer as position,
          (chapter->>'total_lessons')::integer as total_lessons,
          (chapter->>'total_blocks')::integer as total_blocks,
          json_agg(
            json_build_object(
              'id', (lesson->>'id')::uuid,
              'name', lesson->>'name',
              'position', (lesson->>'position')::integer,
              'total_blocks', (lesson->>'total_blocks')::integer,
              'lesson_type', lesson->'lesson_types',
              'is_active', case when v_user_enrolled then ((lesson->>'id')::uuid = v_active_lesson_id) else false end,
              'progress', case
                when v_user_enrolled then
                  coalesce(lp_data.progress_data, json_build_object(
                    'total_blocks', (lesson->>'total_blocks')::integer,
                    'completed_blocks', 0,
                    'total_weight', 0,
                    'completed_weight', 0,
                    'progress_percentage', 0,
                    'completed_at', null,
                    'updated_at', null,
                    'is_completed', false
                  ))
                else null
              end
            )
            order by (lesson->>'position')::integer
          ) as lessons
        from public.published_courses pc_inner
        cross join jsonb_array_elements((pc_inner.course_structure_overview->'chapters')::jsonb) as chapter
        cross join jsonb_array_elements((chapter->'lessons')::jsonb) as lesson
        left join lateral (
          select json_build_object(
            'total_blocks', lp.total_blocks,
            'completed_blocks', lp.completed_blocks,
            'total_weight', lp.total_weight,
            'completed_weight', lp.completed_weight,
            'progress_percentage', lp.progress_percentage,
            'completed_at', date_trunc('milliseconds', lp.completed_at at time zone 'UTC')::timestamptz,
            'updated_at', date_trunc('milliseconds', lp.updated_at at time zone 'UTC')::timestamptz,
            'is_completed', lp.is_completed
          ) as progress_data
          from public.lesson_progress lp
          where v_user_enrolled
            and lp.user_id = v_user_id
            and lp.published_course_id = p_published_course_id
            and lp.lesson_id = (lesson->>'id')::uuid
        ) lp_data on true
        where pc_inner.id = p_published_course_id
        group by 
          (chapter->>'id')::uuid,
          chapter->>'name',
          chapter->>'description',
          (chapter->>'position')::integer,
          (chapter->>'total_lessons')::integer,
          (chapter->>'total_blocks')::integer
      ) chapter_data
      left join lateral (
        select 
          count(*) filter (where lp.completed_at is not null) as completed_lessons,
          sum(lp.completed_blocks) as completed_blocks
        from jsonb_array_elements(chapter_data.lessons::jsonb) as lesson_item
        left join public.lesson_progress lp 
          on v_user_enrolled
          and lp.lesson_id = ((lesson_item->>'id')::uuid)
          and lp.user_id = v_user_id
          and lp.published_course_id = p_published_course_id
      ) chapter_progress on true
    ),

    'recent_activity', case
      when v_user_enrolled then (
        select json_agg(
          json_build_object(
            'block_id', sub.block_id,
            'lesson_id', sub.lesson_id,
            'chapter_id', sub.chapter_id,
            'completed_at', date_trunc('milliseconds', sub.completed_at at time zone 'UTC')::timestamptz,
            'time_spent_seconds', sub.time_spent_seconds,
            'earned_score', sub.earned_score,
            'is_completed', true
          )
        )
        from (
          select bp.block_id, bp.lesson_id, bp.chapter_id, bp.completed_at,
                bp.time_spent_seconds, bp.earned_score
          from public.block_progress bp
          where bp.user_id = v_user_id
            and bp.published_course_id = p_published_course_id
            and bp.is_completed = true
          order by bp.completed_at desc
          limit 10
        ) sub
      )
      else null
    end,

    'statistics', case
      when v_user_enrolled then
        json_build_object(
          'total_time_spent', coalesce((
            select sum(bp.time_spent_seconds)
            from public.block_progress bp
            where bp.user_id = v_user_id
              and bp.published_course_id = p_published_course_id
          ), 0),
          'average_score', coalesce((
            select round(avg(bp.earned_score), 2)
            from public.block_progress bp
            where bp.user_id = v_user_id
              and bp.published_course_id = p_published_course_id
              and bp.earned_score is not null
          ), null),
          'completion_streak', 0,
          'started_at', (
            select date_trunc('milliseconds', min(bp.started_at) at time zone 'UTC')::timestamptz
            from public.block_progress bp
            where bp.user_id = v_user_id
              and bp.published_course_id = p_published_course_id
          )
        )
      else null
    end
  ) into v_result
  from public.published_courses pc
  inner join public.organizations org on pc.organization_id = org.id
  left join public.course_categories cat on pc.category_id = cat.id
  left join public.course_sub_categories subcat on pc.subcategory_id = subcat.id
  left join public.course_progress cp 
    on v_user_enrolled 
    and cp.published_course_id = pc.id 
    and cp.user_id = v_user_id
  where pc.id = p_published_course_id
    and pc.is_active = true;

  return v_result;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_current_navigation_state(p_user_id uuid, p_published_course_id uuid, course_structure jsonb, current_context record)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  block_progress record;
  lesson_progress record;
  chapter_progress record;
begin

  -- Always fetch block progress (with defaults when no block in context)
  select
    coalesce(bp.is_completed, false) as is_completed,
    bp.completed_at,
    coalesce(bp.progress_percentage, 0) as progress_percentage
  into block_progress
  from (
    select 
      false as is_completed, 
      null::timestamp as completed_at, 
      0 as progress_percentage
  ) as defaults
  left join public.block_progress bp on (
    current_context.block_id is not null
    and bp.user_id = p_user_id
    and bp.published_course_id = p_published_course_id
    and bp.block_id = current_context.block_id
  );

  -- Always fetch lesson progress (with defaults when no lesson in context)
  select
    coalesce(lp.is_completed, false) as is_completed,
    lp.completed_at,
    coalesce(lp.progress_percentage, 0) as progress_percentage
  into lesson_progress
  from (
    select 
      false as is_completed, 
      null::timestamp as completed_at, 
      0 as progress_percentage
  ) as defaults
  left join public.lesson_progress lp on (
    current_context.lesson_id is not null
    and lp.user_id = p_user_id
    and lp.published_course_id = p_published_course_id
    and lp.lesson_id = current_context.lesson_id
  );

  -- Fetch chapter progress if a chapter is in context
  if current_context.chapter_id is not null then
    select
      coalesce(cp.is_completed, false) as is_completed,
      cp.completed_at,
      coalesce(cp.progress_percentage, 0) as progress_percentage
    into chapter_progress
    from (select 1) as dummy
    left join public.chapter_progress cp on (
      cp.user_id = p_user_id
      and cp.published_course_id = p_published_course_id
      and cp.chapter_id = current_context.chapter_id
    );
  end if;

  -- Return unified JSONB structure
  return jsonb_build_object(
    'block', case when current_context.block_id is not null then
      jsonb_build_object(
        'id', current_context.block_id,
        'is_completed', block_progress.is_completed,
        'completed_at', block_progress.completed_at,
        'progress_percentage', block_progress.progress_percentage
      )
      else null end,

    'lesson', case when current_context.lesson_id is not null then
      jsonb_build_object(
        'id', current_context.lesson_id,
        'is_completed', lesson_progress.is_completed,
        'completed_at', lesson_progress.completed_at,
        'progress_percentage', lesson_progress.progress_percentage
      )
      else null end,

    'chapter', case when current_context.chapter_id is not null then
      jsonb_build_object(
        'id', current_context.chapter_id,
        'is_completed', chapter_progress.is_completed,
        'completed_at', chapter_progress.completed_at,
        'progress_percentage', chapter_progress.progress_percentage
      )
      else null end,

    'course', jsonb_build_object(
      'id', p_published_course_id
    )
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_effective_pricing_for_published_tier(p_published_course_id uuid, p_tier_id uuid)
 RETURNS TABLE(effective_price numeric, is_promotional boolean, promotional_price numeric)
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  tier_record record;
  now_utc timestamptz := timezone('utc', now());  -- Use UTC for reliable comparisons
begin
  -- Retrieve the tier's pricing and promotional details
  select * into tier_record
  from public.get_published_course_pricing_tier(p_published_course_id, p_tier_id);

  -- Determine if a promotion is currently active
  if tier_record.promotional_price is not null
    and tier_record.promotion_start_date is not null
    and tier_record.promotion_end_date is not null
    and tier_record.promotion_start_date <= now_utc
    and tier_record.promotion_end_date >= now_utc then

    -- Use promotional price if promotion is active
    return query select 
      tier_record.promotional_price,
      true,
      tier_record.promotional_price;
  else
    -- Use regular price if no active promotion
    return query select 
      tier_record.price,
      false,
      tier_record.promotional_price;
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_enrollment_status(p_user_id uuid, p_published_course_id uuid)
 RETURNS TABLE(enrollment_id uuid, is_enrolled boolean, is_active boolean, expires_at timestamp with time zone, days_remaining integer, latest_activity_id uuid)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
declare
  -- Declare temporary variables to hold queried values
  enrollment_id_val uuid;
  enrollment_expires_at timestamptz;
  latest_activity_id_val uuid;
  now_utc timestamptz := timezone('utc', now());  -- Always compare times in UTC
begin
  -- STEP 1: Attempt to find an active enrollment for this user and course
  select ce.id, ce.expires_at
    into enrollment_id_val, enrollment_expires_at
  from public.course_enrollments ce
  where ce.user_id = p_user_id
    and ce.published_course_id = p_published_course_id
    and ce.is_active = true
  limit 1;

  -- STEP 2: If no enrollment was found, return a default "not enrolled" row
  if not found then
    return query select
      null::uuid as enrollment_id,
      false as is_enrolled,
      false as is_active,
      null::timestamptz as expires_at,
      null::integer as days_remaining,
      null::uuid as latest_activity_id;
  end if;

  -- STEP 3: If enrolled, find the most recent activity
  select cea.id
    into latest_activity_id_val
  from public.course_enrollment_activities cea
  where cea.enrollment_id = enrollment_id_val
  order by cea.created_at desc
  limit 1;

  -- STEP 4: Return detailed enrollment status
  return query select
    enrollment_id_val as enrollment_id,
    true as is_enrolled,
    enrollment_expires_at is null or enrollment_expires_at > now_utc as is_active,
    enrollment_expires_at as expires_at,
    case
      when enrollment_expires_at is null then null
      else extract(day from enrollment_expires_at - now_utc)::int
    end as days_remaining,
    latest_activity_id_val as latest_activity_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_next_navigation_state(p_user_id uuid, p_published_course_id uuid, course_structure jsonb, current_context record)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  next_block record;
  next_lesson record;
  next_chapter record;
  current_chapter_order integer;
begin
  -- Robustly get the current chapter's global order for reference
  with chapter_orders as (
    select
      (chapter_obj ->> 'id')::uuid as chapter_id,
      row_number() over (order by (chapter_obj ->> 'order_index')::int) as chapter_order
    from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj
  )
  select chapter_order
  into current_chapter_order
  from chapter_orders
  where chapter_id = current_context.chapter_id;

  -- Context: BLOCK LEVEL
  if current_context.block_id is not null then
    -- Next block
    select
      bs.chapter_id, bs.lesson_id, bs.block_id
    into next_block
    from (
      select
        (chapter_obj ->> 'id')::uuid as chapter_id,
        (lesson_obj ->> 'id')::uuid as lesson_id,
        (block_obj ->> 'id')::uuid as block_id,
        row_number() over (
          order by 
            (chapter_obj ->> 'order_index')::int,
            (lesson_obj ->> 'order_index')::int,
            (block_obj ->> 'order_index')::int
        ) as global_order
      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
           jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj,
           jsonb_array_elements(lesson_obj -> 'blocks') as block_obj
    ) bs
    where bs.global_order = current_context.block_global_order + 1;

    -- Next lesson
    select
      ls.chapter_id, ls.lesson_id
    into next_lesson
    from (
      select
        (chapter_obj ->> 'id')::uuid as chapter_id,
        (lesson_obj ->> 'id')::uuid as lesson_id,
        row_number() over (
          order by 
            (chapter_obj ->> 'order_index')::int,
            (lesson_obj ->> 'order_index')::int
        ) as global_order
      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
           jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj
    ) ls
    where ls.global_order = current_context.lesson_global_order + 1;

    -- Next chapter
    select
      cs.chapter_id
    into next_chapter
    from (
      select
        (chapter_obj ->> 'id')::uuid as chapter_id,
        row_number() over (
          order by (chapter_obj ->> 'order_index')::int
        ) as global_order
      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj
    ) cs
    where cs.global_order = current_chapter_order + 1;

    return jsonb_build_object(
      'block', case when next_block.block_id is not null then
        jsonb_build_object(
          'id', next_block.block_id,
          'lesson_id', next_block.lesson_id,
          'chapter_id', next_block.chapter_id,
          'course_id', p_published_course_id
        ) else null end,
      'lesson', case when next_lesson.lesson_id is not null then
        jsonb_build_object(
          'id', next_lesson.lesson_id,
          'chapter_id', next_lesson.chapter_id,
          'course_id', p_published_course_id
        ) else null end,
      'chapter', case when next_chapter.chapter_id is not null then
        jsonb_build_object(
          'id', next_chapter.chapter_id,
          'course_id', p_published_course_id
        ) else null end
    );

  -- Context: LESSON LEVEL
  elsif current_context.lesson_id is not null then
    -- Next lesson
    select
      ls.chapter_id, ls.lesson_id
    into next_lesson
    from (
      select
        (chapter_obj ->> 'id')::uuid as chapter_id,
        (lesson_obj ->> 'id')::uuid as lesson_id,
        row_number() over (
          order by 
            (chapter_obj ->> 'order_index')::int,
            (lesson_obj ->> 'order_index')::int
        ) as global_order
      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
           jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj
    ) ls
    where ls.global_order = current_context.lesson_global_order + 1;

    -- Next chapter
    select
      cs.chapter_id
    into next_chapter
    from (
      select
        (chapter_obj ->> 'id')::uuid as chapter_id,
        row_number() over (
          order by (chapter_obj ->> 'order_index')::int
        ) as global_order
      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj
    ) cs
    where cs.global_order = current_chapter_order + 1;

    return jsonb_build_object(
      'block', null,
      'lesson', case when next_lesson.lesson_id is not null then
        jsonb_build_object(
          'id', next_lesson.lesson_id,
          'chapter_id', next_lesson.chapter_id,
          'course_id', p_published_course_id
        ) else null end,
      'chapter', case when next_chapter.chapter_id is not null then
        jsonb_build_object(
          'id', next_chapter.chapter_id,
          'course_id', p_published_course_id
        ) else null end
    );

  -- Context: CHAPTER LEVEL
  elsif current_context.chapter_id is not null then
    -- Next chapter
    select
      cs.chapter_id
    into next_chapter
    from (
      select
        (chapter_obj ->> 'id')::uuid as chapter_id,
        row_number() over (
          order by (chapter_obj ->> 'order_index')::int
        ) as global_order
      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj
    ) cs
    where cs.global_order = current_chapter_order + 1;

    return jsonb_build_object(
      'block', null,
      'lesson', null,
      'chapter', case when next_chapter.chapter_id is not null then
        jsonb_build_object(
          'id', next_chapter.chapter_id,
          'course_id', p_published_course_id
        ) else null end
    );
  end if;

  -- Fallback (should not reach here)
  return jsonb_build_object('block', null, 'lesson', null, 'chapter', null);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_organization_earnings_summary(p_org_id uuid)
 RETURNS TABLE(organization_id uuid, wallet_id uuid, currency_code public.currency_code, balance_total numeric, balance_reserved numeric, balance_available numeric, gross_earnings numeric, total_fees numeric, net_earnings numeric, current_month_earnings numeric, previous_month_earnings numeric, month_over_month_change numeric, month_over_month_percentage_change numeric, trend text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  -- ============================================================
  -- ✅ Permission check: allow only admin or owner
  -- ============================================================
  if not public.has_org_role(p_org_id, 'admin', auth.uid()) then
    raise exception 'You do not have permission to view organization earnings.';
  end if;

  return query
  with wallets as (
    select 
      ow.id as w_id, 
      ow.currency_code as w_currency,
      ow.balance_total as w_balance_total,
      ow.balance_reserved as w_balance_reserved
    from public.organization_wallets ow
    where ow.organization_id = p_org_id
  ),

  inflows as (
    select
      e.destination_wallet_id as w_id,
      date_trunc('month', e.created_at) as month,
      sum(e.amount) as amount
    from public.wallet_ledger_entries e
    where e.status = 'completed'
      and e.direction = 'credit'
      and e.type in (
        'course_purchase',
        'payment_inflow',
        'funds_release',
        'reward_payout',
        'org_payout',
        'sponsorship_payment'
      )
    group by e.destination_wallet_id, date_trunc('month', e.created_at)
  ),

  deductions as (
    select
      e.source_wallet_id as w_id,
      date_trunc('month', e.created_at) as month,
      sum(e.amount) as amount
    from public.wallet_ledger_entries e
    where e.status = 'completed'
      and e.direction = 'debit'
      and e.type in (
        'platform_revenue',
        'payment_gateway_fee',
        'refund',
        'chargeback',
        'tax_withholding',
        'tax_remittance'
      )
    group by e.source_wallet_id, date_trunc('month', e.created_at)
  ),

  monthly as (
    select
      w.w_id,
      w.w_currency,
      coalesce(i.month, d.month) as month,
      coalesce(i.amount, 0) as gross,
      coalesce(d.amount, 0) as fees,
      coalesce(i.amount, 0) - coalesce(d.amount, 0) as net
    from wallets w
    left join inflows i on i.w_id = w.w_id
    full join deductions d on d.w_id = w.w_id and d.month = i.month
  ),

  this_month as (
    select w_id, sum(net) as total
    from monthly
    where month = date_trunc('month', now())
    group by w_id
  ),

  last_month as (
    select w_id, sum(net) as total
    from monthly
    where month = date_trunc('month', now() - interval '1 month')
    group by w_id
  ),

  lifetime as (
    select w_id, sum(gross) as gross, sum(fees) as fees, sum(net) as net
    from monthly
    group by w_id
  )

  select
    p_org_id as organization_id,
    w.w_id as wallet_id,
    w.w_currency as currency_code,
    w.w_balance_total as balance_total,
    w.w_balance_reserved as balance_reserved,
    (w.w_balance_total - w.w_balance_reserved) as balance_available,
    coalesce(l.gross, 0) as gross_earnings,
    coalesce(l.fees, 0) as total_fees,
    coalesce(l.net, 0) as net_earnings,
    coalesce(tm.total, 0) as current_month_earnings,
    coalesce(lm.total, 0) as previous_month_earnings,
    coalesce(tm.total, 0) - coalesce(lm.total, 0) as month_over_month_change,
    case
      when coalesce(lm.total, 0) = 0 then
        case when coalesce(tm.total, 0) > 0 then 100.0 else 0.0 end
      else round(((coalesce(tm.total, 0) - coalesce(lm.total, 0)) / lm.total) * 100.0, 2)
    end as month_over_month_percentage_change,
    case
      when coalesce(tm.total, 0) > coalesce(lm.total, 0) then 'increased'
      when coalesce(tm.total, 0) < coalesce(lm.total, 0) then 'decreased'
      else 'no_change'
    end as trend
  from wallets w
  left join lifetime l on l.w_id = w.w_id
  left join this_month tm on tm.w_id = w.w_id
  left join last_month lm on lm.w_id = w.w_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_previous_navigation_state(p_user_id uuid, p_published_course_id uuid, course_structure jsonb, current_context record)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare 
  prev_block record;
  prev_lesson record;
  prev_chapter record;
  current_chapter_order integer;
begin
  -- Robustly get the current chapter's global order for reference
  with chapter_orders as (
    select
      (chapter_obj ->> 'id')::uuid as chapter_id,
      row_number() over (order by (chapter_obj ->> 'order_index')::int) as chapter_order
    from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj
  )
  select chapter_order
  into current_chapter_order
  from chapter_orders
  where chapter_id = current_context.chapter_id;

  -- Context: BLOCK LEVEL
  if current_context.block_id is not null then
    -- Previous block
    select
      bs.chapter_id, bs.lesson_id, bs.block_id
    into prev_block
    from (
      select
        (chapter_obj ->> 'id')::uuid as chapter_id,
        (lesson_obj ->> 'id')::uuid as lesson_id,
        (block_obj ->> 'id')::uuid as block_id,
        row_number() over (
          order by 
            (chapter_obj ->> 'order_index')::int,
            (lesson_obj ->> 'order_index')::int,
            (block_obj ->> 'order_index')::int
        ) as global_order
      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
           jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj,
           jsonb_array_elements(lesson_obj -> 'blocks') as block_obj
    ) bs
    where bs.global_order = current_context.block_global_order - 1;

    -- Previous lesson
    select
      ls.chapter_id, ls.lesson_id
    into prev_lesson
    from (
      select
        (chapter_obj ->> 'id')::uuid as chapter_id,
        (lesson_obj ->> 'id')::uuid as lesson_id,
        row_number() over (
          order by 
            (chapter_obj ->> 'order_index')::int,
            (lesson_obj ->> 'order_index')::int
        ) as global_order
      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
           jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj
    ) ls
    where ls.global_order = current_context.lesson_global_order - 1;

    -- Previous chapter
    select
      cs.chapter_id
    into prev_chapter
    from (
      select
        (chapter_obj ->> 'id')::uuid as chapter_id,
        row_number() over (
          order by (chapter_obj ->> 'order_index')::int
        ) as global_order
      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj
    ) cs
    where cs.global_order = current_chapter_order - 1;

    return jsonb_build_object(
      'block', case when prev_block.block_id is not null then
        jsonb_build_object(
          'id', prev_block.block_id,
          'lesson_id', prev_block.lesson_id,
          'chapter_id', prev_block.chapter_id,
          'course_id', p_published_course_id
        ) else null end,
      'lesson', case when prev_lesson.lesson_id is not null then
        jsonb_build_object(
          'id', prev_lesson.lesson_id,
          'chapter_id', prev_lesson.chapter_id,
          'course_id', p_published_course_id
        ) else null end,
      'chapter', case when prev_chapter.chapter_id is not null then
        jsonb_build_object(
          'id', prev_chapter.chapter_id,
          'course_id', p_published_course_id
        ) else null end
    );

  -- Context: LESSON LEVEL
  elsif current_context.lesson_id is not null then
    -- Previous lesson
    select
      ls.chapter_id, ls.lesson_id
    into prev_lesson
    from (
      select
        (chapter_obj ->> 'id')::uuid as chapter_id,
        (lesson_obj ->> 'id')::uuid as lesson_id,
        row_number() over (
          order by 
            (chapter_obj ->> 'order_index')::int,
            (lesson_obj ->> 'order_index')::int
        ) as global_order
      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
           jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj
    ) ls
    where ls.global_order = current_context.lesson_global_order - 1;

    -- Previous chapter
    select
      cs.chapter_id
    into prev_chapter
    from (
      select
        (chapter_obj ->> 'id')::uuid as chapter_id,
        row_number() over (
          order by (chapter_obj ->> 'order_index')::int
        ) as global_order
      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj
    ) cs
    where cs.global_order = current_chapter_order - 1;

    return jsonb_build_object(
      'block', null,
      'lesson', case when prev_lesson.lesson_id is not null then
        jsonb_build_object(
          'id', prev_lesson.lesson_id,
          'chapter_id', prev_lesson.chapter_id,
          'course_id', p_published_course_id
        ) else null end,
      'chapter', case when prev_chapter.chapter_id is not null then
        jsonb_build_object(
          'id', prev_chapter.chapter_id,
          'course_id', p_published_course_id
        ) else null end
    );

  -- Context: CHAPTER LEVEL
  elsif current_context.chapter_id is not null then
    -- Previous chapter
    select
      cs.chapter_id
    into prev_chapter
    from (
      select
        (chapter_obj ->> 'id')::uuid as chapter_id,
        row_number() over (
          order by (chapter_obj ->> 'order_index')::int
        ) as global_order
      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj
    ) cs
    where cs.global_order = current_chapter_order - 1;

    return jsonb_build_object(
      'block', null,
      'lesson', null,
      'chapter', case when prev_chapter.chapter_id is not null then
        jsonb_build_object(
          'id', prev_chapter.chapter_id,
          'course_id', p_published_course_id
        ) else null end
    );
  end if;

  -- Fallback (should not reach here)
  return jsonb_build_object('block', null, 'lesson', null, 'chapter', null);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_published_course_pricing_tier(p_published_course_id uuid, p_tier_id uuid)
 RETURNS TABLE(tier_id uuid, payment_frequency public.payment_frequency, is_free boolean, price numeric, currency_code text, promotional_price numeric, promotion_start_date timestamp with time zone, promotion_end_date timestamp with time zone, tier_name text, tier_description text, is_active boolean, "position" integer, is_popular boolean, is_recommended boolean)
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  tier_data jsonb;
  course_pricing_tiers jsonb;
begin
  -- First, get the course and validate it exists
  select pc.pricing_tiers into course_pricing_tiers
  from public.published_courses pc
  where pc.id = p_published_course_id
    and pc.is_active = true;

  -- Check if course exists
  if not found then
    raise exception 'Published course not found or inactive: %', p_published_course_id;
  end if;

  -- Check if pricing_tiers is null or not an array
  if course_pricing_tiers is null then
    raise exception 'Course has no pricing tiers configured: %', p_published_course_id;
  end if;

  -- Check if pricing_tiers is actually a JSONB array
  if jsonb_typeof(course_pricing_tiers) != 'array' then
    raise exception 'Course pricing_tiers is not a valid array for course: %', p_published_course_id;
  end if;

  -- Extract the pricing tier JSON object matching the tier ID
  select tier into tier_data
  from jsonb_array_elements(course_pricing_tiers) as tier
  where (tier->>'id')::uuid = p_tier_id                  -- Convert JSON string to UUID for comparison
    and (tier->>'is_active')::boolean = true;             -- Only include active tiers

  -- Raise error if no such tier is found
  if tier_data is null then
    raise exception 'Pricing tier not found or inactive: % for course: %', p_tier_id, p_published_course_id;
  end if;

  -- Return the parsed tier fields, casting from JSONB to proper types
  return query select
    (tier_data->>'id')::uuid,    -- Cast to UUID
    (tier_data->>'payment_frequency')::public.payment_frequency,
    (tier_data->>'is_free')::boolean,
    (tier_data->>'price')::numeric(19,4),
    tier_data->>'currency_code',

    -- Handle nullable promotional price
    case 
      when tier_data->>'promotional_price' = 'null' or tier_data->>'promotional_price' is null then null
      else (tier_data->>'promotional_price')::numeric(19,4)
    end,

    -- Handle nullable promotion start date
    case 
      when tier_data->>'promotion_start_date' = 'null' or tier_data->>'promotion_start_date' is null then null
      else (tier_data->>'promotion_start_date')::timestamptz
    end,

    -- Handle nullable promotion end date
    case 
      when tier_data->>'promotion_end_date' = 'null' or tier_data->>'promotion_end_date' is null then null
      else (tier_data->>'promotion_end_date')::timestamptz
    end,

    tier_data->>'tier_name',
    tier_data->>'tier_description',
    (tier_data->>'is_active')::boolean,
    (tier_data->>'position')::integer,
    (tier_data->>'is_popular')::boolean,
    (tier_data->>'is_recommended')::boolean;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_published_lesson_blocks(p_course_id uuid, p_chapter_id uuid, p_lesson_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  result jsonb;
begin
  -- Deny if caller lacks explicit column-level access
  if not has_column_privilege('public.published_course_structure_content', 'course_structure_content', 'SELECT') then
    raise exception 'Access denied to course content';
  end if;

  -- Fetch and return the lesson + blocks from the correct table
  select jsonb_build_object(
    'id', l->>'id',
    'course_id', l->>'course_id',
    'chapter_id', l->>'chapter_id',
    'lesson_type_id', l->>'lesson_type_id',
    'name', l->>'name',
    'position', (l->>'position')::int,
    'settings', l->'settings',
    'lesson_types', l->'lesson_types',
    'total_blocks', (l->>'total_blocks')::int,
    'blocks', l->'blocks'
  )
  into result
  from public.published_course_structure_content pcs,
  lateral (
    select l
    from
      jsonb_array_elements(pcs.course_structure_content->'chapters') as c
      join lateral jsonb_array_elements(c->'lessons') as l
        on (c->>'id')::uuid = p_chapter_id
    where
      (l->>'id')::uuid = p_lesson_id
  ) as result
  where pcs.id = p_course_id;

  return result;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_tier_limits_for_org(org_id uuid)
 RETURNS json
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  select row_to_json(tl)
  from public.organizations o
  join public.tier_limits tl on tl.tier = o.tier
  where o.id = org_id
$function$
;

CREATE OR REPLACE FUNCTION public.get_unified_navigation(p_user_id uuid, p_published_course_id uuid, p_current_block_id uuid DEFAULT NULL::uuid, p_current_lesson_id uuid DEFAULT NULL::uuid, p_current_chapter_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  course_structure jsonb;
  current_context record;
  navigation_result jsonb;
begin
  -- =========================================================================
  -- STEP 1: Fetch the course structure from the published_course_structure_content table
  -- =========================================================================
  select course_structure_content
  into course_structure
  from public.published_course_structure_content
  where id = p_published_course_id;

  if course_structure is null then
    return jsonb_build_object('error', 'course structure not found');
  end if;

  -- =========================================================================
  -- STEP 2: Resolve the current navigation context using provided identifiers
  -- This resolves to a record indicating where in the course structure we are.
  -- =========================================================================
  select * 
  into current_context 
  from public.resolve_current_context(
    course_structure,
    p_current_block_id,
    p_current_lesson_id,
    p_current_chapter_id
  );

  if current_context is null then
    return jsonb_build_object('error', 'could not resolve current context');
  end if;

  -- =========================================================================
  -- STEP 3: Build and return the full unified navigation state as JSONB
  -- The structure includes:
  --   - current:    metadata of current position
  --   - previous:   metadata for previous navigable item
  --   - next:       metadata for next navigable item
  --   - continue:   smart resume pointer
  --   - completion: progress and completion indicators
  --   - course_info: static metadata like title, total items, etc.
  -- =========================================================================
  select jsonb_build_object(
    'current', public.get_current_navigation_state(
      p_user_id,
      p_published_course_id,
      course_structure,
      current_context
    ),
    'previous', public.get_previous_navigation_state(
      p_user_id,
      p_published_course_id,
      course_structure,
      current_context
    ),
    'next', public.get_next_navigation_state(
      p_user_id,
      p_published_course_id,
      course_structure,
      current_context
    ),
    'continue', public.get_continue_navigation_state(
      p_user_id,
      p_published_course_id,
      course_structure,
      current_context
    ),
    'completion', public.get_completion_navigation_state(
      p_user_id,
      p_published_course_id,
      course_structure,
      current_context
    ),
    'course_info', public.get_course_navigation_info(
      p_user_id,
      p_published_course_id,
      course_structure
    )
  )
  into navigation_result;

  return navigation_result;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_lesson_blocks_progress(p_course_id uuid, p_chapter_id uuid, p_lesson_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  lesson_data jsonb;             -- Holds the extracted lesson object from published structure
  current_user_id uuid := auth.uid(); -- Authenticated user's ID
  total_blocks_count int;        -- Total number of blocks in the lesson
  result jsonb;                  -- Final JSON result to return
begin
  -- Check if the user has access to the published course structure
  if not has_column_privilege('public.published_course_structure_content', 'course_structure_content', 'SELECT') then
    raise exception 'Access denied to course content';
  end if;

  -- Extract the JSONB representation of the lesson object from the published course structure
  select lesson_obj
  into lesson_data
  from public.published_course_structure_content pcs,
        jsonb_path_query(
          pcs.course_structure_content,
          '$.chapters[*].lessons[*] ? (@.id == $lesson_id)',
          jsonb_build_object('lesson_id', p_lesson_id::text)
        ) as lesson_obj
  where pcs.id = p_course_id
  limit 1;

  -- If lesson is not found, return an error object
  if lesson_data is null then
    return jsonb_build_object(
      'error', 'Lesson not found',
      'lesson_id', p_lesson_id
    );
  end if;

  -- Get number of blocks in the lesson
  total_blocks_count := jsonb_array_length(lesson_data->'blocks');

  with enriched_blocks as (
    select 
      block_info as block,
      (block_info->>'id')::uuid as block_id,
      pos as position,

      coalesce((block_info->'settings'->>'can_skip')::boolean, false) as can_skip,
      coalesce((block_info->'settings'->>'weight')::int, 1) as weight,
      (pos = total_blocks_count) as is_last_block,

      bp.progress_data as block_progress,
      coalesce(bp.is_completed, false) as is_completed,
      coalesce(bp.has_started, false) as has_started,
      coalesce(bp.time_spent, 0) as time_spent_seconds,
      bp.earned_score,
      bp.completed_at,

      lag(coalesce(bp.is_completed, false), 1, true) over (order by pos) as prev_completed

    from jsonb_array_elements(lesson_data->'blocks') with ordinality as blocks(block_info, pos)

    left join (
      select 
        block_id,
        jsonb_build_object(
          'id', bp.id,
          'user_id', bp.user_id,
          'block_id', bp.block_id,
          'lesson_id', bp.lesson_id,
          'chapter_id', bp.chapter_id,
          'created_at', case when bp.created_at is not null then date_trunc('milliseconds', bp.created_at at time zone 'UTC')::timestamptz else null end,
          'started_at', case when bp.started_at is not null then date_trunc('milliseconds', bp.started_at at time zone 'UTC')::timestamptz else null end,
          'updated_at', case when bp.updated_at is not null then date_trunc('milliseconds', bp.updated_at at time zone 'UTC')::timestamptz else null end,
          'completed_at', case when bp.completed_at is not null then date_trunc('milliseconds', bp.completed_at at time zone 'UTC')::timestamptz else null end,
          'earned_score', bp.earned_score,
          'is_completed', bp.is_completed,
          'attempt_count', bp.attempt_count,
          'last_response', bp.last_response,
          'organization_id', bp.organization_id,
          'interaction_data', bp.interaction_data,
          'time_spent_seconds', bp.time_spent_seconds,
          'published_course_id', bp.published_course_id
        ) as progress_data,
        is_completed,
        started_at is not null as has_started,
        coalesce(time_spent_seconds, 0) as time_spent,
        earned_score,
        completed_at
      from public.block_progress bp
      where bp.user_id = current_user_id 
        and bp.published_course_id = p_course_id
        and bp.lesson_id = p_lesson_id
    ) bp on bp.block_id = (block_info->>'id')::uuid
  ),

  final_blocks as (
    select 
      *,
      case 
        when position = 1 then true
        when can_skip then true
        else prev_completed
      end as is_visible,

      case 
        when has_started and not is_completed then true
        when not has_started and position = 1 then true
        when not has_started and prev_completed then true
        else false
      end as is_active
    from enriched_blocks
  ),

  aggregated_data as (
    select 
      jsonb_agg(
        jsonb_build_object(
          'block', block,
          'block_progress', block_progress,
          'is_visible', is_visible,
          'is_last_block', is_last_block,
          'is_active', is_active
        )
        order by position
      ) as blocks,

      count(*) as total_blocks,
      sum(weight) as total_weight,
      sum(weight) filter (where is_completed) as completed_weight,
      count(*) filter (where is_visible) as visible_blocks,
      count(*) filter (where is_completed) as completed_blocks,
      count(*) filter (where is_visible and not is_completed) as available_blocks,
      count(*) filter (where not is_visible) as locked_blocks,
      count(*) filter (where is_active) as active_blocks,
      (array_agg(block_id order by position) filter (where is_active))[1] as active_block_id,
      sum(time_spent_seconds) as total_time_spent,
      avg(earned_score) as average_score,
      case 
        when max(completed_at) is not null 
        then date_trunc('milliseconds', max(completed_at) at time zone 'UTC')::timestamptz
        else null
      end as last_completed_at,
      (sum(weight) filter (where is_completed) = sum(weight)) as is_fully_completed
    from final_blocks
  )

  select jsonb_build_object(
    'blocks', blocks,
    'metadata', jsonb_build_object(
      'total_blocks', total_blocks,
      'visible_blocks', visible_blocks,
      'completed_blocks', completed_blocks,
      'available_blocks', available_blocks,
      'locked_blocks', locked_blocks,
      'active_block_id', active_block_id,
      'total_time_spent', total_time_spent,
      'average_score', round(average_score, 2),
      'last_completed_at', last_completed_at,
      'is_fully_completed', is_fully_completed,
      'completion_percentage', case 
        when total_weight > 0 and completed_weight > 0 
          then round(completed_weight * 100.0 / total_weight, 1)
        else 0
      end
    )
  )
  into result
  from aggregated_data;

  return result;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_org_role(arg_org_id uuid, arg_user_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select om.role::text
  from public.organization_members om
  where om.organization_id = arg_org_id
    and om.user_id = arg_user_id
  limit 1;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_member_exit_update_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  -- Step 1: Update profile
  update public.profiles
  set
    mode = 'personal',
    active_organization_id = null
  where id = old.user_id;

  -- Step 2: Nullify course ownership in this organization (if any)
  update public.courses
  set owned_by = null
  where organization_id = old.organization_id
    and owned_by = old.user_id;

  return old;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_organization_ai_credits()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  monthly_limit int;
begin
  -- Get monthly AI credit limit based on tier
  select public.tier_limits.ai_usage_limit_monthly
  into monthly_limit
  from public.tier_limits
  where public.tier_limits.tier = new.tier;

  -- Fallback to 100 if tier not found or has null limit
  if monthly_limit is null then
    monthly_limit := 100;
  end if;

  -- Insert the org’s initial AI credit record
  insert into public.organizations_ai_credits (
    org_id,
    base_credits_total,
    base_credits_remaining,
    purchased_credits_total,
    purchased_credits_remaining,
    last_reset_at,
    next_reset_at,
    updated_at
  )
  values (
    new.id,
    monthly_limit,
    monthly_limit,
    0,
    0,
    now(),
    now() + interval '1 month',
    now()
  )
  on conflict (org_id) do nothing;  -- Prevent duplicates

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  -- Insert into profile
  begin
    insert into public.profiles (
      id, username, email, full_name, avatar_url, email_verified
    )
    values (
      new.id,
      new.raw_user_meta_data->>'username',
      new.email,
      coalesce(
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'name'
      ),
      new.raw_user_meta_data->>'avatar_url',
      new.email_confirmed_at is not null
    );
  exception
    when others then
      raise notice 'Error inserting profile for user %: %', new.id, sqlerrm;
      raise;
  end;

  -- Assign role
  begin
    if new.email = 'gonasiapp@gmail.com' then
      insert into public.user_roles (user_id, role) values (new.id, 'go_su');
    elsif new.email ilike '%@gonasi.com' then
      insert into public.user_roles (user_id, role) values (new.id, 'go_staff');
    else
      insert into public.user_roles (user_id, role) values (new.id, 'user');
    end if;
  exception
    when others then
      raise notice 'Error assigning role for user %: %', new.id, sqlerrm;
      raise;
  end;

  return null;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.has_org_role(arg_org_id uuid, required_role text, arg_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select 
    case 
      when required_role = 'owner' then 
        coalesce(public.get_user_org_role(arg_org_id, arg_user_id), '') = 'owner'
      when required_role = 'admin' then 
        coalesce(public.get_user_org_role(arg_org_id, arg_user_id), '') in ('admin', 'owner')
      when required_role = 'editor' then 
        coalesce(public.get_user_org_role(arg_org_id, arg_user_id), '') in ('editor', 'admin', 'owner')
      else false  -- invalid role name fallback
    end;
$function$
;

CREATE OR REPLACE FUNCTION public.has_pending_invite(arg_org_id uuid, user_email text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1
    from public.organization_invites oi
    where oi.organization_id = arg_org_id
      and lower(oi.email) = lower(user_email)
      and oi.accepted_at is null
      and oi.revoked_at is null
      and oi.expires_at > now()
  );
$function$
;

CREATE OR REPLACE FUNCTION public.increment_lesson_reset_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  -- Optional debug log
  raise notice 'Lesson reset: user_id=%, course_id=%, lesson_id=%',
    OLD.user_id, OLD.published_course_id, OLD.lesson_id;

  insert into public.lesson_reset_count (
    user_id,
    published_course_id,
    lesson_id,
    reset_count
  )
  values (
    OLD.user_id,
    OLD.published_course_id,
    OLD.lesson_id,
    1
  )
  on conflict (user_id, published_course_id, lesson_id)
  do update set
    reset_count = lesson_reset_count.reset_count + 1;

  return OLD;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.insert_user_notification(p_user_id uuid, p_type_key text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_type_record record;
  v_notification_id uuid;
  v_title text;
  v_body text;
  v_key text;
  v_value text;
begin
  -- Log input parameters
  raise notice 'insert_user_notification called with user_id=%, type_key=%, metadata=%', 
    p_user_id, p_type_key, p_metadata;

  -- Resolve notification type and get templates
  select 
    unt.key,
    unt.title_template,
    unt.body_template,
    unt.default_in_app,
    unt.default_email
  into v_type_record
  from public.user_notifications_types as unt
  where unt.key = p_type_key::public.user_notification_key;

  if v_type_record.key is null then
    raise exception 'Unknown user_notification_key: %', p_type_key;
  end if;

  raise notice 'Resolved notification type: %', v_type_record.key;

  -- Start with templates
  v_title := v_type_record.title_template;
  v_body := v_type_record.body_template;

  -- Simple template variable replacement
  -- Replace {{key}} with value from metadata
  for v_key, v_value in
    select key, value::text
    from jsonb_each_text(p_metadata)
  loop
    v_title := replace(v_title, '{{' || v_key || '}}', v_value);
    v_body := replace(v_body, '{{' || v_key || '}}', v_value);
  end loop;

  raise notice 'Rendered title=%, body=%', v_title, v_body;

  -- Insert notification row with actual schema columns
  insert into public.user_notifications (
    user_id,
    key,
    title,
    body,
    payload,
    delivered_in_app,
    delivered_email
  ) values (
    p_user_id,
    p_type_key::public.user_notification_key,
    v_title,
    v_body,
    p_metadata,
    v_type_record.default_in_app,
    v_type_record.default_email
  )
  returning id into v_notification_id;

  raise notice 'Inserted notification with id=%', v_notification_id;

  return v_notification_id;
exception
  when others then
    raise notice 'insert_user_notification failed: %', sqlerrm;
    raise;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.is_user_already_member(arg_org_id uuid, user_email text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1
    from public.organization_members om
    join public.profiles p on om.user_id = p.id
    where om.organization_id = arg_org_id
      and lower(p.email) = lower(user_email)
  )
$function$
;

CREATE OR REPLACE FUNCTION public.notify_tier_limits_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  project_url text;
  publishable_key text;
  endpoint text;
begin
  -- Fetch secrets inline from Vault (explicit schema)
  select decrypted_secret into project_url 
  from vault.decrypted_secrets 
  where name = 'project_url';

  select decrypted_secret into publishable_key
  from vault.decrypted_secrets
  where name = 'publishable_key';

  -- Build Edge Function URL
  endpoint := project_url || '/functions/v1/tier-limits-updated';

  -- Call Edge Function (explicit extension schema)
  perform net.http_post(
    url := endpoint,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || publishable_key
    ),
    body := jsonb_build_object(
      'event', TG_OP,
      'table', TG_TABLE_NAME,
      'row', row_to_json(NEW)
    )
  );

  return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.process_course_payment_from_paystack(p_payment_reference text, p_paystack_transaction_id text, p_user_id uuid, p_published_course_id uuid, p_tier_id uuid, p_amount_paid numeric, p_currency_code text, p_payment_method text DEFAULT 'card'::text, p_paystack_fee numeric DEFAULT 0, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
    -- Course & org info
    v_course_title text;
    v_organization_id uuid;
    v_org_tier public.subscription_tier;
    v_platform_fee_percent numeric(5,2);

    -- Tier info
    v_tier_name text;
    v_tier_description text;
    v_tier_price numeric(19,4);
    v_tier_promotional_price numeric(19,4);
    v_tier_frequency public.payment_frequency;
    v_tier_currency public.currency_code;

    -- Amount calculations
    v_gross_amount numeric(19,4);
    v_platform_fee_amount numeric(19,4);
    v_org_payout numeric(19,4);
    v_net_settlement numeric(19,4);
    v_platform_net_revenue numeric(19,4);

    -- Wallets
    v_org_wallet_id uuid;
    v_platform_wallet_id uuid;

    -- Ledger
    v_ledger_course_purchase uuid;
    v_ledger_org_payout uuid;
    v_ledger_platform_revenue uuid;
    v_ledger_gateway_fee uuid;

    -- Enrollment
    v_enrollment_id uuid;
    v_access_start timestamptz := timezone('utc', now());
    v_activity_id uuid;

    -- Purchase history
    v_purchase_id uuid;

    -- Notification
    v_notification_id uuid;
begin
    ---------------------------------------------------------------
    -- Idempotency
    ---------------------------------------------------------------
    perform 1
    from public.wallet_ledger_entries
    where payment_reference = p_payment_reference
    limit 1;

    if found then
        return jsonb_build_object(
            'success', false,
            'message', 'Payment already processed',
            'payment_reference', p_payment_reference
        );
    end if;

    ---------------------------------------------------------------
    -- Validate course & organization
    ---------------------------------------------------------------
    select pc.name, pc.organization_id
    into v_course_title, v_organization_id
    from public.published_courses pc
    where pc.id = p_published_course_id
      and pc.is_active = true;

    if not found then
        raise exception 'Published course not found or inactive: %', p_published_course_id;
    end if;

    select o.tier into v_org_tier
    from public.organizations o
    where o.id = v_organization_id;

    select tl.platform_fee_percentage
    into v_platform_fee_percent
    from public.tier_limits tl
    where tl.tier = v_org_tier;

    ---------------------------------------------------------------
    -- Get paid pricing tier
    ---------------------------------------------------------------
    select 
        pt.tier_name,
        pt.tier_description,
        pt.price,
        pt.promotional_price,
        pt.payment_frequency::public.payment_frequency,
        pt.currency_code::public.currency_code
    into
        v_tier_name,
        v_tier_description,
        v_tier_price,
        v_tier_promotional_price,
        v_tier_frequency,
        v_tier_currency
    from public.course_pricing_tiers pt
    where pt.course_id = p_published_course_id
      and pt.id = p_tier_id
      and pt.is_active = true
      and pt.is_free = false;

    if not found then
        raise exception 'Paid pricing tier not found: %', p_tier_id;
    end if;

    ---------------------------------------------------------------
    -- Determine actual price charged
    ---------------------------------------------------------------
    if v_tier_promotional_price is not null
       and v_tier_promotional_price < v_tier_price then
        v_gross_amount := v_tier_promotional_price;
    else
        v_gross_amount := v_tier_price;
    end if;

    if p_amount_paid != v_gross_amount then
        raise exception 'Amount mismatch. Expected %, received %',
            v_gross_amount, p_amount_paid;
    end if;

    ---------------------------------------------------------------
    -- Ensure wallets exist
    ---------------------------------------------------------------
    select ow.id
    into v_org_wallet_id
    from public.organization_wallets ow
    where ow.organization_id = v_organization_id
      and ow.currency_code = v_tier_currency;

    if not found then
        insert into public.organization_wallets (organization_id, currency_code)
        values (v_organization_id, v_tier_currency)
        returning id into v_org_wallet_id;
    end if;

    select gw.id
    into v_platform_wallet_id
    from public.gonasi_wallets gw
    where gw.currency_code = v_tier_currency;

    if not found then
        raise exception 'Platform wallet missing for currency: %', v_tier_currency;
    end if;

    ---------------------------------------------------------------
    -- Compute distribution
    ---------------------------------------------------------------
    v_net_settlement := v_gross_amount - p_paystack_fee;
    v_platform_fee_amount := round(v_gross_amount * (v_platform_fee_percent / 100), 4);
    v_org_payout := v_gross_amount - v_platform_fee_amount;
    v_platform_net_revenue := v_platform_fee_amount - p_paystack_fee;

    ---------------------------------------------------------------
    -- PAYMENT FLOW (Ledger entries only - trigger updates wallets)
    ---------------------------------------------------------------

    -- 1. External → Organization (Course Purchase)
    -- Type: 'course_purchase' - Customer pays for course
    -- Trigger will credit organization wallet balance_total
    insert into public.wallet_ledger_entries(
        source_wallet_type, source_wallet_id,
        destination_wallet_type, destination_wallet_id,
        currency_code, amount, direction, type, status,
        related_entity_type, related_entity_id,
        payment_reference, metadata
    ) values (
        'external', null,
        'organization', v_org_wallet_id,
        v_tier_currency, v_gross_amount, 'credit', 'course_purchase', 'completed',
        'course', p_published_course_id,
        p_payment_reference,
        jsonb_build_object(
            'description', 'Course purchase payment received via Paystack',
            'user_id', p_user_id,
            'course_title', v_course_title,
            'tier_name', v_tier_name,
            'payment_method', p_payment_method,
            'gross_amount', v_gross_amount,
            'paystack_transaction_id', p_paystack_transaction_id
        )
    ) returning id into v_ledger_course_purchase;

    -- 2. Organization → Platform (Platform Revenue)
    -- Type: 'platform_revenue' - Platform takes its commission
    -- Trigger will debit organization wallet and credit platform wallet
    insert into public.wallet_ledger_entries(
        source_wallet_type, source_wallet_id,
        destination_wallet_type, destination_wallet_id,
        currency_code, amount, direction, type, status,
        related_entity_type, related_entity_id,
        payment_reference, metadata
    ) values (
        'organization', v_org_wallet_id,
        'platform', v_platform_wallet_id,
        v_tier_currency, v_platform_fee_amount, 'debit', 'platform_revenue', 'completed',
        'course', p_published_course_id,
        p_payment_reference,
        jsonb_build_object(
            'description', 'Platform commission on course sale',
            'platform_fee_percent', v_platform_fee_percent,
            'platform_fee_amount', v_platform_fee_amount,
            'gross_amount', v_gross_amount,
            'org_payout', v_org_payout,
            'course_purchase_ledger_id', v_ledger_course_purchase
        )
    ) returning id into v_ledger_platform_revenue;

    -- 3. Platform → Paystack (Payment Gateway Fee)
    -- Type: 'payment_gateway_fee' - Platform pays gateway processing fee
    -- Trigger will debit platform wallet
    if p_paystack_fee > 0 then
        insert into public.wallet_ledger_entries(
            source_wallet_type, source_wallet_id,
            destination_wallet_type, destination_wallet_id,
            currency_code, amount, direction, type, status,
            related_entity_type, related_entity_id,
            payment_reference, metadata
        ) values (
            'platform', v_platform_wallet_id,
            'external', null,
            v_tier_currency, p_paystack_fee, 'debit', 'payment_gateway_fee', 'completed',
            'course', p_published_course_id,
            p_payment_reference,
            jsonb_build_object(
                'description', 'Payment gateway processing fee',
                'gateway', 'Paystack',
                'payment_method', p_payment_method,
                'platform_net_revenue', v_platform_net_revenue,
                'course_purchase_ledger_id', v_ledger_course_purchase
            )
        ) returning id into v_ledger_gateway_fee;
    end if;

    ---------------------------------------------------------------
    -- Enrollment (PAID ONLY)
    ---------------------------------------------------------------
    select id
    into v_enrollment_id
    from public.course_enrollments
    where user_id = p_user_id
      and published_course_id = p_published_course_id
    for update;

    if found then
        update public.course_enrollments
        set expires_at = v_access_start + interval '1 month',
            is_active = true,
            updated_at = timezone('utc', now())
        where id = v_enrollment_id;
    else
        insert into public.course_enrollments(
            user_id, published_course_id, organization_id,
            enrolled_at, expires_at, is_active
        ) values (
            p_user_id, p_published_course_id, v_organization_id,
            v_access_start, v_access_start + interval '1 month', true
        ) returning id into v_enrollment_id;
    end if;

    insert into public.course_enrollment_activities(
        enrollment_id, tier_name, tier_description, payment_frequency,
        currency_code, is_free, price_paid, promotional_price, was_promotional,
        access_start, access_end, created_by
    ) values (
        v_enrollment_id, v_tier_name, v_tier_description, v_tier_frequency,
        v_tier_currency, false, v_gross_amount, v_tier_promotional_price,
        (v_tier_promotional_price is not null),
        v_access_start, v_access_start + interval '1 month', p_user_id
    ) returning id into v_activity_id;

    ---------------------------------------------------------------
    -- Purchase History
    ---------------------------------------------------------------
    insert into public.user_purchases (
        user_id, published_course_id, amount_paid, currency_code,
        payment_reference, transaction_type, purchased_at, metadata
    ) values (
        p_user_id, p_published_course_id, v_gross_amount, v_tier_currency,
        p_payment_reference, 'course_purchase', timezone('utc', now()),
        jsonb_build_object(
            'course_title', v_course_title,
            'tier_id', p_tier_id,
            'tier_name', v_tier_name,
            'tier_description', v_tier_description,
            'payment_frequency', v_tier_frequency,
            'original_price', v_tier_price,
            'promotional_price', v_tier_promotional_price,
            'was_promotional', (v_tier_promotional_price is not null and v_tier_promotional_price < v_tier_price),
            'payment_method', p_payment_method,
            'paystack_transaction_id', p_paystack_transaction_id,
            'gross_amount', v_gross_amount,
            'paystack_fee', p_paystack_fee,
            'platform_fee_percent', v_platform_fee_percent,
            'platform_fee_amount', v_platform_fee_amount,
            'organization_payout', v_org_payout,
            'organization_id', v_organization_id,
            'organization_tier', v_org_tier,
            'enrollment_id', v_enrollment_id,
            'activity_id', v_activity_id,
            'access_start', v_access_start,
            'access_end', v_access_start + interval '1 month',
            'user_metadata', p_metadata,
            'processed_at', timezone('utc', now()),
            'ledger_entries', jsonb_build_object(
                'course_purchase', v_ledger_course_purchase,
                'platform_revenue', v_ledger_platform_revenue,
                'gateway_fee', v_ledger_gateway_fee
            )
        ) 
    ) returning id into v_purchase_id;

    ---------------------------------------------------------------
    -- Non-fatal: create user notification for successful purchase/enrollment
    ---------------------------------------------------------------
    begin
      perform public.insert_user_notification(
        p_user_id,
        'course_purchase_success',
        jsonb_build_object(
          'purchase_id', v_purchase_id,
          'course_id', p_published_course_id,
          'course_title', v_course_title,
          'tier_id', p_tier_id,
          'tier_name', v_tier_name,
          'amount_paid', v_gross_amount,
          'currency', v_tier_currency,
          'access_start', v_access_start,
          'access_end', v_access_start + interval '1 month',
          'payment_reference', p_payment_reference,
          'payment_transaction_id', p_paystack_transaction_id
        )
      );
    exception
      when others then
        -- Don't fail the entire transaction if notification insertion fails.
        -- Log the issue and continue.
        raise warning 'insert_user_notification failed for purchase %: %', coalesce(v_purchase_id::text, 'null'), sqlerrm;
    end;

    ---------------------------------------------------------------
    -- Return summary
    ---------------------------------------------------------------
    return jsonb_build_object(
        'success', true,
        'message', 'Paid course purchase processed successfully',
        'enrollment', jsonb_build_object(
            'enrollment_id', v_enrollment_id,
            'activity_id', v_activity_id,
            'user_id', p_user_id,
            'course_title', v_course_title,
            'tier_name', v_tier_name,
            'access_start', v_access_start,
            'access_end', v_access_start + interval '1 month'
        ),
        'payment', jsonb_build_object(
            'reference', p_payment_reference,
            'transaction_id', p_paystack_transaction_id,
            'gross_amount', v_gross_amount,
            'currency', v_tier_currency,
            'payment_method', p_payment_method
        ),
        'distribution', jsonb_build_object(
            'gross_amount', v_gross_amount,
            'paystack_fee', p_paystack_fee,
            'net_settlement', v_net_settlement,
            'platform_fee_percent', v_platform_fee_percent,
            'platform_fee_amount', v_platform_fee_amount,
            'organization_payout', v_org_payout,
            'platform_net_revenue', v_platform_net_revenue
        ),
        'ledger_entries', jsonb_build_object(
            'course_purchase', v_ledger_course_purchase,
            'platform_revenue', v_ledger_platform_revenue,
            'gateway_fee', v_ledger_gateway_fee
        ),
        'purchase', jsonb_build_object('purchase_id', v_purchase_id)
    );

exception
    when others then
        raise exception 'Payment processing failed: %', sqlerrm;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.process_delete_course_progress()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  task pgmq.message_record;
  course_uuid uuid;
begin
  for task in
    select * from pgmq.read('delete_course_progress_queue', 60, 5)  -- vt=60s, qty=5
  loop
    begin
      -- Parse the JSON message and validate course_id
      course_uuid := (task.message->>'course_id')::uuid;
      
      if course_uuid is null then
        raise exception 'Invalid course_id in message';
      end if;

      -- Delete from all progress tables in dependency order
      -- Start with the most granular (block_progress) and work up
      
      -- Delete block progress
      delete from public.block_progress
      where published_course_id = course_uuid;

      -- Delete lesson progress
      delete from public.lesson_progress
      where published_course_id = course_uuid;

      -- Delete chapter progress
      delete from public.chapter_progress
      where published_course_id = course_uuid;

      -- Delete course progress
      delete from public.course_progress
      where published_course_id = course_uuid;

      -- Delete lesson reset counts for this course
      delete from public.lesson_reset_count
      where published_course_id = course_uuid;

      -- Delete the message if successful
      perform pgmq.delete('delete_course_progress_queue', task.msg_id);
      
      raise notice 'Successfully deleted progress for course: %', course_uuid;
      
    exception
      when others then
        -- Log error but don't requeue to avoid infinite loops
        raise warning 'Failed to process delete task for course %: %', 
          coalesce((task.message->>'course_id'), 'unknown'), sqlerrm;
        -- Still delete the message to prevent reprocessing
        perform pgmq.delete('delete_course_progress_queue', task.msg_id);
    end;
  end loop;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.process_subscription_payment(p_payment_reference text, p_organization_id uuid, p_amount_paid numeric, p_currency_code public.currency_code, p_paystack_fee numeric, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_subscription_id uuid;
  v_platform_wallet_id uuid;
  v_net numeric := p_amount_paid - p_paystack_fee;
begin
  -- =====================================================
  -- STEP 1: Idempotency check
  -- =====================================================
  if exists (
    select 1
    from public.wallet_ledger_entries
    where payment_reference = p_payment_reference
      and type = 'subscription_payment'
  ) then
    return jsonb_build_object(
      'success', true,
      'message', 'Payment already processed (idempotent)',
      'payment_reference', p_payment_reference,
      'duplicate', true
    );
  end if;

  -- =====================================================
  -- STEP 2: Validate organization subscription
  -- =====================================================
  select id
  into v_subscription_id
  from public.organization_subscriptions
  where organization_id = p_organization_id
    and status in ('active','attention')
  limit 1;

  if v_subscription_id is null then
    raise exception 'No active subscription found for organization: %', p_organization_id;
  end if;

  -- =====================================================
  -- STEP 3: Ensure platform wallet exists
  -- =====================================================
  insert into public.gonasi_wallets(currency_code)
  values (p_currency_code)
  on conflict (currency_code) do nothing;

  select id
  into v_platform_wallet_id
  from public.gonasi_wallets
  where currency_code = p_currency_code;

  if v_platform_wallet_id is null then
    raise exception 'Platform wallet not found for currency: %', p_currency_code;
  end if;

  -- =====================================================
  -- STEP 4: Create Ledger Entries
  -- =====================================================

  -- Subscription payment (gross inflow)
  insert into public.wallet_ledger_entries(
    source_wallet_type,
    source_wallet_id,
    destination_wallet_type,
    destination_wallet_id,
    currency_code,
    amount,
    direction,
    payment_reference,
    type,
    status,
    related_entity_type,
    related_entity_id,
    metadata
  ) values (
    'external',
    null,
    'platform',
    v_platform_wallet_id,
    p_currency_code,
    p_amount_paid,
    'credit',
    p_payment_reference,
    'subscription_payment',
    'completed',
    'organization_subscription',
    v_subscription_id,
    jsonb_build_object(
      'source', 'paystack',
      'organization_id', p_organization_id,
      'subscription_id', v_subscription_id,
      'gross_amount', p_amount_paid,
      'webhook_metadata', p_metadata
    )
  );

  -- Paystack fee deduction (debit)
  if p_paystack_fee > 0 then
    insert into public.wallet_ledger_entries(
      source_wallet_type,
      source_wallet_id,
      destination_wallet_type,
      destination_wallet_id,
      currency_code,
      amount,
      direction,
      payment_reference,
      type,
      status,
      related_entity_type,
      related_entity_id,
      metadata
    ) values (
      'platform',
      v_platform_wallet_id,
      'external',
      null,
      p_currency_code,
      p_paystack_fee,
      'debit',
      p_payment_reference,
      'payment_gateway_fee',
      'completed',
      'organization_subscription',
      v_subscription_id,
      jsonb_build_object(
        'destination', 'paystack',
        'fee_type', 'subscription_payment',
        'organization_id', p_organization_id,
        'gross_amount', p_amount_paid,
        'net_revenue', v_net,
        'webhook_metadata', p_metadata
      )
    );
  end if;

  -- =====================================================
  -- STEP 5: Update subscription period (monthly)
  -- =====================================================
  update public.organization_subscriptions
  set
    status = 'active',
    current_period_start = coalesce(current_period_end, now()),
    current_period_end = coalesce(current_period_end, now()) + interval '1 month',
    updated_at = now()
  where id = v_subscription_id;

  -- =====================================================
  -- STEP 6: Return Success Response
  -- =====================================================
  return jsonb_build_object(
    'success', true,
    'message', 'Subscription payment processed successfully',
    'subscription_id', v_subscription_id,
    'organization_id', p_organization_id,
    'payment_reference', p_payment_reference,
    'gross_amount', p_amount_paid,
    'paystack_fee', p_paystack_fee,
    'net_platform_revenue', v_net,
    'currency_code', p_currency_code,
    'ledger_entries_created', 1 + (case when p_paystack_fee>0 then 1 else 0 end),
    'platform_wallet', v_platform_wallet_id
  );

exception
  when others then
    raise exception 'Error processing subscription payment: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.reorder_chapters(p_course_id uuid, chapter_positions jsonb, p_updated_by uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  temp_offset int := 1000000;
  v_org_id uuid;
  v_course_creator uuid;
begin
  -- Step 1: Validate input presence
  if chapter_positions is null or jsonb_array_length(chapter_positions) = 0 then
    raise exception 'chapter_positions array cannot be null or empty';
  end if;

  -- Step 2: Fetch course metadata
  select organization_id, created_by
  into v_org_id, v_course_creator
  from public.courses
  where id = p_course_id;

  if v_org_id is null then
    raise exception 'Course does not exist';
  end if;

  -- Step 3: Permission check
  if not (
    public.has_org_role(v_org_id, 'admin', p_updated_by) or
    v_course_creator = p_updated_by
  ) then
    raise exception 'You do not have permission to reorder chapters in this course';
  end if;

  -- Step 4: Validate chapter IDs
  if exists (
    select 1
    from jsonb_array_elements(chapter_positions) as cp
    left join public.chapters ch on ch.id = (cp->>'id')::uuid
    where ch.id is null or ch.course_id != p_course_id
  ) then
    raise exception 'One or more chapter IDs are invalid or not part of the course';
  end if;

  -- Step 5: Validate all position values are positive
  if exists (
    select 1
    from jsonb_array_elements(chapter_positions) as cp
    where (cp->>'position')::int <= 0
  ) then
    raise exception 'All chapter positions must be positive integers';
  end if;

  -- Step 6: Validate all chapters in the course are included
  if (
    select count(*) from public.chapters where course_id = p_course_id
  ) != jsonb_array_length(chapter_positions) then
    raise exception 'You must include all chapters in the reorder payload';
  end if;

  -- Step 7: Ensure positions are unique
  if (
    select count(distinct (cp->>'position')::int)
    from jsonb_array_elements(chapter_positions) as cp
  ) != jsonb_array_length(chapter_positions) then
    raise exception 'Duplicate chapter positions are not allowed';
  end if;

  -- Step 8: Temporarily offset current positions
  update public.chapters
  set position = position + temp_offset
  where course_id = p_course_id;

  -- Step 9: Apply new positions
  update public.chapters
  set 
    position = new_positions.position,
    updated_at = timezone('utc', now()),
    updated_by = p_updated_by
  from (
    select 
      (cp->>'id')::uuid as id,
      row_number() over (order by (cp->>'position')::int) as position
    from jsonb_array_elements(chapter_positions) as cp
  ) as new_positions
  where public.chapters.id = new_positions.id
    and public.chapters.course_id = p_course_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.reorder_lesson_blocks(blocks jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  target_course_id uuid;
  target_lesson_id uuid;
begin
  -- extract course_id and lesson_id from first block in the jsonb array
  target_course_id := (blocks->0->>'course_id')::uuid;
  target_lesson_id := (blocks->0->>'lesson_id')::uuid;

  -- temporarily shift all existing positions for this course and lesson to avoid conflicts
  update public.lesson_blocks
  set position = position + 1000000
  where course_id = target_course_id
    and lesson_id = target_lesson_id;

  -- upsert new block positions from provided jsonb array
  insert into public.lesson_blocks (
    id, course_id, lesson_id, plugin_type, position, content, settings, created_by, updated_by
  )
  select
    (b->>'id')::uuid,
    (b->>'course_id')::uuid,
    (b->>'lesson_id')::uuid,
    b->>'plugin_type',
    (b->>'position')::int,
    coalesce(b->'content', '{}'::jsonb),
    coalesce(b->'settings', '{}'::jsonb),
    (b->>'created_by')::uuid,
    (b->>'updated_by')::uuid
  from jsonb_array_elements(blocks) as b
  on conflict (id) do update
  set
    position = excluded.position,
    updated_by = excluded.updated_by,
    updated_at = timezone('utc', now());
end;
$function$
;

CREATE OR REPLACE FUNCTION public.reorder_lesson_blocks(p_lesson_id uuid, block_positions jsonb, p_updated_by uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  temp_offset int := 1000000;
  v_course_id uuid;
  v_org_id uuid;
  v_course_creator uuid;
begin
  -- Step 1: Validate input presence
  if block_positions is null or jsonb_array_length(block_positions) = 0 then
    raise exception 'block_positions array cannot be null or empty';
  end if;

  -- Step 2: Fetch course/org context and creator
  select l.course_id, c.organization_id, c.created_by
  into v_course_id, v_org_id, v_course_creator
  from public.lessons l
  join public.courses c on l.course_id = c.id
  where l.id = p_lesson_id;

  if v_course_id is null then
    raise exception 'Lesson does not exist';
  end if;

  -- Step 3: Permission check
  if not (
    public.has_org_role(v_org_id, 'admin', p_updated_by) or
    v_course_creator = p_updated_by
  ) then
    raise exception 'You do not have permission to reorder blocks in this lesson';
  end if;

  -- Step 4: Validate block ownership and existence
  if exists (
    select 1 
    from jsonb_array_elements(block_positions) as bp
    left join public.lesson_blocks lb on lb.id = (bp->>'id')::uuid
    where lb.id is null or lb.lesson_id != p_lesson_id
  ) then
    raise exception 'One or more block IDs do not exist or do not belong to this lesson';
  end if;

  -- Step 5: Validate position values
  if exists (
    select 1
    from jsonb_array_elements(block_positions) as bp
    where (bp->>'position')::int <= 0
  ) then
    raise exception 'All position values must be positive integers';
  end if;

  -- Step 6: Ensure all blocks are included
  if (
    select count(*) from public.lesson_blocks where lesson_id = p_lesson_id
  ) != jsonb_array_length(block_positions) then
    raise exception 'All blocks in the lesson must be included in the reorder operation';
  end if;

  -- Step 7: Ensure unique position values
  if (
    select count(distinct (bp->>'position')::int)
    from jsonb_array_elements(block_positions) as bp
  ) != jsonb_array_length(block_positions) then
    raise exception 'Duplicate position values are not allowed';
  end if;

  -- Step 8: Temporarily offset all current positions
  update public.lesson_blocks
  set position = position + temp_offset
  where lesson_id = p_lesson_id;

  -- Step 9: Apply new positions with audit metadata
  update public.lesson_blocks
  set 
    position = new_positions.position,
    updated_at = timezone('utc', now()),
    updated_by = p_updated_by
  from (
    select 
      (bp->>'id')::uuid as id,
      row_number() over (order by (bp->>'position')::int) as position
    from jsonb_array_elements(block_positions) as bp
  ) as new_positions
  where public.lesson_blocks.id = new_positions.id
    and public.lesson_blocks.lesson_id = p_lesson_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.reorder_lessons(p_chapter_id uuid, lesson_positions jsonb, p_updated_by uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  temp_offset int := 1000000;
  v_course_id uuid;
  v_org_id uuid;
begin
  if lesson_positions is null or jsonb_array_length(lesson_positions) = 0 then
    raise exception 'lesson_positions array cannot be null or empty';
  end if;

  select c.course_id, c.organization_id
  into v_course_id, v_org_id
  from public.chapters c
  where c.id = p_chapter_id;

  if v_course_id is null then
    raise exception 'Chapter does not exist';
  end if;

  if not public.has_org_role(v_org_id, 'editor', p_updated_by) then
    raise exception 'Insufficient permissions to reorder lessons in this chapter';
  end if;

  if exists (
    select 1 
    from jsonb_array_elements(lesson_positions) as lp
    left join public.lessons l on l.id = (lp->>'id')::uuid
    where l.id is null or l.chapter_id != p_chapter_id
  ) then
    raise exception 'One or more lesson IDs do not exist or do not belong to the specified chapter';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(lesson_positions) as lp
    where (lp->>'position')::int <= 0
  ) then
    raise exception 'All position values must be positive integers';
  end if;

  if (
    select count(*)
    from public.lessons
    where chapter_id = p_chapter_id
  ) != jsonb_array_length(lesson_positions) then
    raise exception 'All lessons in the chapter must be included in the reorder operation';
  end if;

  if (
    select count(distinct (lp->>'position')::int)
    from jsonb_array_elements(lesson_positions) as lp
  ) != jsonb_array_length(lesson_positions) then
    raise exception 'Duplicate position values are not allowed';
  end if;

  update public.lessons
  set position = position + temp_offset
  where chapter_id = p_chapter_id;

  update public.lessons
  set 
    position = new_positions.position,
    updated_at = timezone('utc', now()),
    updated_by = p_updated_by
  from (
    select 
      (lp->>'id')::uuid as id,
      row_number() over (order by (lp->>'position')::int) as position
    from jsonb_array_elements(lesson_positions) as lp
  ) as new_positions
  where public.lessons.id = new_positions.id
    and public.lessons.chapter_id = p_chapter_id;

end;
$function$
;

CREATE OR REPLACE FUNCTION public.reorder_pricing_tiers(p_course_id uuid, tier_positions jsonb, p_updated_by uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_org_id uuid;
  temp_offset int := 1000000;
begin
  if tier_positions is null or jsonb_array_length(tier_positions) = 0 then
    raise exception 'tier_positions array cannot be null or empty';
  end if;

  select organization_id into v_org_id
  from public.courses
  where id = p_course_id;

  if v_org_id is null then
    raise exception 'Course not found';
  end if;

  if not (
    public.has_org_role(v_org_id, 'owner', p_updated_by)
    or public.has_org_role(v_org_id, 'admin', p_updated_by)
    or exists (select 1 from public.course_editors where course_id = p_course_id and user_id = p_updated_by)
  ) then
    raise exception 'Insufficient permissions to reorder pricing tiers in this course';
  end if;

  if exists (
    select 1 
    from jsonb_array_elements(tier_positions) as tp
    left join public.course_pricing_tiers t on t.id = (tp->>'id')::uuid
    where t.id is null or t.course_id != p_course_id
  ) then
    raise exception 'One or more pricing tier IDs do not exist or do not belong to the specified course';
  end if;

  if exists (
    select 1 from jsonb_array_elements(tier_positions) as tp
    where (tp->>'position')::int <= 0
  ) then
    raise exception 'All position values must be positive integers';
  end if;

  if (
    select count(*) from public.course_pricing_tiers
    where course_id = p_course_id
  ) != jsonb_array_length(tier_positions) then
    raise exception 'All tiers for the course must be included in the reorder operation';
  end if;

  if (
    select count(distinct (tp->>'position')::int)
    from jsonb_array_elements(tier_positions) as tp
  ) != jsonb_array_length(tier_positions) then
    raise exception 'Duplicate position values are not allowed';
  end if;

  update public.course_pricing_tiers
  set position = position + temp_offset
  where course_id = p_course_id;

  update public.course_pricing_tiers
  set 
    position = new_positions.position,
    updated_at = timezone('utc', now()),
    updated_by = p_updated_by
  from (
    select 
      (tp->>'id')::uuid as id,
      row_number() over (order by (tp->>'position')::int) as position
    from jsonb_array_elements(tier_positions) as tp
  ) as new_positions
  where public.course_pricing_tiers.id = new_positions.id
    and course_id = p_course_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.reset_org_ai_base_credits_when_due()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  update public.organizations_ai_credits as oac
  set
    base_credits_total = coalesce(t.ai_usage_limit_monthly, 100),
    base_credits_remaining = coalesce(t.ai_usage_limit_monthly, 100),
    last_reset_at = now(),
    next_reset_at = now() + interval '1 month',
    updated_at = now()
  from public.organizations as org
  left join public.tier_limits as t
    on org.tier = t.tier
  where
    oac.org_id = org.id
    and oac.next_reset_at <= now();
end;
$function$
;

CREATE OR REPLACE FUNCTION public.resolve_current_context(course_structure jsonb, p_block_id uuid DEFAULT NULL::uuid, p_lesson_id uuid DEFAULT NULL::uuid, p_chapter_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(block_id uuid, lesson_id uuid, chapter_id uuid, block_global_order integer, lesson_global_order integer, chapter_global_order integer)
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  -- =========================================================================
  -- CASE 1: Resolve context from block_id (most granular level)
  -- =========================================================================
  if p_block_id is not null then
    return query
    with structure as (
      select
        (chapter_obj ->> 'id')::uuid as chap_id,
        (lesson_obj ->> 'id')::uuid as less_id,
        (block_obj ->> 'id')::uuid as block_id,

        -- Compute global ordering
        row_number() over (
          order by 
            (chapter_obj ->> 'order_index')::int,
            (lesson_obj ->> 'order_index')::int,
            (block_obj ->> 'order_index')::int
        ) as block_order,

        row_number() over (
          order by 
            (chapter_obj ->> 'order_index')::int,
            (lesson_obj ->> 'order_index')::int
        ) as lesson_order,

        row_number() over (
          order by 
            (chapter_obj ->> 'order_index')::int
        ) as chapter_order

      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
            jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj,
            jsonb_array_elements(lesson_obj -> 'blocks') as block_obj
    )
    select
      s.block_id,
      s.less_id,
      s.chap_id,
      s.block_order::int,
      s.lesson_order::int,
      s.chapter_order::int
    from structure s
    where s.block_id = p_block_id;

  -- =========================================================================
  -- CASE 2: Resolve context from lesson_id
  -- =========================================================================
  elsif p_lesson_id is not null then
    return query
    with structure as (
      select
        (chapter_obj ->> 'id')::uuid as chap_id,
        (lesson_obj ->> 'id')::uuid as less_id,
        null::uuid as block_id,
        null::int as block_order,

        row_number() over (
          order by 
            (chapter_obj ->> 'order_index')::int,
            (lesson_obj ->> 'order_index')::int
        ) as lesson_order,

        row_number() over (
          order by 
            (chapter_obj ->> 'order_index')::int
        ) as chapter_order

      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj,
           jsonb_array_elements(chapter_obj -> 'lessons') as lesson_obj
    )
    select
      s.block_id,
      s.less_id,
      s.chap_id,
      s.block_order,
      s.lesson_order::int,
      s.chapter_order::int
    from structure s
    where s.less_id = p_lesson_id;

  -- =========================================================================
  -- CASE 3: Resolve context from chapter_id (coarsest level)
  -- =========================================================================
  elsif p_chapter_id is not null then
    return query
    with structure as ( 
      select
        (chapter_obj ->> 'id')::uuid as chap_id,
        null::uuid as less_id,
        null::uuid as block_id,
        null::int as block_order,
        null::int as lesson_order,

        row_number() over (
          order by 
            (chapter_obj ->> 'order_index')::int
        ) as chapter_order

      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj
    )
    select
      s.block_id,
      s.less_id,
      s.chap_id,
      s.block_order,
      s.lesson_order,
      s.chapter_order::int
    from structure s
    where s.chap_id = p_chapter_id;

  -- =========================================================================
  -- CASE 4: No specific context provided - return first chapter as default
  -- This handles scenarios like "user completed course" where we need a 
  -- navigation context but don't have a specific current position.
  -- =========================================================================
  else
    return query
    with structure as ( 
      select
        (chapter_obj ->> 'id')::uuid as chap_id,
        null::uuid as less_id,
        null::uuid as block_id,
        null::int as block_order,
        null::int as lesson_order,

        row_number() over (
          order by 
            (chapter_obj ->> 'order_index')::int
        ) as chapter_order

      from jsonb_array_elements(course_structure -> 'chapters') as chapter_obj
    )
    select
      s.block_id,
      s.less_id,
      s.chap_id,
      s.block_order,
      s.lesson_order,
      s.chapter_order::int
    from structure s
    where s.chapter_order = 1  -- Return the first chapter
    limit 1;
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.rpc_verify_and_set_active_organization(organization_id_from_url uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  org public.organizations;
  member public.organization_members;
  profile_active_org_id uuid;
  current_user_id uuid;
  can_add boolean;
  tier_limits_json json;
begin
  -- Get the ID of the currently authenticated user
  current_user_id := (select auth.uid());

  -- Block unauthenticated users
  if current_user_id is null then
    return json_build_object(
      'success', false,
      'message', 'User not authenticated',
      'data', null
    );
  end if;

  -- Check if the user is a member of the target organization
  select * into member
  from public.organization_members om
  where om.organization_id = organization_id_from_url
    and om.user_id = current_user_id;

  -- If not a member, reset profile to personal mode and return early
  if not found then
    update public.profiles
    set
      mode = 'personal',
      active_organization_id = null
    where id = current_user_id;

    return json_build_object(
      'success', false,
      'message', 'You are no longer a member of this organization. Switched to personal mode.',
      'data', null
    );
  end if;

  -- Fetch the current active organization from profile
  select p.active_organization_id into profile_active_org_id
  from public.profiles p
  where p.id = current_user_id;

  -- If already set to this org, return the current org context
  if profile_active_org_id = organization_id_from_url then
  begin
    select * into org
    from public.organizations o
    where o.id = organization_id_from_url;

    can_add := public.can_accept_new_member(organization_id_from_url, 'invite');
    tier_limits_json := public.get_tier_limits_for_org(organization_id_from_url);

    return json_build_object(
      'success', true,
      'message', null,
      'data', json_build_object(
        'organization', to_json(org),
        'member', to_json(member),
        'permissions', json_build_object(
          'can_accept_new_member', can_add
        ),
        'tier_limits', tier_limits_json
      )
    );
  end;
  end if;

  -- Set the target org as the active org and update mode to "organization"
  update public.profiles p
  set
    active_organization_id = organization_id_from_url,
    mode = 'organization'
  where p.id = current_user_id;

  -- Fetch organization details
  select * into org
  from public.organizations o
  where o.id = organization_id_from_url;

  -- Fetch permissions and tier config
  can_add := public.can_accept_new_member(organization_id_from_url, 'invite');
  tier_limits_json := public.get_tier_limits_for_org(organization_id_from_url);

  -- Return updated organization context
  return json_build_object(
    'success', true,
    'message', 'Active organization has been changed',
    'data', json_build_object(
      'organization', to_json(org),
      'member', to_json(member),
      'permissions', json_build_object(
        'can_accept_new_member', can_add
      ),
      'tier_limits', tier_limits_json
    )
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_chapter_position()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  if new.position is null or new.position = 0 then
    select coalesce(max(position), 0) + 1
    into new.position
    from public.chapters
    where course_id = new.course_id;
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_course_free(p_course_id uuid, p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_org_id uuid;
  has_paid_tiers boolean;
begin
  select organization_id into v_org_id
  from public.courses
  where id = p_course_id;

  if not (
    public.has_org_role(v_org_id, 'owner', p_user_id) or
    public.has_org_role(v_org_id, 'admin', p_user_id) or
    exists (select 1 from public.course_editors where course_id = p_course_id and user_id = p_user_id)
  ) then
    raise exception 'permission denied: insufficient privileges for course %', p_course_id;
  end if;

  select exists (
    select 1 from public.course_pricing_tiers
    where course_id = p_course_id and organization_id = v_org_id and is_free = false
  ) into has_paid_tiers;

  if not has_paid_tiers then
    raise exception 'course (id=%) is already free.', p_course_id;
  end if;

  perform set_config('app.converting_course_pricing', 'true', true);

  delete from public.course_pricing_tiers
  where course_id = p_course_id and organization_id = v_org_id;

  perform set_config('app.converting_course_pricing', 'false', true);

  insert into public.course_pricing_tiers (
    course_id, organization_id, is_free, price, currency_code, created_by, updated_by,
    payment_frequency, tier_name, is_active
  ) values (
    p_course_id, v_org_id, true, 0, 'KES', p_user_id, p_user_id,
    'monthly', 'free', true
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_course_paid(p_course_id uuid, p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_org_id uuid;
  paid_tiers_count int;
begin
  select organization_id into v_org_id
  from public.courses
  where id = p_course_id;

  if not (
    public.has_org_role(v_org_id, 'owner', p_user_id) or
    public.has_org_role(v_org_id, 'admin', p_user_id) or
    exists (select 1 from public.course_editors where course_id = p_course_id and user_id = p_user_id)
  ) then
    raise exception 'permission denied: insufficient privileges for course %', p_course_id;
  end if;

  select count(*) into paid_tiers_count
  from public.course_pricing_tiers
  where course_id = p_course_id and organization_id = v_org_id and is_free = false;

  if paid_tiers_count > 0 then
    raise exception 'course (id=%) already has a paid tier.', p_course_id;
  end if;

  perform set_config('app.converting_course_pricing', 'true', true);

  delete from public.course_pricing_tiers
  where course_id = p_course_id and organization_id = v_org_id;

  perform set_config('app.converting_course_pricing', 'false', true);

  insert into public.course_pricing_tiers (
    course_id, organization_id, is_free, price, currency_code, created_by, updated_by,
    payment_frequency, tier_name, tier_description, is_active
  ) values (
    p_course_id, v_org_id, false, 100.00, 'KES', p_user_id, p_user_id,
    'monthly', 'basic plan', 'automatically added paid tier. you can update this.', true
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_course_pricing_tier_position()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  if new.position is null or new.position = 0 then
    select coalesce(max(position), 0) + 1
    into new.position
    from public.course_pricing_tiers
    where course_id = new.course_id
      and organization_id = new.organization_id;
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_file_type_from_extension()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  -- auto-extract extension if not provided
  if new.extension is null or new.extension = '' then
    new.extension := lower(substring(new.name from '\.([^\.]+)$'));
    if new.extension is null then
      new.extension := '';
    end if;
  end if;

  new.extension := lower(new.extension);

  -- set file type using schema-qualified function
  new.file_type := public.determine_file_type(new.extension);

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_lesson_block_position()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  if new.position is null or new.position = 0 then
    select coalesce(max(position), 0) + 1
    into new.position
    from public.lesson_blocks
    where lesson_id = new.lesson_id;
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_lesson_position()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  if new.position is null or new.position = 0 then
    select coalesce(max(position), 0) + 1
    into new.position
    from public.lessons
    where chapter_id = new.chapter_id;  -- Fixed: changed from course_id to chapter_id
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.subscription_upsert_webhook(org_id uuid, new_tier text, new_status text, start_ts timestamp with time zone, period_start timestamp with time zone, period_end timestamp with time zone, cancel_at_period_end boolean DEFAULT false, initial_next_payment_date timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS public.organization_subscriptions
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  result public.organization_subscriptions;
begin
  insert into public.organization_subscriptions (
    organization_id,
    tier,
    status,
    start_date,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    initial_next_payment_date
  )
  values (
    org_id,
    new_tier::public.subscription_tier,
    new_status::public.subscription_status,
    start_ts,
    period_start,
    period_end,
    cancel_at_period_end,
    coalesce(initial_next_payment_date, period_end)  -- use Paystack date if provided
  )
  on conflict (organization_id)
  do update set
    tier                  = excluded.tier,
    status                = excluded.status,
    start_date            = excluded.start_date,
    current_period_start  = excluded.current_period_start,
    current_period_end    = excluded.current_period_end,
    cancel_at_period_end  = excluded.cancel_at_period_end
  returning * into result;

  return result;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.switch_course_pricing_model(p_course_id uuid, p_user_id uuid, p_target_model text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_org_id uuid;
  current_model text;
begin
  select organization_id into v_org_id
  from public.courses
  where id = p_course_id;

  if not (
    public.has_org_role(v_org_id, 'owner', p_user_id) or
    public.has_org_role(v_org_id, 'admin', p_user_id) or
    exists (select 1 from public.course_editors where course_id = p_course_id and user_id = p_user_id)
  ) then
    raise exception 'permission denied: cannot switch course pricing model';
  end if;

  if p_target_model not in ('free', 'paid') then
    raise exception 'invalid pricing model: must be ''free'' or ''paid''';
  end if;

  select case
    when exists (
      select 1 from public.course_pricing_tiers
      where course_id = p_course_id and organization_id = v_org_id and is_free = false
    ) then 'paid'
    else 'free'
  end into current_model;

  if current_model = p_target_model then
    raise notice 'course already in % model', p_target_model;
    return;
  end if;

  if p_target_model = 'free' then
    perform public.set_course_free(p_course_id, p_user_id);
  else
    perform public.set_course_paid(p_course_id, p_user_id);
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.trg_delete_other_tiers_if_free()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  bypass_check boolean;
begin
  begin
    select coalesce(nullif(current_setting('app.converting_course_pricing', true), '')::boolean, false)
    into bypass_check;
  exception when others then
    bypass_check := false;
  end;

  if bypass_check then
    return new;
  end if;

  if new.is_free = true then
    delete from public.course_pricing_tiers
    where course_id = new.course_id
      and organization_id = new.organization_id
      and id != new.id;
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.trg_prevent_deactivating_last_free_tier()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  bypass_check boolean;
begin
  begin
    select coalesce(nullif(current_setting('app.converting_course_pricing', true), '')::boolean, false)
    into bypass_check;
  exception when others then
    bypass_check := false;
  end;

  if bypass_check then
    return new;
  end if;

  if old.is_free = true
    and old.is_active = true
    and new.is_active = false then

    if not exists (
      select 1 from public.course_pricing_tiers
      where course_id = old.course_id
        and organization_id = old.organization_id
        and id != old.id
        and is_free = true
        and is_active = true
    ) then
      raise exception
        'Every course must have at least one active free tier. Please activate or add another free tier before deactivating this one.';
    end if;
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.trg_prevent_deleting_last_free_tier()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  remaining_free_count int;
  remaining_active_count int;
  bypass_check boolean;
begin
  begin
    select coalesce(nullif(current_setting('app.converting_course_pricing', true), '')::boolean, false)
    into bypass_check;
  exception when others then
    bypass_check := false;
  end;

  if bypass_check then
    return old;
  end if;

  select count(*) into remaining_active_count
  from public.course_pricing_tiers
  where course_id = old.course_id
    and organization_id = old.organization_id
    and id != old.id
    and is_active = true;

  if remaining_active_count = 0 then
    raise exception
      'Each course must have at least one active pricing tier. Please activate or add another tier before removing this one.';
  end if;

  if old.is_free = true then
    select count(*) into remaining_free_count
    from public.course_pricing_tiers
    where course_id = old.course_id
      and organization_id = old.organization_id
      and id != old.id
      and is_free = true
      and is_active = true;

    if remaining_free_count = 0 then
      raise exception
        'Each course must have at least one free tier. Please create another free tier before deleting this one.';
    end if;
  end if;

  return old;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.trg_prevent_deleting_last_paid_tier()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  remaining_paid_tiers int;
  bypass_check boolean;
begin
  begin
    select coalesce(nullif(current_setting('app.converting_course_pricing', true), '')::boolean, false)
    into bypass_check;
  exception when others then
    bypass_check := false;
  end;

  if bypass_check then
    return old;
  end if;

  if old.is_free = false then
    select count(*) into remaining_paid_tiers
    from public.course_pricing_tiers
    where course_id = old.course_id
      and organization_id = old.organization_id
      and id != old.id
      and is_free = false;

    if remaining_paid_tiers = 0 then
      raise exception
        'Every course must have at least one paid tier. Please create another paid tier before deleting this one.';
    end if;
  end if;

  return old;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_user_notification_email_dispatch()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_type_record public.user_notifications_types;
begin
  -- Fetch the notification type record BY KEY (not by id)
  select *
  into v_type_record
  from public.user_notifications_types
  where key = new.key;  -- ✓ FIXED: was new.type_id

  if not found then
    raise warning 'Notification type not found for key: %', new.key;
    return new;
  end if;

  -- If email is not enabled for this notification type, exit
  if v_type_record.default_email is false then
    return new;
  end if;

  -- Enqueue into the PGMQ queue (only if pgmq is installed and queue exists)
  begin
    perform pgmq.send(
      'user_notifications_email_queue',
      jsonb_build_object(
        'notification_id', new.id,
        'user_id', new.user_id,
        'type_key', new.key,
        'title', new.title,
        'body', new.body,
        'payload', new.payload
      )
    );
  exception
    when others then
      -- Don't fail the insert if pgmq isn't available
      raise warning 'Failed to enqueue email notification: %', sqlerrm;
  end;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_chapter_progress_for_user(p_user_id uuid, p_published_course_id uuid, p_chapter_id uuid, p_course_progress_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  course_structure jsonb;

  chapter_total_blocks integer := 0;
  chapter_completed_blocks integer := 0;

  chapter_total_lessons integer := 0;
  chapter_completed_lessons integer := 0;

  chapter_total_weight numeric := 0;
  chapter_completed_weight numeric := 0;

  chapter_total_lesson_weight numeric := 0;
  chapter_completed_lesson_weight numeric := 0;

  chapter_is_completed boolean := false;
begin
  -- STEP 1: Load course structure
  select course_structure_content 
  into course_structure
  from public.published_course_structure_content 
  where id = p_published_course_id;

  if course_structure is null then
    raise exception 'Course structure not found for published_course_id: %', p_published_course_id;
  end if;

  -- STEP 2: Compute chapter progress
  with chapter_blocks as (
    select 
      (chapter_obj->>'id')::uuid as chapter_id,
      (lesson_obj->>'id')::uuid as lesson_id,
      (block_obj->>'id')::uuid as block_id,
      coalesce((block_obj->>'weight')::numeric, 1.0) as block_weight
    from jsonb_array_elements(course_structure->'chapters') as chapter_obj,
         jsonb_array_elements(chapter_obj->'lessons') as lesson_obj,
         jsonb_array_elements(lesson_obj->'blocks') as block_obj
    where (chapter_obj->>'id')::uuid = p_chapter_id
  ),
  chapter_lesson_weights as (
    select 
      lesson_id,
      sum(block_weight) as lesson_weight
    from chapter_blocks
    group by lesson_id
  ),
  chapter_stats as (
    select 
      count(*) as total_blocks,
      count(distinct lesson_id) as total_lessons,
      sum(block_weight) as total_weight
    from chapter_blocks
  ),
  user_chapter_block_progress as (
    select 
      count(*) filter (where bp.is_completed = true) as completed_blocks,
      coalesce(sum(cb.block_weight) filter (where bp.is_completed = true), 0) as completed_weight
    from chapter_blocks cb
    left join public.block_progress bp on (
      bp.user_id = p_user_id
      and bp.published_course_id = p_published_course_id
      and bp.block_id = cb.block_id
    )
  ),
  user_chapter_lesson_progress as (
    select 
      count(*) filter (where lp.completed_at is not null) as completed_lessons,
      coalesce(sum(clw.lesson_weight) filter (where lp.completed_at is not null), 0) as completed_lesson_weight,
      sum(clw.lesson_weight) as total_lesson_weight
    from chapter_lesson_weights clw
    left join public.lesson_progress lp on (
      lp.user_id = p_user_id
      and lp.published_course_id = p_published_course_id
      and lp.lesson_id = clw.lesson_id
    )
  )
  select 
    cs.total_blocks,
    ucbp.completed_blocks,
    cs.total_lessons,
    uclp.completed_lessons,
    cs.total_weight,
    least(ucbp.completed_weight, cs.total_weight),
    uclp.total_lesson_weight,
    least(uclp.completed_lesson_weight, uclp.total_lesson_weight)
  into 
    chapter_total_blocks,
    chapter_completed_blocks,
    chapter_total_lessons,
    chapter_completed_lessons,
    chapter_total_weight,
    chapter_completed_weight,
    chapter_total_lesson_weight,
    chapter_completed_lesson_weight
  from chapter_stats cs
  cross join user_chapter_block_progress ucbp
  cross join user_chapter_lesson_progress uclp;

  -- STEP 3: Determine completion
  chapter_is_completed := (
    chapter_total_weight > 0 and 
    chapter_completed_weight >= chapter_total_weight - 0.0001 and
    chapter_completed_lessons >= chapter_total_lessons and
    chapter_total_lessons > 0
  );

  -- STEP 4: Upsert into chapter_progress with course_progress_id
  insert into public.chapter_progress (
    course_progress_id,  -- ✅ Required
    user_id,
    published_course_id,
    chapter_id,
    total_blocks,
    completed_blocks,
    total_lessons,
    completed_lessons,
    total_weight,
    completed_weight,
    total_lesson_weight,
    completed_lesson_weight,
    is_completed,
    completed_at
  )
  values (
    p_course_progress_id,
    p_user_id,
    p_published_course_id, 
    p_chapter_id,
    chapter_total_blocks,
    chapter_completed_blocks,
    chapter_total_lessons,
    chapter_completed_lessons,
    chapter_total_weight,
    chapter_completed_weight,
    chapter_total_lesson_weight,
    chapter_completed_lesson_weight,
    chapter_is_completed,
    case when chapter_is_completed then timezone('utc', now()) else null end
  )
  on conflict (user_id, published_course_id, chapter_id)
  do update set
    course_progress_id = excluded.course_progress_id,  -- ✅ Update it
    total_blocks = excluded.total_blocks,
    completed_blocks = excluded.completed_blocks,
    total_lessons = excluded.total_lessons,
    completed_lessons = excluded.completed_lessons,
    total_weight = excluded.total_weight,
    completed_weight = excluded.completed_weight,
    total_lesson_weight = excluded.total_lesson_weight,
    completed_lesson_weight = excluded.completed_lesson_weight,
    is_completed = excluded.is_completed,
    completed_at = case 
      when excluded.completed_weight >= excluded.total_weight - 0.0001
        and excluded.total_weight > 0
        and excluded.completed_lessons >= excluded.total_lessons
        and chapter_progress.completed_at is null
      then timezone('utc', now())
      when not (
        excluded.completed_weight >= excluded.total_weight - 0.0001
        and excluded.completed_lessons >= excluded.total_lessons
      )
      then null
      else chapter_progress.completed_at
    end,
    updated_at = timezone('utc', now());
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_course_progress_for_user(p_user_id uuid, p_published_course_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  -- Course structure JSON object
  course_structure jsonb;

  -- Total vs completed counts
  course_total_blocks integer := 0;
  course_completed_blocks integer := 0;

  course_total_lessons integer := 0;
  course_completed_lessons integer := 0;

  course_total_chapters integer := 0;
  course_completed_chapters integer := 0;

  -- Weight-related tracking
  course_total_weight numeric := 0;
  course_completed_weight numeric := 0;

  course_total_lesson_weight numeric := 0;
  course_completed_lesson_weight numeric := 0;

  -- Flag for full course completion
  course_is_completed boolean := false;
begin
  -- ============================================================================
  -- STEP 1: Load course structure
  -- ============================================================================
  select course_structure_content 
  into course_structure
  from public.published_course_structure_content 
  where id = p_published_course_id;

  if course_structure is null then
    raise exception 'Course structure not found for published_course_id: %', p_published_course_id;
  end if;

  -- ============================================================================
  -- STEP 2: Compute progress metrics using CTEs
  -- ============================================================================

  with course_blocks as (
    -- Flatten all blocks with their respective lesson & chapter IDs and weights
    select 
      (chapter_obj->>'id')::uuid as chapter_id,
      (lesson_obj->>'id')::uuid as lesson_id,
      (block_obj->>'id')::uuid as block_id,
      coalesce((block_obj->>'weight')::numeric, 1.0) as block_weight
    from jsonb_array_elements(course_structure->'chapters') as chapter_obj,
         jsonb_array_elements(chapter_obj->'lessons') as lesson_obj,
         jsonb_array_elements(lesson_obj->'blocks') as block_obj
  ),

  lesson_weights as (
    -- Aggregate weights per lesson
    select 
      lesson_id,
      sum(block_weight) as lesson_weight
    from course_blocks
    group by lesson_id
  ),

  chapter_lesson_counts as (
    -- Count how many lessons are in each chapter
    select 
      chapter_id,
      count(distinct lesson_id) as lessons_in_chapter
    from course_blocks
    group by chapter_id
  ),

  course_stats as (
    -- Total course-wide stats
    select 
      count(*) as total_blocks,
      count(distinct lesson_id) as total_lessons,
      count(distinct chapter_id) as total_chapters,
      sum(block_weight) as total_weight
    from course_blocks
  ),

  user_block_progress as (
    -- User-specific completed blocks and weight
    select 
      count(*) filter (where bp.is_completed = true) as completed_blocks,
      coalesce(sum(cb.block_weight) filter (where bp.is_completed = true), 0) as completed_weight
    from course_blocks cb
    left join public.block_progress bp on (
      bp.user_id = p_user_id
      and bp.published_course_id = p_published_course_id
      and bp.block_id = cb.block_id
    )
  ),

  user_lesson_progress as (
    -- User-specific completed lessons and lesson weights
    select 
      count(*) filter (where lp.completed_at is not null) as completed_lessons,
      coalesce(sum(lw.lesson_weight) filter (where lp.completed_at is not null), 0) as completed_lesson_weight,
      sum(lw.lesson_weight) as total_lesson_weight
    from lesson_weights lw
    left join public.lesson_progress lp on (
      lp.user_id = p_user_id
      and lp.published_course_id = p_published_course_id
      and lp.lesson_id = lw.lesson_id
    )
  ),

  user_chapter_progress as (
    -- A chapter is completed if all its lessons are completed
    select count(*) as completed_chapters
    from (
      select 
        cb.chapter_id,
        clc.lessons_in_chapter,
        count(lp.id) filter (where lp.completed_at is not null) as completed_lessons_in_chapter
      from course_blocks cb
      inner join chapter_lesson_counts clc on clc.chapter_id = cb.chapter_id
      left join public.lesson_progress lp on (
        lp.user_id = p_user_id
        and lp.published_course_id = p_published_course_id
        and lp.lesson_id = cb.lesson_id
        and lp.completed_at is not null
      )
      group by cb.chapter_id, clc.lessons_in_chapter
      having count(lp.id) filter (where lp.completed_at is not null) = clc.lessons_in_chapter
    ) completed_chapters_subq
  )

  -- ============================================================================
  -- STEP 3: Store computed values into local variables
  -- ============================================================================
  select 
    cs.total_blocks,
    ubp.completed_blocks,
    cs.total_lessons,
    ulp.completed_lessons,
    cs.total_chapters,
    ucp.completed_chapters,
    cs.total_weight,
    least(ubp.completed_weight, cs.total_weight),
    ulp.total_lesson_weight,
    least(ulp.completed_lesson_weight, ulp.total_lesson_weight)
  into 
    course_total_blocks,
    course_completed_blocks,
    course_total_lessons,
    course_completed_lessons,
    course_total_chapters,
    course_completed_chapters,
    course_total_weight,
    course_completed_weight,
    course_total_lesson_weight,
    course_completed_lesson_weight
  from course_stats cs
  cross join user_block_progress ubp
  cross join user_lesson_progress ulp
  cross join user_chapter_progress ucp;

  -- ============================================================================
  -- STEP 4: Determine if course is fully completed
  -- ============================================================================
  course_is_completed := (
    course_total_weight > 0 and 
    course_completed_weight >= course_total_weight - 0.0001 and
    course_completed_lessons >= course_total_lessons and
    course_completed_chapters >= course_total_chapters and
    course_total_lessons > 0 and
    course_total_chapters > 0
  );

  -- ============================================================================
  -- STEP 5: Upsert progress into course_progress table
  -- ============================================================================
  insert into public.course_progress (
    user_id,
    published_course_id,
    total_blocks,
    completed_blocks,
    total_lessons,
    completed_lessons,
    total_chapters,
    completed_chapters,
    total_weight,
    completed_weight,
    total_lesson_weight,
    completed_lesson_weight,
    completed_at
  )
  values (
    p_user_id,
    p_published_course_id,
    course_total_blocks,
    course_completed_blocks,
    course_total_lessons,
    course_completed_lessons,
    course_total_chapters,
    course_completed_chapters,
    course_total_weight,
    course_completed_weight,
    course_total_lesson_weight,
    course_completed_lesson_weight,
    case when course_is_completed then timezone('utc', now()) else null end
  )
  on conflict (user_id, published_course_id)
  do update set
    total_blocks = excluded.total_blocks,
    completed_blocks = excluded.completed_blocks,
    total_lessons = excluded.total_lessons,
    completed_lessons = excluded.completed_lessons,
    total_chapters = excluded.total_chapters,
    completed_chapters = excluded.completed_chapters,
    total_weight = excluded.total_weight,
    completed_weight = excluded.completed_weight,
    total_lesson_weight = excluded.total_lesson_weight,
    completed_lesson_weight = excluded.completed_lesson_weight,
    -- Handle setting or unsetting completed_at
    completed_at = case 
      when excluded.completed_weight >= excluded.total_weight - 0.0001
        and excluded.total_weight > 0
        and excluded.completed_lessons >= excluded.total_lessons
        and excluded.completed_chapters >= excluded.total_chapters
        and course_progress.completed_at is null
      then timezone('utc', now())
      when not (
        excluded.completed_weight >= excluded.total_weight - 0.0001
        and excluded.completed_lessons >= excluded.total_lessons
        and excluded.completed_chapters >= excluded.total_chapters
      )
      then null
      else course_progress.completed_at
    end,
    updated_at = timezone('utc', now());
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_lesson_progress_for_user(p_user_id uuid, p_published_course_id uuid, p_lesson_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  course_structure jsonb;
  lesson_total_blocks integer := 0;
  lesson_completed_blocks integer := 0;
  lesson_total_weight numeric := 0;
  lesson_completed_weight numeric := 0;
  lesson_is_completed boolean := false;
  v_chapter_id uuid;
  v_chapter_progress_id uuid;
begin
  -- ============================================================================
  -- step 1: fetch the structure jsonb for the published course
  -- ============================================================================
  select course_structure_content
  into course_structure
  from public.published_course_structure_content
  where id = p_published_course_id;

  if course_structure is null then
    raise exception 'course structure not found for published_course_id: %', p_published_course_id;
  end if;

  -- Find the chapter_id for this lesson from the course structure
  select (chapter_obj->>'id')::uuid
  into v_chapter_id
  from jsonb_path_query(
    course_structure,
    '$.chapters[*] ? (@.lessons[*].id == $lesson_id)',
    jsonb_build_object('lesson_id', p_lesson_id::text)
  ) as chapter_obj
  limit 1;

  if v_chapter_id is null then
    raise exception 'Could not find chapter for lesson_id: %', p_lesson_id;
  end if;

  -- Find the chapter_progress_id for this user, course, and chapter
  select id
  into v_chapter_progress_id
  from public.chapter_progress
  where user_id = p_user_id
    and published_course_id = p_published_course_id
    and chapter_id = v_chapter_id;

  if v_chapter_progress_id is null then
    raise exception 'Could not find chapter_progress for user: %, course: %, lesson: %, chapter: %', p_user_id, p_published_course_id, p_lesson_id, v_chapter_id;
  end if;

  -- ============================================================================
  -- step 2: extract block ids and weights from the jsonb structure for the lesson
  -- ============================================================================
  with lesson_blocks as (
    select 
      (block_obj->>'id')::uuid as block_id,
      coalesce((block_obj->>'weight')::numeric, 1.0) as block_weight
    from jsonb_path_query(
      course_structure,
      '$.chapters[*].lessons[*] ? (@.id == $lesson_id)',
      jsonb_build_object('lesson_id', p_lesson_id::text)
    ) as lesson_obj,
    jsonb_array_elements(lesson_obj->'blocks') as block_obj
  ),

  -- ============================================================================
  -- step 3: calculate total/completed blocks and weights
  -- ============================================================================
  lesson_stats as (
    select
      count(*) as total_blocks,
      sum(lb.block_weight) as total_weight,
      count(bp.id) filter (where bp.is_completed = true) as completed_blocks,
      coalesce(sum(lb.block_weight) filter (where bp.is_completed = true), 0) as completed_weight
    from lesson_blocks lb
    left join public.block_progress bp on (
      bp.user_id = p_user_id
      and bp.published_course_id = p_published_course_id
      and bp.block_id = lb.block_id
    )
  )

  -- ============================================================================
  -- step 4: assign values from stats to variables
  -- ============================================================================
  select 
    ls.total_blocks,
    ls.completed_blocks,
    ls.total_weight,
    least(ls.completed_weight, ls.total_weight) as completed_weight  -- avoid over-counting
  into 
    lesson_total_blocks,
    lesson_completed_blocks,
    lesson_total_weight,
    lesson_completed_weight
  from lesson_stats ls;

  -- ============================================================================
  -- step 5: determine if lesson is completed (based on total weight)
  -- ============================================================================
  lesson_is_completed := (
    lesson_total_weight > 0 and 
    lesson_completed_weight >= lesson_total_weight - 0.0001
  );

  -- ============================================================================
  -- step 6: upsert lesson_progress row for the user
  -- ============================================================================
  insert into public.lesson_progress (
    chapter_progress_id,
    user_id, 
    published_course_id, 
    lesson_id,
    total_blocks,
    completed_blocks,
    total_weight,
    completed_weight,
    is_completed,
    completed_at
  )
  values (
    v_chapter_progress_id,
    p_user_id,
    p_published_course_id,
    p_lesson_id,
    lesson_total_blocks,
    lesson_completed_blocks,
    lesson_total_weight,
    lesson_completed_weight,
    lesson_is_completed,
    case when lesson_is_completed then timezone('utc', now()) else null end
  )
  on conflict (user_id, published_course_id, lesson_id)
  do update set
    chapter_progress_id = excluded.chapter_progress_id,
    total_blocks     = excluded.total_blocks,
    completed_blocks = excluded.completed_blocks,
    total_weight     = excluded.total_weight,
    completed_weight = excluded.completed_weight,
    is_completed     = excluded.is_completed,
    completed_at = case 
      when excluded.is_completed and lesson_progress.completed_at is null
      then timezone('utc', now())
      when not excluded.is_completed
      then null
      else lesson_progress.completed_at
    end,
    updated_at = timezone('utc', now());

end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  new.updated_at = timezone('utc', clock_timestamp());
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_wallet_balance()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  -- Variables for balance validation
  v_current_total numeric(19,4);
  v_current_reserved numeric(19,4);
  v_wallet_owner text;
  v_is_reserved_transaction boolean;
begin
  -- Only process completed transactions
  if new.status != 'completed' then
    return new;
  end if;

  -- Determine if this transaction affects reserved balance
  -- Reserved transactions: funds_hold, funds_release, reward_payout
  v_is_reserved_transaction := new.type in ('funds_hold', 'funds_release', 'reward_payout');

  -- ===========================================================
  -- PROCESS DESTINATION WALLET (CREDITS)
  -- ===========================================================
  if new.destination_wallet_type != 'external' and new.destination_wallet_id is not null then
    
    if v_is_reserved_transaction then
      -- Credit to balance_reserved
      case new.destination_wallet_type
        when 'platform' then
          update public.gonasi_wallets
          set balance_reserved = balance_reserved + new.amount,
              updated_at = timezone('utc', now())
          where id = new.destination_wallet_id;
          
          if not found then
            raise exception 'Platform wallet % not found', new.destination_wallet_id;
          end if;

        when 'organization' then
          update public.organization_wallets
          set balance_reserved = balance_reserved + new.amount,
              updated_at = timezone('utc', now())
          where id = new.destination_wallet_id;
          
          if not found then
            raise exception 'Organization wallet % not found', new.destination_wallet_id;
          end if;

        when 'user' then
          update public.user_wallets
          set balance_reserved = balance_reserved + new.amount,
              updated_at = timezone('utc', now())
          where id = new.destination_wallet_id;
          
          if not found then
            raise exception 'User wallet % not found', new.destination_wallet_id;
          end if;
      end case;

    else
      -- Credit to balance_total (includes course_purchase, payment_inflow, platform_revenue, etc.)
      case new.destination_wallet_type
        when 'platform' then
          update public.gonasi_wallets
          set balance_total = balance_total + new.amount,
              updated_at = timezone('utc', now())
          where id = new.destination_wallet_id;
          
          if not found then
            raise exception 'Platform wallet % not found', new.destination_wallet_id;
          end if;

        when 'organization' then
          update public.organization_wallets
          set balance_total = balance_total + new.amount,
              updated_at = timezone('utc', now())
          where id = new.destination_wallet_id;
          
          if not found then
            raise exception 'Organization wallet % not found', new.destination_wallet_id;
          end if;

        when 'user' then
          update public.user_wallets
          set balance_total = balance_total + new.amount,
              updated_at = timezone('utc', now())
          where id = new.destination_wallet_id;
          
          if not found then
            raise exception 'User wallet % not found', new.destination_wallet_id;
          end if;
      end case;
    end if;
  end if;

  -- ===========================================================
  -- PROCESS SOURCE WALLET (DEBITS)
  -- ===========================================================
  if new.source_wallet_type != 'external' and new.source_wallet_id is not null then
    
    if v_is_reserved_transaction then
      -- Debit from balance_reserved (with validation)
      case new.source_wallet_type
        when 'platform' then
          -- Check sufficient reserved balance
          select balance_reserved, 'platform-' || currency_code::text
          into v_current_reserved, v_wallet_owner
          from public.gonasi_wallets
          where id = new.source_wallet_id;
          
          if not found then
            raise exception 'Platform wallet % not found', new.source_wallet_id;
          end if;
          
          if v_current_reserved < new.amount then
            raise exception 'Insufficient reserved balance in % wallet. Required: %, Available: %',
              v_wallet_owner, new.amount, v_current_reserved;
          end if;
          
          update public.gonasi_wallets
          set balance_reserved = balance_reserved - new.amount,
              updated_at = timezone('utc', now())
          where id = new.source_wallet_id;

        when 'organization' then
          -- Check sufficient reserved balance
          select balance_reserved, 'org-' || organization_id::text
          into v_current_reserved, v_wallet_owner
          from public.organization_wallets
          where id = new.source_wallet_id;
          
          if not found then
            raise exception 'Organization wallet % not found', new.source_wallet_id;
          end if;
          
          if v_current_reserved < new.amount then
            raise exception 'Insufficient reserved balance in % wallet. Required: %, Available: %',
              v_wallet_owner, new.amount, v_current_reserved;
          end if;
          
          update public.organization_wallets
          set balance_reserved = balance_reserved - new.amount,
              updated_at = timezone('utc', now())
          where id = new.source_wallet_id;

        when 'user' then
          -- Check sufficient reserved balance
          select balance_reserved, 'user-' || user_id::text
          into v_current_reserved, v_wallet_owner
          from public.user_wallets
          where id = new.source_wallet_id;
          
          if not found then
            raise exception 'User wallet % not found', new.source_wallet_id;
          end if;
          
          if v_current_reserved < new.amount then
            raise exception 'Insufficient reserved balance in % wallet. Required: %, Available: %',
              v_wallet_owner, new.amount, v_current_reserved;
          end if;
          
          update public.user_wallets
          set balance_reserved = balance_reserved - new.amount,
              updated_at = timezone('utc', now())
          where id = new.source_wallet_id;
      end case;

    else
      -- Debit from balance_total (with validation)
      -- Includes: platform_revenue, payment_gateway_fee, org_payout, withdrawal_complete, etc.
      case new.source_wallet_type
        when 'platform' then
          -- Check sufficient total balance
          select balance_total, 'platform-' || currency_code::text
          into v_current_total, v_wallet_owner
          from public.gonasi_wallets
          where id = new.source_wallet_id;
          
          if not found then
            raise exception 'Platform wallet % not found', new.source_wallet_id;
          end if;
          
          if v_current_total < new.amount then
            raise exception 'Insufficient balance in % wallet. Required: %, Available: %',
              v_wallet_owner, new.amount, v_current_total;
          end if;
          
          update public.gonasi_wallets
          set balance_total = balance_total - new.amount,
              updated_at = timezone('utc', now())
          where id = new.source_wallet_id;

        when 'organization' then
          -- Check sufficient total balance
          select balance_total, 'org-' || organization_id::text
          into v_current_total, v_wallet_owner
          from public.organization_wallets
          where id = new.source_wallet_id;
          
          if not found then
            raise exception 'Organization wallet % not found', new.source_wallet_id;
          end if;
          
          if v_current_total < new.amount then
            raise exception 'Insufficient balance in % wallet. Required: %, Available: %',
              v_wallet_owner, new.amount, v_current_total;
          end if;
          
          update public.organization_wallets
          set balance_total = balance_total - new.amount,
              updated_at = timezone('utc', now())
          where id = new.source_wallet_id;

        when 'user' then
          -- Check sufficient total balance
          select balance_total, 'user-' || user_id::text
          into v_current_total, v_wallet_owner
          from public.user_wallets
          where id = new.source_wallet_id;
          
          if not found then
            raise exception 'User wallet % not found', new.source_wallet_id;
          end if;
          
          if v_current_total < new.amount then
            raise exception 'Insufficient balance in % wallet. Required: %, Available: %',
              v_wallet_owner, new.amount, v_current_total;
          end if;
          
          update public.user_wallets
          set balance_total = balance_total - new.amount,
              updated_at = timezone('utc', now())
          where id = new.source_wallet_id;
      end case;
    end if;
  end if;

  return new;
exception
  when others then
    -- Re-raise with context for debugging
    raise exception 'Wallet balance update failed for ledger entry % (type: %): %', 
      new.id, new.type, sqlerrm;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.upsert_published_course_with_content(course_data jsonb, structure_content jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  course_uuid uuid;
  org_id uuid;
begin
  -- Extract IDs
  course_uuid := (course_data->>'id')::uuid;
  if course_uuid is null then
    raise exception 'course_data must contain a valid id field';
  end if;

  org_id := (course_data->>'organization_id')::uuid;

  -- Permission check using helper function
  if not public.can_publish_course(course_uuid, org_id, auth.uid()) then
    raise exception 'You do not have permission to publish this course';
  end if;

  -- Upsert into published_courses
  insert into public.published_courses (
    id, organization_id, category_id, subcategory_id, is_active,
    name, description, image_url, blur_hash, visibility,
    course_structure_overview, total_chapters, total_lessons, total_blocks,
    pricing_tiers, has_free_tier, min_price, total_enrollments,
    active_enrollments, completion_rate, average_rating, total_reviews,
    published_by, published_at
  )
  values (
    course_uuid, org_id,
    (course_data->>'category_id')::uuid,
    (course_data->>'subcategory_id')::uuid,
    (course_data->>'is_active')::boolean,
    course_data->>'name', course_data->>'description',
    course_data->>'image_url', course_data->>'blur_hash',
    (course_data->>'visibility')::public.course_access,
    course_data->'course_structure_overview',
    (course_data->>'total_chapters')::integer,
    (course_data->>'total_lessons')::integer,
    (course_data->>'total_blocks')::integer,
    course_data->'pricing_tiers',
    (course_data->>'has_free_tier')::boolean,
    (course_data->>'min_price')::numeric,
    (course_data->>'total_enrollments')::integer,
    (course_data->>'active_enrollments')::integer,
    (course_data->>'completion_rate')::numeric,
    (course_data->>'average_rating')::numeric,
    (course_data->>'total_reviews')::integer,
    (course_data->>'published_by')::uuid,
    (course_data->>'published_at')::timestamptz
  )
  on conflict (id) do update set
    organization_id = excluded.organization_id,
    category_id = excluded.category_id,
    subcategory_id = excluded.subcategory_id,
    is_active = excluded.is_active,
    name = excluded.name,
    description = excluded.description,
    image_url = excluded.image_url,
    blur_hash = excluded.blur_hash,
    visibility = excluded.visibility,
    course_structure_overview = excluded.course_structure_overview,
    total_chapters = excluded.total_chapters,
    total_lessons = excluded.total_lessons,
    total_blocks = excluded.total_blocks,
    pricing_tiers = excluded.pricing_tiers,
    has_free_tier = excluded.has_free_tier,
    min_price = excluded.min_price,
    total_enrollments = excluded.total_enrollments,
    active_enrollments = excluded.active_enrollments,
    completion_rate = excluded.completion_rate,
    average_rating = excluded.average_rating,
    total_reviews = excluded.total_reviews,
    published_by = excluded.published_by,
    published_at = excluded.published_at,
    updated_at = timezone('utc', now());

  -- Upsert into published_course_structure_content
  insert into public.published_course_structure_content (
    id, course_structure_content
  )
  values (
    course_uuid, structure_content
  )
  on conflict (id) do update set
    course_structure_content = excluded.course_structure_content,
    updated_at = timezone('utc', now());

  -- Enqueue progress deletion
  perform public.enqueue_delete_course_progress(course_uuid);

  raise notice 'Course % published and progress reset queued', course_uuid;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.user_has_active_access(p_user_id uuid, p_published_course_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
declare
  enrollment_expires_at timestamptz;
  now_utc timestamptz := timezone('utc', now());
begin
  -- Validate input parameters
  if p_user_id is null or p_published_course_id is null then
    return false;
  end if;

  -- Get the expiration date of the active enrollment
  select expires_at
    into enrollment_expires_at
  from public.course_enrollments
  where user_id = p_user_id
    and published_course_id = p_published_course_id
    and is_active = true
  limit 1;

  -- If no active enrollment found, return false
  if not found then
    return false;
  end if;

  -- Return true if enrollment never expires OR hasn't expired yet
  return enrollment_expires_at is null or enrollment_expires_at > now_utc;

exception
  when others then
    -- Log the error and return false for safety
    raise notice 'Error in user_has_active_access for user % and course %: %', 
      p_user_id, p_published_course_id, SQLERRM;
    return false;
end;
$function$
;

create or replace view "public"."v_organizations_ai_available_credits" as  SELECT organizations_ai_credits.org_id,
    (organizations_ai_credits.base_credits_remaining + organizations_ai_credits.purchased_credits_remaining) AS total_available_credits,
    organizations_ai_credits.base_credits_remaining,
    organizations_ai_credits.purchased_credits_remaining,
    organizations_ai_credits.last_reset_at,
    organizations_ai_credits.next_reset_at
   FROM public.organizations_ai_credits;


CREATE OR REPLACE FUNCTION public.validate_subcategory_belongs_to_category()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  if NEW.category_id is not null
    and NEW.subcategory_id is not null then

    -- Check if the subcategory belongs to the declared category
    if not exists (
      select 1
      from public.course_sub_categories
      where id = NEW.subcategory_id
        and category_id = NEW.category_id
    ) then
      raise exception
        'Subcategory % does not belong to category %',
        NEW.subcategory_id,
        NEW.category_id;
    end if;

  end if;

  return NEW;
end;
$function$
;

grant delete on table "public"."ai_usage_log" to "anon";

grant insert on table "public"."ai_usage_log" to "anon";

grant references on table "public"."ai_usage_log" to "anon";

grant select on table "public"."ai_usage_log" to "anon";

grant trigger on table "public"."ai_usage_log" to "anon";

grant truncate on table "public"."ai_usage_log" to "anon";

grant update on table "public"."ai_usage_log" to "anon";

grant delete on table "public"."ai_usage_log" to "authenticated";

grant insert on table "public"."ai_usage_log" to "authenticated";

grant references on table "public"."ai_usage_log" to "authenticated";

grant select on table "public"."ai_usage_log" to "authenticated";

grant trigger on table "public"."ai_usage_log" to "authenticated";

grant truncate on table "public"."ai_usage_log" to "authenticated";

grant update on table "public"."ai_usage_log" to "authenticated";

grant delete on table "public"."ai_usage_log" to "service_role";

grant insert on table "public"."ai_usage_log" to "service_role";

grant references on table "public"."ai_usage_log" to "service_role";

grant select on table "public"."ai_usage_log" to "service_role";

grant trigger on table "public"."ai_usage_log" to "service_role";

grant truncate on table "public"."ai_usage_log" to "service_role";

grant update on table "public"."ai_usage_log" to "service_role";

grant delete on table "public"."block_progress" to "anon";

grant insert on table "public"."block_progress" to "anon";

grant references on table "public"."block_progress" to "anon";

grant select on table "public"."block_progress" to "anon";

grant trigger on table "public"."block_progress" to "anon";

grant truncate on table "public"."block_progress" to "anon";

grant update on table "public"."block_progress" to "anon";

grant delete on table "public"."block_progress" to "authenticated";

grant insert on table "public"."block_progress" to "authenticated";

grant references on table "public"."block_progress" to "authenticated";

grant select on table "public"."block_progress" to "authenticated";

grant trigger on table "public"."block_progress" to "authenticated";

grant truncate on table "public"."block_progress" to "authenticated";

grant update on table "public"."block_progress" to "authenticated";

grant delete on table "public"."block_progress" to "service_role";

grant insert on table "public"."block_progress" to "service_role";

grant references on table "public"."block_progress" to "service_role";

grant select on table "public"."block_progress" to "service_role";

grant trigger on table "public"."block_progress" to "service_role";

grant truncate on table "public"."block_progress" to "service_role";

grant update on table "public"."block_progress" to "service_role";

grant delete on table "public"."chapter_progress" to "anon";

grant insert on table "public"."chapter_progress" to "anon";

grant references on table "public"."chapter_progress" to "anon";

grant select on table "public"."chapter_progress" to "anon";

grant trigger on table "public"."chapter_progress" to "anon";

grant truncate on table "public"."chapter_progress" to "anon";

grant update on table "public"."chapter_progress" to "anon";

grant delete on table "public"."chapter_progress" to "authenticated";

grant insert on table "public"."chapter_progress" to "authenticated";

grant references on table "public"."chapter_progress" to "authenticated";

grant select on table "public"."chapter_progress" to "authenticated";

grant trigger on table "public"."chapter_progress" to "authenticated";

grant truncate on table "public"."chapter_progress" to "authenticated";

grant update on table "public"."chapter_progress" to "authenticated";

grant delete on table "public"."chapter_progress" to "service_role";

grant insert on table "public"."chapter_progress" to "service_role";

grant references on table "public"."chapter_progress" to "service_role";

grant select on table "public"."chapter_progress" to "service_role";

grant trigger on table "public"."chapter_progress" to "service_role";

grant truncate on table "public"."chapter_progress" to "service_role";

grant update on table "public"."chapter_progress" to "service_role";

grant delete on table "public"."chapters" to "anon";

grant insert on table "public"."chapters" to "anon";

grant references on table "public"."chapters" to "anon";

grant select on table "public"."chapters" to "anon";

grant trigger on table "public"."chapters" to "anon";

grant truncate on table "public"."chapters" to "anon";

grant update on table "public"."chapters" to "anon";

grant delete on table "public"."chapters" to "authenticated";

grant insert on table "public"."chapters" to "authenticated";

grant references on table "public"."chapters" to "authenticated";

grant select on table "public"."chapters" to "authenticated";

grant trigger on table "public"."chapters" to "authenticated";

grant truncate on table "public"."chapters" to "authenticated";

grant update on table "public"."chapters" to "authenticated";

grant delete on table "public"."chapters" to "service_role";

grant insert on table "public"."chapters" to "service_role";

grant references on table "public"."chapters" to "service_role";

grant select on table "public"."chapters" to "service_role";

grant trigger on table "public"."chapters" to "service_role";

grant truncate on table "public"."chapters" to "service_role";

grant update on table "public"."chapters" to "service_role";

grant delete on table "public"."course_categories" to "anon";

grant insert on table "public"."course_categories" to "anon";

grant references on table "public"."course_categories" to "anon";

grant select on table "public"."course_categories" to "anon";

grant trigger on table "public"."course_categories" to "anon";

grant truncate on table "public"."course_categories" to "anon";

grant update on table "public"."course_categories" to "anon";

grant delete on table "public"."course_categories" to "authenticated";

grant insert on table "public"."course_categories" to "authenticated";

grant references on table "public"."course_categories" to "authenticated";

grant select on table "public"."course_categories" to "authenticated";

grant trigger on table "public"."course_categories" to "authenticated";

grant truncate on table "public"."course_categories" to "authenticated";

grant update on table "public"."course_categories" to "authenticated";

grant delete on table "public"."course_categories" to "service_role";

grant insert on table "public"."course_categories" to "service_role";

grant references on table "public"."course_categories" to "service_role";

grant select on table "public"."course_categories" to "service_role";

grant trigger on table "public"."course_categories" to "service_role";

grant truncate on table "public"."course_categories" to "service_role";

grant update on table "public"."course_categories" to "service_role";

grant delete on table "public"."course_editors" to "anon";

grant insert on table "public"."course_editors" to "anon";

grant references on table "public"."course_editors" to "anon";

grant select on table "public"."course_editors" to "anon";

grant trigger on table "public"."course_editors" to "anon";

grant truncate on table "public"."course_editors" to "anon";

grant update on table "public"."course_editors" to "anon";

grant delete on table "public"."course_editors" to "authenticated";

grant insert on table "public"."course_editors" to "authenticated";

grant references on table "public"."course_editors" to "authenticated";

grant select on table "public"."course_editors" to "authenticated";

grant trigger on table "public"."course_editors" to "authenticated";

grant truncate on table "public"."course_editors" to "authenticated";

grant update on table "public"."course_editors" to "authenticated";

grant delete on table "public"."course_editors" to "service_role";

grant insert on table "public"."course_editors" to "service_role";

grant references on table "public"."course_editors" to "service_role";

grant select on table "public"."course_editors" to "service_role";

grant trigger on table "public"."course_editors" to "service_role";

grant truncate on table "public"."course_editors" to "service_role";

grant update on table "public"."course_editors" to "service_role";

grant delete on table "public"."course_enrollment_activities" to "anon";

grant insert on table "public"."course_enrollment_activities" to "anon";

grant references on table "public"."course_enrollment_activities" to "anon";

grant select on table "public"."course_enrollment_activities" to "anon";

grant trigger on table "public"."course_enrollment_activities" to "anon";

grant truncate on table "public"."course_enrollment_activities" to "anon";

grant update on table "public"."course_enrollment_activities" to "anon";

grant delete on table "public"."course_enrollment_activities" to "authenticated";

grant insert on table "public"."course_enrollment_activities" to "authenticated";

grant references on table "public"."course_enrollment_activities" to "authenticated";

grant select on table "public"."course_enrollment_activities" to "authenticated";

grant trigger on table "public"."course_enrollment_activities" to "authenticated";

grant truncate on table "public"."course_enrollment_activities" to "authenticated";

grant update on table "public"."course_enrollment_activities" to "authenticated";

grant delete on table "public"."course_enrollment_activities" to "service_role";

grant insert on table "public"."course_enrollment_activities" to "service_role";

grant references on table "public"."course_enrollment_activities" to "service_role";

grant select on table "public"."course_enrollment_activities" to "service_role";

grant trigger on table "public"."course_enrollment_activities" to "service_role";

grant truncate on table "public"."course_enrollment_activities" to "service_role";

grant update on table "public"."course_enrollment_activities" to "service_role";

grant delete on table "public"."course_enrollments" to "anon";

grant insert on table "public"."course_enrollments" to "anon";

grant references on table "public"."course_enrollments" to "anon";

grant select on table "public"."course_enrollments" to "anon";

grant trigger on table "public"."course_enrollments" to "anon";

grant truncate on table "public"."course_enrollments" to "anon";

grant update on table "public"."course_enrollments" to "anon";

grant delete on table "public"."course_enrollments" to "authenticated";

grant insert on table "public"."course_enrollments" to "authenticated";

grant references on table "public"."course_enrollments" to "authenticated";

grant select on table "public"."course_enrollments" to "authenticated";

grant trigger on table "public"."course_enrollments" to "authenticated";

grant truncate on table "public"."course_enrollments" to "authenticated";

grant update on table "public"."course_enrollments" to "authenticated";

grant delete on table "public"."course_enrollments" to "service_role";

grant insert on table "public"."course_enrollments" to "service_role";

grant references on table "public"."course_enrollments" to "service_role";

grant select on table "public"."course_enrollments" to "service_role";

grant trigger on table "public"."course_enrollments" to "service_role";

grant truncate on table "public"."course_enrollments" to "service_role";

grant update on table "public"."course_enrollments" to "service_role";

grant delete on table "public"."course_payments" to "anon";

grant insert on table "public"."course_payments" to "anon";

grant references on table "public"."course_payments" to "anon";

grant select on table "public"."course_payments" to "anon";

grant trigger on table "public"."course_payments" to "anon";

grant truncate on table "public"."course_payments" to "anon";

grant update on table "public"."course_payments" to "anon";

grant delete on table "public"."course_payments" to "authenticated";

grant insert on table "public"."course_payments" to "authenticated";

grant references on table "public"."course_payments" to "authenticated";

grant select on table "public"."course_payments" to "authenticated";

grant trigger on table "public"."course_payments" to "authenticated";

grant truncate on table "public"."course_payments" to "authenticated";

grant update on table "public"."course_payments" to "authenticated";

grant delete on table "public"."course_payments" to "service_role";

grant insert on table "public"."course_payments" to "service_role";

grant references on table "public"."course_payments" to "service_role";

grant select on table "public"."course_payments" to "service_role";

grant trigger on table "public"."course_payments" to "service_role";

grant truncate on table "public"."course_payments" to "service_role";

grant update on table "public"."course_payments" to "service_role";

grant delete on table "public"."course_pricing_tiers" to "anon";

grant insert on table "public"."course_pricing_tiers" to "anon";

grant references on table "public"."course_pricing_tiers" to "anon";

grant select on table "public"."course_pricing_tiers" to "anon";

grant trigger on table "public"."course_pricing_tiers" to "anon";

grant truncate on table "public"."course_pricing_tiers" to "anon";

grant update on table "public"."course_pricing_tiers" to "anon";

grant delete on table "public"."course_pricing_tiers" to "authenticated";

grant insert on table "public"."course_pricing_tiers" to "authenticated";

grant references on table "public"."course_pricing_tiers" to "authenticated";

grant select on table "public"."course_pricing_tiers" to "authenticated";

grant trigger on table "public"."course_pricing_tiers" to "authenticated";

grant truncate on table "public"."course_pricing_tiers" to "authenticated";

grant update on table "public"."course_pricing_tiers" to "authenticated";

grant delete on table "public"."course_pricing_tiers" to "service_role";

grant insert on table "public"."course_pricing_tiers" to "service_role";

grant references on table "public"."course_pricing_tiers" to "service_role";

grant select on table "public"."course_pricing_tiers" to "service_role";

grant trigger on table "public"."course_pricing_tiers" to "service_role";

grant truncate on table "public"."course_pricing_tiers" to "service_role";

grant update on table "public"."course_pricing_tiers" to "service_role";

grant delete on table "public"."course_progress" to "anon";

grant insert on table "public"."course_progress" to "anon";

grant references on table "public"."course_progress" to "anon";

grant select on table "public"."course_progress" to "anon";

grant trigger on table "public"."course_progress" to "anon";

grant truncate on table "public"."course_progress" to "anon";

grant update on table "public"."course_progress" to "anon";

grant delete on table "public"."course_progress" to "authenticated";

grant insert on table "public"."course_progress" to "authenticated";

grant references on table "public"."course_progress" to "authenticated";

grant select on table "public"."course_progress" to "authenticated";

grant trigger on table "public"."course_progress" to "authenticated";

grant truncate on table "public"."course_progress" to "authenticated";

grant update on table "public"."course_progress" to "authenticated";

grant delete on table "public"."course_progress" to "service_role";

grant insert on table "public"."course_progress" to "service_role";

grant references on table "public"."course_progress" to "service_role";

grant select on table "public"."course_progress" to "service_role";

grant trigger on table "public"."course_progress" to "service_role";

grant truncate on table "public"."course_progress" to "service_role";

grant update on table "public"."course_progress" to "service_role";

grant delete on table "public"."course_sub_categories" to "anon";

grant insert on table "public"."course_sub_categories" to "anon";

grant references on table "public"."course_sub_categories" to "anon";

grant select on table "public"."course_sub_categories" to "anon";

grant trigger on table "public"."course_sub_categories" to "anon";

grant truncate on table "public"."course_sub_categories" to "anon";

grant update on table "public"."course_sub_categories" to "anon";

grant delete on table "public"."course_sub_categories" to "authenticated";

grant insert on table "public"."course_sub_categories" to "authenticated";

grant references on table "public"."course_sub_categories" to "authenticated";

grant select on table "public"."course_sub_categories" to "authenticated";

grant trigger on table "public"."course_sub_categories" to "authenticated";

grant truncate on table "public"."course_sub_categories" to "authenticated";

grant update on table "public"."course_sub_categories" to "authenticated";

grant delete on table "public"."course_sub_categories" to "service_role";

grant insert on table "public"."course_sub_categories" to "service_role";

grant references on table "public"."course_sub_categories" to "service_role";

grant select on table "public"."course_sub_categories" to "service_role";

grant trigger on table "public"."course_sub_categories" to "service_role";

grant truncate on table "public"."course_sub_categories" to "service_role";

grant update on table "public"."course_sub_categories" to "service_role";

grant delete on table "public"."courses" to "anon";

grant insert on table "public"."courses" to "anon";

grant references on table "public"."courses" to "anon";

grant select on table "public"."courses" to "anon";

grant trigger on table "public"."courses" to "anon";

grant truncate on table "public"."courses" to "anon";

grant update on table "public"."courses" to "anon";

grant delete on table "public"."courses" to "authenticated";

grant insert on table "public"."courses" to "authenticated";

grant references on table "public"."courses" to "authenticated";

grant select on table "public"."courses" to "authenticated";

grant trigger on table "public"."courses" to "authenticated";

grant truncate on table "public"."courses" to "authenticated";

grant update on table "public"."courses" to "authenticated";

grant delete on table "public"."courses" to "service_role";

grant insert on table "public"."courses" to "service_role";

grant references on table "public"."courses" to "service_role";

grant select on table "public"."courses" to "service_role";

grant trigger on table "public"."courses" to "service_role";

grant truncate on table "public"."courses" to "service_role";

grant update on table "public"."courses" to "service_role";

grant delete on table "public"."file_library" to "anon";

grant insert on table "public"."file_library" to "anon";

grant references on table "public"."file_library" to "anon";

grant select on table "public"."file_library" to "anon";

grant trigger on table "public"."file_library" to "anon";

grant truncate on table "public"."file_library" to "anon";

grant update on table "public"."file_library" to "anon";

grant delete on table "public"."file_library" to "authenticated";

grant insert on table "public"."file_library" to "authenticated";

grant references on table "public"."file_library" to "authenticated";

grant select on table "public"."file_library" to "authenticated";

grant trigger on table "public"."file_library" to "authenticated";

grant truncate on table "public"."file_library" to "authenticated";

grant update on table "public"."file_library" to "authenticated";

grant delete on table "public"."file_library" to "service_role";

grant insert on table "public"."file_library" to "service_role";

grant references on table "public"."file_library" to "service_role";

grant select on table "public"."file_library" to "service_role";

grant trigger on table "public"."file_library" to "service_role";

grant truncate on table "public"."file_library" to "service_role";

grant update on table "public"."file_library" to "service_role";

grant delete on table "public"."gonasi_wallets" to "anon";

grant insert on table "public"."gonasi_wallets" to "anon";

grant references on table "public"."gonasi_wallets" to "anon";

grant select on table "public"."gonasi_wallets" to "anon";

grant trigger on table "public"."gonasi_wallets" to "anon";

grant truncate on table "public"."gonasi_wallets" to "anon";

grant update on table "public"."gonasi_wallets" to "anon";

grant delete on table "public"."gonasi_wallets" to "authenticated";

grant insert on table "public"."gonasi_wallets" to "authenticated";

grant references on table "public"."gonasi_wallets" to "authenticated";

grant select on table "public"."gonasi_wallets" to "authenticated";

grant trigger on table "public"."gonasi_wallets" to "authenticated";

grant truncate on table "public"."gonasi_wallets" to "authenticated";

grant update on table "public"."gonasi_wallets" to "authenticated";

grant delete on table "public"."gonasi_wallets" to "service_role";

grant insert on table "public"."gonasi_wallets" to "service_role";

grant references on table "public"."gonasi_wallets" to "service_role";

grant select on table "public"."gonasi_wallets" to "service_role";

grant trigger on table "public"."gonasi_wallets" to "service_role";

grant truncate on table "public"."gonasi_wallets" to "service_role";

grant update on table "public"."gonasi_wallets" to "service_role";

grant delete on table "public"."lesson_blocks" to "anon";

grant insert on table "public"."lesson_blocks" to "anon";

grant references on table "public"."lesson_blocks" to "anon";

grant select on table "public"."lesson_blocks" to "anon";

grant trigger on table "public"."lesson_blocks" to "anon";

grant truncate on table "public"."lesson_blocks" to "anon";

grant update on table "public"."lesson_blocks" to "anon";

grant delete on table "public"."lesson_blocks" to "authenticated";

grant insert on table "public"."lesson_blocks" to "authenticated";

grant references on table "public"."lesson_blocks" to "authenticated";

grant select on table "public"."lesson_blocks" to "authenticated";

grant trigger on table "public"."lesson_blocks" to "authenticated";

grant truncate on table "public"."lesson_blocks" to "authenticated";

grant update on table "public"."lesson_blocks" to "authenticated";

grant delete on table "public"."lesson_blocks" to "service_role";

grant insert on table "public"."lesson_blocks" to "service_role";

grant references on table "public"."lesson_blocks" to "service_role";

grant select on table "public"."lesson_blocks" to "service_role";

grant trigger on table "public"."lesson_blocks" to "service_role";

grant truncate on table "public"."lesson_blocks" to "service_role";

grant update on table "public"."lesson_blocks" to "service_role";

grant delete on table "public"."lesson_progress" to "anon";

grant insert on table "public"."lesson_progress" to "anon";

grant references on table "public"."lesson_progress" to "anon";

grant select on table "public"."lesson_progress" to "anon";

grant trigger on table "public"."lesson_progress" to "anon";

grant truncate on table "public"."lesson_progress" to "anon";

grant update on table "public"."lesson_progress" to "anon";

grant delete on table "public"."lesson_progress" to "authenticated";

grant insert on table "public"."lesson_progress" to "authenticated";

grant references on table "public"."lesson_progress" to "authenticated";

grant select on table "public"."lesson_progress" to "authenticated";

grant trigger on table "public"."lesson_progress" to "authenticated";

grant truncate on table "public"."lesson_progress" to "authenticated";

grant update on table "public"."lesson_progress" to "authenticated";

grant delete on table "public"."lesson_progress" to "service_role";

grant insert on table "public"."lesson_progress" to "service_role";

grant references on table "public"."lesson_progress" to "service_role";

grant select on table "public"."lesson_progress" to "service_role";

grant trigger on table "public"."lesson_progress" to "service_role";

grant truncate on table "public"."lesson_progress" to "service_role";

grant update on table "public"."lesson_progress" to "service_role";

grant delete on table "public"."lesson_reset_count" to "anon";

grant insert on table "public"."lesson_reset_count" to "anon";

grant references on table "public"."lesson_reset_count" to "anon";

grant select on table "public"."lesson_reset_count" to "anon";

grant trigger on table "public"."lesson_reset_count" to "anon";

grant truncate on table "public"."lesson_reset_count" to "anon";

grant update on table "public"."lesson_reset_count" to "anon";

grant delete on table "public"."lesson_reset_count" to "authenticated";

grant insert on table "public"."lesson_reset_count" to "authenticated";

grant references on table "public"."lesson_reset_count" to "authenticated";

grant select on table "public"."lesson_reset_count" to "authenticated";

grant trigger on table "public"."lesson_reset_count" to "authenticated";

grant truncate on table "public"."lesson_reset_count" to "authenticated";

grant update on table "public"."lesson_reset_count" to "authenticated";

grant delete on table "public"."lesson_reset_count" to "service_role";

grant insert on table "public"."lesson_reset_count" to "service_role";

grant references on table "public"."lesson_reset_count" to "service_role";

grant select on table "public"."lesson_reset_count" to "service_role";

grant trigger on table "public"."lesson_reset_count" to "service_role";

grant truncate on table "public"."lesson_reset_count" to "service_role";

grant update on table "public"."lesson_reset_count" to "service_role";

grant delete on table "public"."lesson_types" to "anon";

grant insert on table "public"."lesson_types" to "anon";

grant references on table "public"."lesson_types" to "anon";

grant select on table "public"."lesson_types" to "anon";

grant trigger on table "public"."lesson_types" to "anon";

grant truncate on table "public"."lesson_types" to "anon";

grant update on table "public"."lesson_types" to "anon";

grant delete on table "public"."lesson_types" to "authenticated";

grant insert on table "public"."lesson_types" to "authenticated";

grant references on table "public"."lesson_types" to "authenticated";

grant select on table "public"."lesson_types" to "authenticated";

grant trigger on table "public"."lesson_types" to "authenticated";

grant truncate on table "public"."lesson_types" to "authenticated";

grant update on table "public"."lesson_types" to "authenticated";

grant delete on table "public"."lesson_types" to "service_role";

grant insert on table "public"."lesson_types" to "service_role";

grant references on table "public"."lesson_types" to "service_role";

grant select on table "public"."lesson_types" to "service_role";

grant trigger on table "public"."lesson_types" to "service_role";

grant truncate on table "public"."lesson_types" to "service_role";

grant update on table "public"."lesson_types" to "service_role";

grant delete on table "public"."lessons" to "anon";

grant insert on table "public"."lessons" to "anon";

grant references on table "public"."lessons" to "anon";

grant select on table "public"."lessons" to "anon";

grant trigger on table "public"."lessons" to "anon";

grant truncate on table "public"."lessons" to "anon";

grant update on table "public"."lessons" to "anon";

grant delete on table "public"."lessons" to "authenticated";

grant insert on table "public"."lessons" to "authenticated";

grant references on table "public"."lessons" to "authenticated";

grant select on table "public"."lessons" to "authenticated";

grant trigger on table "public"."lessons" to "authenticated";

grant truncate on table "public"."lessons" to "authenticated";

grant update on table "public"."lessons" to "authenticated";

grant delete on table "public"."lessons" to "service_role";

grant insert on table "public"."lessons" to "service_role";

grant references on table "public"."lessons" to "service_role";

grant select on table "public"."lessons" to "service_role";

grant trigger on table "public"."lessons" to "service_role";

grant truncate on table "public"."lessons" to "service_role";

grant update on table "public"."lessons" to "service_role";

grant delete on table "public"."organization_invites" to "anon";

grant insert on table "public"."organization_invites" to "anon";

grant references on table "public"."organization_invites" to "anon";

grant select on table "public"."organization_invites" to "anon";

grant trigger on table "public"."organization_invites" to "anon";

grant truncate on table "public"."organization_invites" to "anon";

grant update on table "public"."organization_invites" to "anon";

grant delete on table "public"."organization_invites" to "authenticated";

grant insert on table "public"."organization_invites" to "authenticated";

grant references on table "public"."organization_invites" to "authenticated";

grant select on table "public"."organization_invites" to "authenticated";

grant trigger on table "public"."organization_invites" to "authenticated";

grant truncate on table "public"."organization_invites" to "authenticated";

grant update on table "public"."organization_invites" to "authenticated";

grant delete on table "public"."organization_invites" to "service_role";

grant insert on table "public"."organization_invites" to "service_role";

grant references on table "public"."organization_invites" to "service_role";

grant select on table "public"."organization_invites" to "service_role";

grant trigger on table "public"."organization_invites" to "service_role";

grant truncate on table "public"."organization_invites" to "service_role";

grant update on table "public"."organization_invites" to "service_role";

grant delete on table "public"."organization_members" to "anon";

grant insert on table "public"."organization_members" to "anon";

grant references on table "public"."organization_members" to "anon";

grant select on table "public"."organization_members" to "anon";

grant trigger on table "public"."organization_members" to "anon";

grant truncate on table "public"."organization_members" to "anon";

grant update on table "public"."organization_members" to "anon";

grant delete on table "public"."organization_members" to "authenticated";

grant insert on table "public"."organization_members" to "authenticated";

grant references on table "public"."organization_members" to "authenticated";

grant select on table "public"."organization_members" to "authenticated";

grant trigger on table "public"."organization_members" to "authenticated";

grant truncate on table "public"."organization_members" to "authenticated";

grant update on table "public"."organization_members" to "authenticated";

grant delete on table "public"."organization_members" to "service_role";

grant insert on table "public"."organization_members" to "service_role";

grant references on table "public"."organization_members" to "service_role";

grant select on table "public"."organization_members" to "service_role";

grant trigger on table "public"."organization_members" to "service_role";

grant truncate on table "public"."organization_members" to "service_role";

grant update on table "public"."organization_members" to "service_role";

grant delete on table "public"."organization_subscriptions" to "anon";

grant insert on table "public"."organization_subscriptions" to "anon";

grant references on table "public"."organization_subscriptions" to "anon";

grant select on table "public"."organization_subscriptions" to "anon";

grant trigger on table "public"."organization_subscriptions" to "anon";

grant truncate on table "public"."organization_subscriptions" to "anon";

grant update on table "public"."organization_subscriptions" to "anon";

grant delete on table "public"."organization_subscriptions" to "authenticated";

grant insert on table "public"."organization_subscriptions" to "authenticated";

grant references on table "public"."organization_subscriptions" to "authenticated";

grant select on table "public"."organization_subscriptions" to "authenticated";

grant trigger on table "public"."organization_subscriptions" to "authenticated";

grant truncate on table "public"."organization_subscriptions" to "authenticated";

grant update on table "public"."organization_subscriptions" to "authenticated";

grant delete on table "public"."organization_subscriptions" to "service_role";

grant insert on table "public"."organization_subscriptions" to "service_role";

grant references on table "public"."organization_subscriptions" to "service_role";

grant select on table "public"."organization_subscriptions" to "service_role";

grant trigger on table "public"."organization_subscriptions" to "service_role";

grant truncate on table "public"."organization_subscriptions" to "service_role";

grant update on table "public"."organization_subscriptions" to "service_role";

grant delete on table "public"."organization_wallets" to "anon";

grant insert on table "public"."organization_wallets" to "anon";

grant references on table "public"."organization_wallets" to "anon";

grant select on table "public"."organization_wallets" to "anon";

grant trigger on table "public"."organization_wallets" to "anon";

grant truncate on table "public"."organization_wallets" to "anon";

grant update on table "public"."organization_wallets" to "anon";

grant delete on table "public"."organization_wallets" to "authenticated";

grant insert on table "public"."organization_wallets" to "authenticated";

grant references on table "public"."organization_wallets" to "authenticated";

grant select on table "public"."organization_wallets" to "authenticated";

grant trigger on table "public"."organization_wallets" to "authenticated";

grant truncate on table "public"."organization_wallets" to "authenticated";

grant update on table "public"."organization_wallets" to "authenticated";

grant delete on table "public"."organization_wallets" to "service_role";

grant insert on table "public"."organization_wallets" to "service_role";

grant references on table "public"."organization_wallets" to "service_role";

grant select on table "public"."organization_wallets" to "service_role";

grant trigger on table "public"."organization_wallets" to "service_role";

grant truncate on table "public"."organization_wallets" to "service_role";

grant update on table "public"."organization_wallets" to "service_role";

grant delete on table "public"."organizations" to "anon";

grant insert on table "public"."organizations" to "anon";

grant references on table "public"."organizations" to "anon";

grant select on table "public"."organizations" to "anon";

grant trigger on table "public"."organizations" to "anon";

grant truncate on table "public"."organizations" to "anon";

grant update on table "public"."organizations" to "anon";

grant delete on table "public"."organizations" to "authenticated";

grant insert on table "public"."organizations" to "authenticated";

grant references on table "public"."organizations" to "authenticated";

grant select on table "public"."organizations" to "authenticated";

grant trigger on table "public"."organizations" to "authenticated";

grant truncate on table "public"."organizations" to "authenticated";

grant update on table "public"."organizations" to "authenticated";

grant delete on table "public"."organizations" to "service_role";

grant insert on table "public"."organizations" to "service_role";

grant references on table "public"."organizations" to "service_role";

grant select on table "public"."organizations" to "service_role";

grant trigger on table "public"."organizations" to "service_role";

grant truncate on table "public"."organizations" to "service_role";

grant update on table "public"."organizations" to "service_role";

grant delete on table "public"."organizations_ai_credits" to "anon";

grant insert on table "public"."organizations_ai_credits" to "anon";

grant references on table "public"."organizations_ai_credits" to "anon";

grant select on table "public"."organizations_ai_credits" to "anon";

grant trigger on table "public"."organizations_ai_credits" to "anon";

grant truncate on table "public"."organizations_ai_credits" to "anon";

grant update on table "public"."organizations_ai_credits" to "anon";

grant delete on table "public"."organizations_ai_credits" to "authenticated";

grant insert on table "public"."organizations_ai_credits" to "authenticated";

grant references on table "public"."organizations_ai_credits" to "authenticated";

grant select on table "public"."organizations_ai_credits" to "authenticated";

grant trigger on table "public"."organizations_ai_credits" to "authenticated";

grant truncate on table "public"."organizations_ai_credits" to "authenticated";

grant update on table "public"."organizations_ai_credits" to "authenticated";

grant delete on table "public"."organizations_ai_credits" to "service_role";

grant insert on table "public"."organizations_ai_credits" to "service_role";

grant references on table "public"."organizations_ai_credits" to "service_role";

grant select on table "public"."organizations_ai_credits" to "service_role";

grant trigger on table "public"."organizations_ai_credits" to "service_role";

grant truncate on table "public"."organizations_ai_credits" to "service_role";

grant update on table "public"."organizations_ai_credits" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."published_course_structure_content" to "anon";

grant insert on table "public"."published_course_structure_content" to "anon";

grant references on table "public"."published_course_structure_content" to "anon";

grant select on table "public"."published_course_structure_content" to "anon";

grant trigger on table "public"."published_course_structure_content" to "anon";

grant truncate on table "public"."published_course_structure_content" to "anon";

grant update on table "public"."published_course_structure_content" to "anon";

grant delete on table "public"."published_course_structure_content" to "authenticated";

grant insert on table "public"."published_course_structure_content" to "authenticated";

grant references on table "public"."published_course_structure_content" to "authenticated";

grant select on table "public"."published_course_structure_content" to "authenticated";

grant trigger on table "public"."published_course_structure_content" to "authenticated";

grant truncate on table "public"."published_course_structure_content" to "authenticated";

grant update on table "public"."published_course_structure_content" to "authenticated";

grant delete on table "public"."published_course_structure_content" to "service_role";

grant insert on table "public"."published_course_structure_content" to "service_role";

grant references on table "public"."published_course_structure_content" to "service_role";

grant select on table "public"."published_course_structure_content" to "service_role";

grant trigger on table "public"."published_course_structure_content" to "service_role";

grant truncate on table "public"."published_course_structure_content" to "service_role";

grant update on table "public"."published_course_structure_content" to "service_role";

grant delete on table "public"."published_courses" to "anon";

grant insert on table "public"."published_courses" to "anon";

grant references on table "public"."published_courses" to "anon";

grant select on table "public"."published_courses" to "anon";

grant trigger on table "public"."published_courses" to "anon";

grant truncate on table "public"."published_courses" to "anon";

grant update on table "public"."published_courses" to "anon";

grant delete on table "public"."published_courses" to "authenticated";

grant insert on table "public"."published_courses" to "authenticated";

grant references on table "public"."published_courses" to "authenticated";

grant select on table "public"."published_courses" to "authenticated";

grant trigger on table "public"."published_courses" to "authenticated";

grant truncate on table "public"."published_courses" to "authenticated";

grant update on table "public"."published_courses" to "authenticated";

grant delete on table "public"."published_courses" to "service_role";

grant insert on table "public"."published_courses" to "service_role";

grant references on table "public"."published_courses" to "service_role";

grant select on table "public"."published_courses" to "service_role";

grant trigger on table "public"."published_courses" to "service_role";

grant truncate on table "public"."published_courses" to "service_role";

grant update on table "public"."published_courses" to "service_role";

grant delete on table "public"."published_file_library" to "anon";

grant insert on table "public"."published_file_library" to "anon";

grant references on table "public"."published_file_library" to "anon";

grant select on table "public"."published_file_library" to "anon";

grant trigger on table "public"."published_file_library" to "anon";

grant truncate on table "public"."published_file_library" to "anon";

grant update on table "public"."published_file_library" to "anon";

grant delete on table "public"."published_file_library" to "authenticated";

grant insert on table "public"."published_file_library" to "authenticated";

grant references on table "public"."published_file_library" to "authenticated";

grant select on table "public"."published_file_library" to "authenticated";

grant trigger on table "public"."published_file_library" to "authenticated";

grant truncate on table "public"."published_file_library" to "authenticated";

grant update on table "public"."published_file_library" to "authenticated";

grant delete on table "public"."published_file_library" to "service_role";

grant insert on table "public"."published_file_library" to "service_role";

grant references on table "public"."published_file_library" to "service_role";

grant select on table "public"."published_file_library" to "service_role";

grant trigger on table "public"."published_file_library" to "service_role";

grant truncate on table "public"."published_file_library" to "service_role";

grant update on table "public"."published_file_library" to "service_role";

grant delete on table "public"."role_permissions" to "anon";

grant insert on table "public"."role_permissions" to "anon";

grant references on table "public"."role_permissions" to "anon";

grant select on table "public"."role_permissions" to "anon";

grant trigger on table "public"."role_permissions" to "anon";

grant truncate on table "public"."role_permissions" to "anon";

grant update on table "public"."role_permissions" to "anon";

grant delete on table "public"."role_permissions" to "authenticated";

grant insert on table "public"."role_permissions" to "authenticated";

grant references on table "public"."role_permissions" to "authenticated";

grant select on table "public"."role_permissions" to "authenticated";

grant trigger on table "public"."role_permissions" to "authenticated";

grant truncate on table "public"."role_permissions" to "authenticated";

grant update on table "public"."role_permissions" to "authenticated";

grant delete on table "public"."role_permissions" to "service_role";

grant insert on table "public"."role_permissions" to "service_role";

grant references on table "public"."role_permissions" to "service_role";

grant select on table "public"."role_permissions" to "service_role";

grant trigger on table "public"."role_permissions" to "service_role";

grant truncate on table "public"."role_permissions" to "service_role";

grant update on table "public"."role_permissions" to "service_role";

grant delete on table "public"."tier_limits" to "anon";

grant insert on table "public"."tier_limits" to "anon";

grant references on table "public"."tier_limits" to "anon";

grant select on table "public"."tier_limits" to "anon";

grant trigger on table "public"."tier_limits" to "anon";

grant truncate on table "public"."tier_limits" to "anon";

grant update on table "public"."tier_limits" to "anon";

grant delete on table "public"."tier_limits" to "authenticated";

grant insert on table "public"."tier_limits" to "authenticated";

grant references on table "public"."tier_limits" to "authenticated";

grant select on table "public"."tier_limits" to "authenticated";

grant trigger on table "public"."tier_limits" to "authenticated";

grant truncate on table "public"."tier_limits" to "authenticated";

grant update on table "public"."tier_limits" to "authenticated";

grant delete on table "public"."tier_limits" to "service_role";

grant insert on table "public"."tier_limits" to "service_role";

grant references on table "public"."tier_limits" to "service_role";

grant select on table "public"."tier_limits" to "service_role";

grant trigger on table "public"."tier_limits" to "service_role";

grant truncate on table "public"."tier_limits" to "service_role";

grant update on table "public"."tier_limits" to "service_role";

grant delete on table "public"."user_notifications" to "anon";

grant insert on table "public"."user_notifications" to "anon";

grant references on table "public"."user_notifications" to "anon";

grant select on table "public"."user_notifications" to "anon";

grant trigger on table "public"."user_notifications" to "anon";

grant truncate on table "public"."user_notifications" to "anon";

grant update on table "public"."user_notifications" to "anon";

grant delete on table "public"."user_notifications" to "authenticated";

grant insert on table "public"."user_notifications" to "authenticated";

grant references on table "public"."user_notifications" to "authenticated";

grant select on table "public"."user_notifications" to "authenticated";

grant trigger on table "public"."user_notifications" to "authenticated";

grant truncate on table "public"."user_notifications" to "authenticated";

grant update on table "public"."user_notifications" to "authenticated";

grant delete on table "public"."user_notifications" to "service_role";

grant insert on table "public"."user_notifications" to "service_role";

grant references on table "public"."user_notifications" to "service_role";

grant select on table "public"."user_notifications" to "service_role";

grant trigger on table "public"."user_notifications" to "service_role";

grant truncate on table "public"."user_notifications" to "service_role";

grant update on table "public"."user_notifications" to "service_role";

grant delete on table "public"."user_notifications_types" to "anon";

grant insert on table "public"."user_notifications_types" to "anon";

grant references on table "public"."user_notifications_types" to "anon";

grant select on table "public"."user_notifications_types" to "anon";

grant trigger on table "public"."user_notifications_types" to "anon";

grant truncate on table "public"."user_notifications_types" to "anon";

grant update on table "public"."user_notifications_types" to "anon";

grant delete on table "public"."user_notifications_types" to "authenticated";

grant insert on table "public"."user_notifications_types" to "authenticated";

grant references on table "public"."user_notifications_types" to "authenticated";

grant select on table "public"."user_notifications_types" to "authenticated";

grant trigger on table "public"."user_notifications_types" to "authenticated";

grant truncate on table "public"."user_notifications_types" to "authenticated";

grant update on table "public"."user_notifications_types" to "authenticated";

grant delete on table "public"."user_notifications_types" to "service_role";

grant insert on table "public"."user_notifications_types" to "service_role";

grant references on table "public"."user_notifications_types" to "service_role";

grant select on table "public"."user_notifications_types" to "service_role";

grant trigger on table "public"."user_notifications_types" to "service_role";

grant truncate on table "public"."user_notifications_types" to "service_role";

grant update on table "public"."user_notifications_types" to "service_role";

grant delete on table "public"."user_purchases" to "anon";

grant insert on table "public"."user_purchases" to "anon";

grant references on table "public"."user_purchases" to "anon";

grant select on table "public"."user_purchases" to "anon";

grant trigger on table "public"."user_purchases" to "anon";

grant truncate on table "public"."user_purchases" to "anon";

grant update on table "public"."user_purchases" to "anon";

grant delete on table "public"."user_purchases" to "authenticated";

grant insert on table "public"."user_purchases" to "authenticated";

grant references on table "public"."user_purchases" to "authenticated";

grant select on table "public"."user_purchases" to "authenticated";

grant trigger on table "public"."user_purchases" to "authenticated";

grant truncate on table "public"."user_purchases" to "authenticated";

grant update on table "public"."user_purchases" to "authenticated";

grant delete on table "public"."user_purchases" to "service_role";

grant insert on table "public"."user_purchases" to "service_role";

grant references on table "public"."user_purchases" to "service_role";

grant select on table "public"."user_purchases" to "service_role";

grant trigger on table "public"."user_purchases" to "service_role";

grant truncate on table "public"."user_purchases" to "service_role";

grant update on table "public"."user_purchases" to "service_role";

grant delete on table "public"."user_roles" to "service_role";

grant insert on table "public"."user_roles" to "service_role";

grant references on table "public"."user_roles" to "service_role";

grant select on table "public"."user_roles" to "service_role";

grant trigger on table "public"."user_roles" to "service_role";

grant truncate on table "public"."user_roles" to "service_role";

grant update on table "public"."user_roles" to "service_role";

grant delete on table "public"."user_roles" to "supabase_auth_admin";

grant insert on table "public"."user_roles" to "supabase_auth_admin";

grant references on table "public"."user_roles" to "supabase_auth_admin";

grant select on table "public"."user_roles" to "supabase_auth_admin";

grant trigger on table "public"."user_roles" to "supabase_auth_admin";

grant truncate on table "public"."user_roles" to "supabase_auth_admin";

grant update on table "public"."user_roles" to "supabase_auth_admin";

grant delete on table "public"."user_wallets" to "anon";

grant insert on table "public"."user_wallets" to "anon";

grant references on table "public"."user_wallets" to "anon";

grant select on table "public"."user_wallets" to "anon";

grant trigger on table "public"."user_wallets" to "anon";

grant truncate on table "public"."user_wallets" to "anon";

grant update on table "public"."user_wallets" to "anon";

grant delete on table "public"."user_wallets" to "authenticated";

grant insert on table "public"."user_wallets" to "authenticated";

grant references on table "public"."user_wallets" to "authenticated";

grant select on table "public"."user_wallets" to "authenticated";

grant trigger on table "public"."user_wallets" to "authenticated";

grant truncate on table "public"."user_wallets" to "authenticated";

grant update on table "public"."user_wallets" to "authenticated";

grant delete on table "public"."user_wallets" to "service_role";

grant insert on table "public"."user_wallets" to "service_role";

grant references on table "public"."user_wallets" to "service_role";

grant select on table "public"."user_wallets" to "service_role";

grant trigger on table "public"."user_wallets" to "service_role";

grant truncate on table "public"."user_wallets" to "service_role";

grant update on table "public"."user_wallets" to "service_role";

grant delete on table "public"."wallet_ledger_entries" to "anon";

grant insert on table "public"."wallet_ledger_entries" to "anon";

grant references on table "public"."wallet_ledger_entries" to "anon";

grant select on table "public"."wallet_ledger_entries" to "anon";

grant trigger on table "public"."wallet_ledger_entries" to "anon";

grant truncate on table "public"."wallet_ledger_entries" to "anon";

grant update on table "public"."wallet_ledger_entries" to "anon";

grant delete on table "public"."wallet_ledger_entries" to "authenticated";

grant insert on table "public"."wallet_ledger_entries" to "authenticated";

grant references on table "public"."wallet_ledger_entries" to "authenticated";

grant select on table "public"."wallet_ledger_entries" to "authenticated";

grant trigger on table "public"."wallet_ledger_entries" to "authenticated";

grant truncate on table "public"."wallet_ledger_entries" to "authenticated";

grant update on table "public"."wallet_ledger_entries" to "authenticated";

grant delete on table "public"."wallet_ledger_entries" to "service_role";

grant insert on table "public"."wallet_ledger_entries" to "service_role";

grant references on table "public"."wallet_ledger_entries" to "service_role";

grant select on table "public"."wallet_ledger_entries" to "service_role";

grant trigger on table "public"."wallet_ledger_entries" to "service_role";

grant truncate on table "public"."wallet_ledger_entries" to "service_role";

grant update on table "public"."wallet_ledger_entries" to "service_role";


  create policy "Allow org members to view ai_usage_log"
  on "public"."ai_usage_log"
  as permissive
  for select
  to authenticated
using (((EXISTS ( SELECT 1
   FROM public.organization_members om
  WHERE ((om.organization_id = ai_usage_log.org_id) AND (om.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT o.owned_by
   FROM public.organizations o
  WHERE (o.id = ai_usage_log.org_id)) = ( SELECT auth.uid() AS uid))));



  create policy "Restrict ai_usage_log modifications to service role (delete)"
  on "public"."ai_usage_log"
  as permissive
  for delete
  to authenticated
using (false);



  create policy "Restrict ai_usage_log modifications to service role (insert)"
  on "public"."ai_usage_log"
  as permissive
  for insert
  to authenticated
with check (false);



  create policy "Restrict ai_usage_log modifications to service role (update)"
  on "public"."ai_usage_log"
  as permissive
  for update
  to authenticated
using (false)
with check (false);



  create policy "delete: user can delete their own progress"
  on "public"."block_progress"
  as permissive
  for delete
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "insert: user can create their own progress"
  on "public"."block_progress"
  as permissive
  for insert
  to authenticated
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "select: anon users can view public progress"
  on "public"."block_progress"
  as permissive
  for select
  to anon
using ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = block_progress.user_id) AND (p.is_public = true)))));



  create policy "select: auth users can view public or same-org progress"
  on "public"."block_progress"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = block_progress.user_id) AND ((p.is_public = true) OR (EXISTS ( SELECT 1
           FROM (public.organization_members m1
             JOIN public.organization_members m2 ON ((m1.organization_id = m2.organization_id)))
          WHERE ((m1.user_id = block_progress.user_id) AND (m2.user_id = ( SELECT auth.uid() AS uid))))))))));



  create policy "update: user can update their own progress"
  on "public"."block_progress"
  as permissive
  for update
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "delete: user can delete their own progress"
  on "public"."chapter_progress"
  as permissive
  for delete
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "insert: user can create their own progress"
  on "public"."chapter_progress"
  as permissive
  for insert
  to authenticated
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "select: anon users can view public progress"
  on "public"."chapter_progress"
  as permissive
  for select
  to anon
using ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = chapter_progress.user_id) AND (p.is_public = true)))));



  create policy "select: auth users can view public or same-org progress"
  on "public"."chapter_progress"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = chapter_progress.user_id) AND ((p.is_public = true) OR (EXISTS ( SELECT 1
           FROM (public.organization_members m1
             JOIN public.organization_members m2 ON ((m1.organization_id = m2.organization_id)))
          WHERE ((m1.user_id = chapter_progress.user_id) AND (m2.user_id = ( SELECT auth.uid() AS uid))))))))));



  create policy "update: user can update their own progress"
  on "public"."chapter_progress"
  as permissive
  for update
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "delete: can_user_edit_course allows deleting chapters"
  on "public"."chapters"
  as permissive
  for delete
  to authenticated
using (public.can_user_edit_course(course_id));



  create policy "insert: can_user_edit_course allows inserting chapters"
  on "public"."chapters"
  as permissive
  for insert
  to authenticated
with check (public.can_user_edit_course(course_id));



  create policy "select: org members or editors can view chapters"
  on "public"."chapters"
  as permissive
  for select
  to authenticated
using (public.can_user_edit_course(course_id));



  create policy "update: can_user_edit_course allows updating chapters"
  on "public"."chapters"
  as permissive
  for update
  to authenticated
using (public.can_user_edit_course(course_id))
with check (public.can_user_edit_course(course_id));



  create policy "course_categories_delete_authenticated"
  on "public"."course_categories"
  as permissive
  for delete
  to authenticated
using ((public.authorize('go_su_delete'::public.app_permission) OR public.authorize('go_admin_delete'::public.app_permission) OR public.authorize('go_staff_delete'::public.app_permission)));



  create policy "course_categories_insert_authenticated"
  on "public"."course_categories"
  as permissive
  for insert
  to authenticated
with check ((public.authorize('go_su_create'::public.app_permission) OR public.authorize('go_admin_create'::public.app_permission) OR public.authorize('go_staff_create'::public.app_permission)));



  create policy "course_categories_select_public"
  on "public"."course_categories"
  as permissive
  for select
  to authenticated, anon
using (true);



  create policy "course_categories_update_authenticated"
  on "public"."course_categories"
  as permissive
  for update
  to authenticated
using ((public.authorize('go_su_update'::public.app_permission) OR public.authorize('go_admin_update'::public.app_permission) OR public.authorize('go_staff_update'::public.app_permission)));



  create policy "course-editors-delete-admins"
  on "public"."course_editors"
  as permissive
  for delete
  to public
using (public.has_org_role(organization_id, 'admin'::text, ( SELECT auth.uid() AS uid)));



  create policy "course-editors-insert-admins"
  on "public"."course_editors"
  as permissive
  for insert
  to public
with check ((public.has_org_role(organization_id, 'admin'::text, ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM public.organization_members m
  WHERE ((m.organization_id = course_editors.organization_id) AND (m.user_id = course_editors.user_id))))));



  create policy "course-editors-select-org-members"
  on "public"."course_editors"
  as permissive
  for select
  to authenticated
using (public.has_org_role(organization_id, 'editor'::text, ( SELECT auth.uid() AS uid)));



  create policy "select_enrollment_activities"
  on "public"."course_enrollment_activities"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (public.course_enrollments ce
     JOIN public.courses pc ON ((pc.id = ce.published_course_id)))
  WHERE ((ce.id = course_enrollment_activities.enrollment_id) AND ((public.get_user_org_role(pc.organization_id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text])) OR (EXISTS ( SELECT 1
           FROM public.course_editors ce_ed
          WHERE ((ce_ed.course_id = pc.id) AND (ce_ed.user_id = ( SELECT auth.uid() AS uid))))) OR (ce.user_id = ( SELECT auth.uid() AS uid)))))));



  create policy "select: org roles or own enrollment"
  on "public"."course_enrollments"
  as permissive
  for select
  to authenticated
using (((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM public.courses pc
  WHERE ((pc.id = course_enrollments.published_course_id) AND (public.get_user_org_role(pc.organization_id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text]))))) OR (EXISTS ( SELECT 1
   FROM (public.courses pc
     JOIN public.course_editors ce ON ((ce.course_id = pc.id)))
  WHERE ((pc.id = course_enrollments.published_course_id) AND (ce.user_id = ( SELECT auth.uid() AS uid)))))));



  create policy "select: only owners and admins can view course payments"
  on "public"."course_payments"
  as permissive
  for select
  to authenticated
using ((public.get_user_org_role(organization_id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text])));



  create policy "delete: can_user_edit_course allows deleting pricing tiers"
  on "public"."course_pricing_tiers"
  as permissive
  for delete
  to authenticated
using (public.can_user_edit_course(course_id));



  create policy "insert: can_user_edit_course allows adding pricing tiers"
  on "public"."course_pricing_tiers"
  as permissive
  for insert
  to authenticated
with check (public.can_user_edit_course(course_id));



  create policy "select: org members can view pricing tiers"
  on "public"."course_pricing_tiers"
  as permissive
  for select
  to authenticated
using (public.can_user_edit_course(course_id));



  create policy "update: can_user_edit_course allows updating pricing tiers"
  on "public"."course_pricing_tiers"
  as permissive
  for update
  to authenticated
using (public.can_user_edit_course(course_id))
with check (public.can_user_edit_course(course_id));



  create policy "delete: user can delete their own progress"
  on "public"."course_progress"
  as permissive
  for delete
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "insert: user can create their own progress"
  on "public"."course_progress"
  as permissive
  for insert
  to authenticated
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "select: anon users can view public progress"
  on "public"."course_progress"
  as permissive
  for select
  to anon
using ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = course_progress.user_id) AND (p.is_public = true)))));



  create policy "select: auth users can view public or same-org progress"
  on "public"."course_progress"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = course_progress.user_id) AND ((p.is_public = true) OR (EXISTS ( SELECT 1
           FROM (public.organization_members m1
             JOIN public.organization_members m2 ON ((m1.organization_id = m2.organization_id)))
          WHERE ((m1.user_id = course_progress.user_id) AND (m2.user_id = ( SELECT auth.uid() AS uid))))))))));



  create policy "update: user can update their own progress"
  on "public"."course_progress"
  as permissive
  for update
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "course_sub_categories_delete_authenticated"
  on "public"."course_sub_categories"
  as permissive
  for delete
  to authenticated
using ((public.authorize('go_su_delete'::public.app_permission) OR public.authorize('go_admin_delete'::public.app_permission) OR public.authorize('go_staff_delete'::public.app_permission)));



  create policy "course_sub_categories_insert_authenticated"
  on "public"."course_sub_categories"
  as permissive
  for insert
  to authenticated
with check ((public.authorize('go_su_create'::public.app_permission) OR public.authorize('go_admin_create'::public.app_permission) OR public.authorize('go_staff_create'::public.app_permission)));



  create policy "course_sub_categories_select_public"
  on "public"."course_sub_categories"
  as permissive
  for select
  to authenticated, anon
using (true);



  create policy "course_sub_categories_update_authenticated"
  on "public"."course_sub_categories"
  as permissive
  for update
  to authenticated
using ((public.authorize('go_su_update'::public.app_permission) OR public.authorize('go_admin_update'::public.app_permission) OR public.authorize('go_staff_update'::public.app_permission)));



  create policy "Delete: Admins can delete courses"
  on "public"."courses"
  as permissive
  for delete
  to authenticated
using ((public.get_user_org_role(organization_id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text])));



  create policy "Insert: Org members can create courses"
  on "public"."courses"
  as permissive
  for insert
  to authenticated
with check ((public.get_user_org_role(organization_id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text, 'editor'::text])));



  create policy "Select: Org members can view courses"
  on "public"."courses"
  as permissive
  for select
  to authenticated
using ((public.get_user_org_role(organization_id, ( SELECT auth.uid() AS uid)) IS NOT NULL));



  create policy "Update: Admins or course editors can update courses"
  on "public"."courses"
  as permissive
  for update
  to public
using (public.can_user_edit_course(id))
with check (public.can_user_edit_course(id));



  create policy "delete: org owner/admin or course creator"
  on "public"."file_library"
  as permissive
  for delete
  to authenticated
using (public.can_user_edit_course(course_id));



  create policy "insert: org owner/admin or course creator"
  on "public"."file_library"
  as permissive
  for insert
  to authenticated
with check (public.can_user_edit_course(course_id));



  create policy "select: org members can view file_library"
  on "public"."file_library"
  as permissive
  for select
  to authenticated
using (public.can_user_edit_course(course_id));



  create policy "update: org owner/admin or course creator"
  on "public"."file_library"
  as permissive
  for update
  to authenticated
using (public.can_user_edit_course(course_id))
with check (public.can_user_edit_course(course_id));



  create policy "gonasi_wallets_select_with_permission"
  on "public"."gonasi_wallets"
  as permissive
  for select
  to authenticated
using ((public.authorize('go_su_read'::public.app_permission) OR public.authorize('go_admin_read'::public.app_permission)));



  create policy "delete: can_user_edit_course allows deleting lesson blocks"
  on "public"."lesson_blocks"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.lessons l
  WHERE ((l.id = lesson_blocks.lesson_id) AND public.can_user_edit_course(l.course_id)))));



  create policy "insert: can_user_edit_course allows adding lesson blocks"
  on "public"."lesson_blocks"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.lessons l
  WHERE ((l.id = lesson_blocks.lesson_id) AND public.can_user_edit_course(l.course_id)))));



  create policy "select: org members can view lesson blocks"
  on "public"."lesson_blocks"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.lessons l
  WHERE ((l.id = lesson_blocks.lesson_id) AND public.can_user_edit_course(l.course_id)))));



  create policy "update: can_user_edit_course allows modifying lesson blocks"
  on "public"."lesson_blocks"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.lessons l
  WHERE ((l.id = lesson_blocks.lesson_id) AND public.can_user_edit_course(l.course_id)))))
with check ((EXISTS ( SELECT 1
   FROM public.lessons l
  WHERE ((l.id = lesson_blocks.lesson_id) AND public.can_user_edit_course(l.course_id)))));



  create policy "delete: user can delete their own progress"
  on "public"."lesson_progress"
  as permissive
  for delete
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "insert: user can create their own progress"
  on "public"."lesson_progress"
  as permissive
  for insert
  to authenticated
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "select: anon users can view public progress"
  on "public"."lesson_progress"
  as permissive
  for select
  to anon
using ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = lesson_progress.user_id) AND (p.is_public = true)))));



  create policy "select: auth users can view public or same-org progress"
  on "public"."lesson_progress"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = lesson_progress.user_id) AND ((p.is_public = true) OR (EXISTS ( SELECT 1
           FROM (public.organization_members m1
             JOIN public.organization_members m2 ON ((m1.organization_id = m2.organization_id)))
          WHERE ((m1.user_id = lesson_progress.user_id) AND (m2.user_id = ( SELECT auth.uid() AS uid))))))))));



  create policy "update: user can update their own progress"
  on "public"."lesson_progress"
  as permissive
  for update
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "delete: user can delete their own reset count"
  on "public"."lesson_reset_count"
  as permissive
  for delete
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "insert: user can create their own reset count"
  on "public"."lesson_reset_count"
  as permissive
  for insert
  to authenticated
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "select: anon users can view public resets"
  on "public"."lesson_reset_count"
  as permissive
  for select
  to anon
using ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = lesson_reset_count.user_id) AND (p.is_public = true)))));



  create policy "select: auth users can view public or same-org resets"
  on "public"."lesson_reset_count"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = lesson_reset_count.user_id) AND ((p.is_public = true) OR (EXISTS ( SELECT 1
           FROM (public.organization_members m1
             JOIN public.organization_members m2 ON ((m1.organization_id = m2.organization_id)))
          WHERE ((m1.user_id = lesson_reset_count.user_id) AND (m2.user_id = ( SELECT auth.uid() AS uid))))))))));



  create policy "update: user can update their own reset count"
  on "public"."lesson_reset_count"
  as permissive
  for update
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "lesson_types_delete_authenticated"
  on "public"."lesson_types"
  as permissive
  for delete
  to authenticated
using ((public.authorize('go_su_delete'::public.app_permission) OR public.authorize('go_admin_delete'::public.app_permission) OR public.authorize('go_staff_delete'::public.app_permission)));



  create policy "lesson_types_insert_authenticated"
  on "public"."lesson_types"
  as permissive
  for insert
  to authenticated
with check ((public.authorize('go_su_create'::public.app_permission) OR public.authorize('go_admin_create'::public.app_permission) OR public.authorize('go_staff_create'::public.app_permission)));



  create policy "lesson_types_select_public"
  on "public"."lesson_types"
  as permissive
  for select
  to authenticated, anon
using (true);



  create policy "lesson_types_update_authenticated"
  on "public"."lesson_types"
  as permissive
  for update
  to authenticated
using ((public.authorize('go_su_update'::public.app_permission) OR public.authorize('go_admin_update'::public.app_permission) OR public.authorize('go_staff_update'::public.app_permission)));



  create policy "delete: can_user_edit_course allows deleting lessons"
  on "public"."lessons"
  as permissive
  for delete
  to authenticated
using (public.can_user_edit_course(course_id));



  create policy "insert: can_user_edit_course allows adding lessons"
  on "public"."lessons"
  as permissive
  for insert
  to authenticated
with check (public.can_user_edit_course(course_id));



  create policy "select: org members can view lessons"
  on "public"."lessons"
  as permissive
  for select
  to authenticated
using (public.can_user_edit_course(course_id));



  create policy "update: can_user_edit_course allows updating lessons"
  on "public"."lessons"
  as permissive
  for update
  to authenticated
using (public.can_user_edit_course(course_id))
with check (public.can_user_edit_course(course_id));



  create policy "organization_invites_delete"
  on "public"."organization_invites"
  as permissive
  for delete
  to authenticated
using (public.has_org_role(organization_id, 'owner'::text, ( SELECT auth.uid() AS uid)));



  create policy "organization_invites_insert"
  on "public"."organization_invites"
  as permissive
  for insert
  to authenticated
with check ((public.has_org_role(organization_id, 'admin'::text, ( SELECT auth.uid() AS uid)) AND (invited_by = ( SELECT auth.uid() AS uid)) AND public.can_accept_new_member(organization_id, 'invite'::text) AND ((role <> 'admin'::public.org_role) OR public.has_org_role(organization_id, 'owner'::text, ( SELECT auth.uid() AS uid))) AND (email <> ( SELECT profiles.email
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid)))) AND (NOT public.is_user_already_member(organization_id, email))));



  create policy "organization_invites_select_authenticated"
  on "public"."organization_invites"
  as permissive
  for select
  to authenticated
using ((public.has_org_role(organization_id, 'admin'::text, ( SELECT auth.uid() AS uid)) OR ((email = ( SELECT profiles.email
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid)))) AND (accepted_at IS NULL) AND (revoked_at IS NULL) AND (expires_at > now()))));



  create policy "organization_invites_update"
  on "public"."organization_invites"
  as permissive
  for update
  to authenticated
using ((public.has_org_role(organization_id, 'admin'::text, ( SELECT auth.uid() AS uid)) OR ((email = ( SELECT profiles.email
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid)))) AND (accepted_at IS NULL) AND (revoked_at IS NULL) AND (expires_at > now()))))
with check ((((role <> 'admin'::public.org_role) OR public.has_org_role(organization_id, 'owner'::text, ( SELECT auth.uid() AS uid))) AND ((accepted_by IS NULL) OR (accepted_by = ( SELECT auth.uid() AS uid))) AND ((accepted_at IS NULL) OR public.can_accept_new_member(organization_id, 'invite'::text)) AND ((revoked_at IS NULL) OR public.has_org_role(organization_id, 'admin'::text, ( SELECT auth.uid() AS uid)))));



  create policy "organization_members_delete"
  on "public"."organization_members"
  as permissive
  for delete
  to authenticated
using ((((user_id = ( SELECT auth.uid() AS uid)) AND (role <> 'owner'::public.org_role)) OR ((role = 'editor'::public.org_role) AND (user_id <> ( SELECT auth.uid() AS uid)) AND public.has_org_role(organization_id, 'admin'::text, ( SELECT auth.uid() AS uid))) OR ((user_id <> ( SELECT auth.uid() AS uid)) AND public.has_org_role(organization_id, 'owner'::text, ( SELECT auth.uid() AS uid)))));



  create policy "organization_members_insert"
  on "public"."organization_members"
  as permissive
  for insert
  to authenticated
with check ((((user_id = ( SELECT auth.uid() AS uid)) AND (role = 'owner'::public.org_role)) OR (public.has_org_role(organization_id, 'admin'::text, ( SELECT auth.uid() AS uid)) AND public.can_accept_new_member(organization_id, 'accept'::text) AND ((role <> 'admin'::public.org_role) OR public.has_org_role(organization_id, 'owner'::text, ( SELECT auth.uid() AS uid))))));



  create policy "organization_members_select"
  on "public"."organization_members"
  as permissive
  for select
  to authenticated
using (((user_id = ( SELECT auth.uid() AS uid)) OR (public.get_user_org_role(organization_id, ( SELECT auth.uid() AS uid)) IS NOT NULL)));



  create policy "organization_members_update"
  on "public"."organization_members"
  as permissive
  for update
  to authenticated
using (public.has_org_role(organization_id, 'owner'::text, ( SELECT auth.uid() AS uid)))
with check (((user_id <> ( SELECT auth.uid() AS uid)) AND (role = ANY (ARRAY['admin'::public.org_role, 'editor'::public.org_role]))));



  create policy "organization_subscriptions_select"
  on "public"."organization_subscriptions"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.organizations o
  WHERE ((o.id = organization_subscriptions.organization_id) AND ((o.owned_by = ( SELECT auth.uid() AS uid)) OR public.has_org_role(o.id, 'admin'::text, ( SELECT auth.uid() AS uid)))))));



  create policy "Select: Only admins and owners can view wallets"
  on "public"."organization_wallets"
  as permissive
  for select
  to authenticated
using ((public.get_user_org_role(organization_id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text])));



  create policy "organizations_delete"
  on "public"."organizations"
  as permissive
  for delete
  to authenticated
using ((owned_by = ( SELECT auth.uid() AS uid)));



  create policy "organizations_insert"
  on "public"."organizations"
  as permissive
  for insert
  to authenticated
with check (((owned_by = ( SELECT auth.uid() AS uid)) AND public.can_create_organization((tier)::text, ( SELECT auth.uid() AS uid))));



  create policy "organizations_select"
  on "public"."organizations"
  as permissive
  for select
  to public
using (((is_public = true) OR (owned_by = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM public.organization_members om
  WHERE ((om.organization_id = organizations.id) AND (om.user_id = ( SELECT auth.uid() AS uid)))))));



  create policy "organizations_update"
  on "public"."organizations"
  as permissive
  for update
  to authenticated
using (((owned_by = ( SELECT auth.uid() AS uid)) OR public.has_org_role(id, 'admin'::text, ( SELECT auth.uid() AS uid))))
with check ((((owned_by = ( SELECT auth.uid() AS uid)) OR public.has_org_role(id, 'admin'::text, owned_by)) AND ((owned_by = ( SELECT auth.uid() AS uid)) OR public.has_org_role(id, 'admin'::text, ( SELECT auth.uid() AS uid)))));



  create policy "Allow organization members to view organizations_ai_credits"
  on "public"."organizations_ai_credits"
  as permissive
  for select
  to authenticated
using (((EXISTS ( SELECT 1
   FROM public.organization_members om
  WHERE ((om.organization_id = organizations_ai_credits.org_id) AND (om.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT o.owned_by
   FROM public.organizations o
  WHERE (o.id = organizations_ai_credits.org_id)) = ( SELECT auth.uid() AS uid))));



  create policy "Restrict organizations_ai_credits delete to service role"
  on "public"."organizations_ai_credits"
  as permissive
  for delete
  to authenticated
using (false);



  create policy "Restrict organizations_ai_credits insert to service role"
  on "public"."organizations_ai_credits"
  as permissive
  for insert
  to authenticated
with check (false);



  create policy "Restrict organizations_ai_credits update to service role"
  on "public"."organizations_ai_credits"
  as permissive
  for update
  to authenticated
using (false)
with check (false);



  create policy "Allow DELETE of own profile by authenticated users"
  on "public"."profiles"
  as permissive
  for delete
  to authenticated
using ((( SELECT auth.uid() AS uid) = id));



  create policy "Allow INSERT of own profile by authenticated users"
  on "public"."profiles"
  as permissive
  for insert
  to authenticated
with check (((( SELECT auth.uid() AS uid) = id) AND (((mode = 'personal'::public.profile_mode) AND (active_organization_id IS NULL)) OR ((mode = 'organization'::public.profile_mode) AND (active_organization_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.organization_members m
  WHERE ((m.user_id = ( SELECT auth.uid() AS uid)) AND (m.organization_id = profiles.active_organization_id))))))));



  create policy "Allow SELECT on own or public profiles"
  on "public"."profiles"
  as permissive
  for select
  to public
using (((is_public = true) OR (( SELECT auth.uid() AS uid) = id)));



  create policy "Allow UPDATE of own profile by authenticated users"
  on "public"."profiles"
  as permissive
  for update
  to authenticated
using ((( SELECT auth.uid() AS uid) = id))
with check (((( SELECT auth.uid() AS uid) = id) AND (((mode = 'personal'::public.profile_mode) AND (active_organization_id IS NULL)) OR ((mode = 'organization'::public.profile_mode) AND (active_organization_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.organization_members m
  WHERE ((m.user_id = ( SELECT auth.uid() AS uid)) AND (m.organization_id = profiles.active_organization_id))))))));



  create policy "delete_org_admins_or_editor"
  on "public"."published_course_structure_content"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.courses c
  WHERE ((c.id = published_course_structure_content.id) AND ((public.get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text])) OR (EXISTS ( SELECT 1
           FROM public.course_editors ce
          WHERE ((ce.course_id = c.id) AND (ce.user_id = ( SELECT auth.uid() AS uid))))))))));



  create policy "insert_org_members"
  on "public"."published_course_structure_content"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.courses c
  WHERE ((c.id = published_course_structure_content.id) AND (public.get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) IS NOT NULL)))));



  create policy "select_enrolled_users"
  on "public"."published_course_structure_content"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.course_enrollments ce
  WHERE ((ce.published_course_id = published_course_structure_content.id) AND (ce.user_id = ( SELECT auth.uid() AS uid)) AND (ce.is_active = true) AND ((ce.expires_at IS NULL) OR (ce.expires_at > now()))))));



  create policy "update_org_admins_or_editor"
  on "public"."published_course_structure_content"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.courses c
  WHERE ((c.id = published_course_structure_content.id) AND ((public.get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text])) OR (EXISTS ( SELECT 1
           FROM public.course_editors ce
          WHERE ((ce.course_id = c.id) AND (ce.user_id = ( SELECT auth.uid() AS uid))))))))));



  create policy "delete: only org owners/admins"
  on "public"."published_courses"
  as permissive
  for delete
  to authenticated
using ((public.get_user_org_role(organization_id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text])));



  create policy "insert: org members can publish"
  on "public"."published_courses"
  as permissive
  for insert
  to authenticated
with check ((public.get_user_org_role(organization_id, ( SELECT auth.uid() AS uid)) IS NOT NULL));



  create policy "select: public, enrolled, or org member"
  on "public"."published_courses"
  as permissive
  for select
  to public
using (((visibility = 'public'::public.course_access) OR ((( SELECT auth.role() AS role) = 'authenticated'::text) AND ((EXISTS ( SELECT 1
   FROM public.course_enrollments ce
  WHERE ((ce.published_course_id = published_courses.id) AND (ce.user_id = ( SELECT auth.uid() AS uid)) AND (ce.is_active = true) AND ((ce.expires_at IS NULL) OR (ce.expires_at > now()))))) OR (public.get_user_org_role(organization_id, ( SELECT auth.uid() AS uid)) IS NOT NULL)))));



  create policy "update: org admins or publishing editors"
  on "public"."published_courses"
  as permissive
  for update
  to authenticated
using (((public.get_user_org_role(organization_id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text])) OR ((public.get_user_org_role(organization_id, ( SELECT auth.uid() AS uid)) = 'editor'::text) AND (published_by = ( SELECT auth.uid() AS uid)))));



  create policy "delete_if_owner_admin_or_course_creator"
  on "public"."published_file_library"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.courses c
  WHERE ((c.id = published_file_library.course_id) AND ((public.get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text])) OR ((public.get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = 'editor'::text) AND (c.created_by = ( SELECT auth.uid() AS uid))))))));



  create policy "insert_if_owner_admin_or_course_creator"
  on "public"."published_file_library"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.courses c
  WHERE ((c.id = published_file_library.course_id) AND ((public.get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text])) OR ((public.get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = 'editor'::text) AND (c.created_by = ( SELECT auth.uid() AS uid))))))));



  create policy "select_if_org_member_or_enrolled_user"
  on "public"."published_file_library"
  as permissive
  for select
  to authenticated
using (((public.get_user_org_role(organization_id, ( SELECT auth.uid() AS uid)) IS NOT NULL) OR (EXISTS ( SELECT 1
   FROM public.course_enrollments ce
  WHERE ((ce.published_course_id = published_file_library.course_id) AND (ce.user_id = ( SELECT auth.uid() AS uid)) AND (ce.is_active = true) AND ((ce.expires_at IS NULL) OR (ce.expires_at > now())))))));



  create policy "update_if_owner_admin_or_course_creator"
  on "public"."published_file_library"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.courses c
  WHERE ((c.id = published_file_library.course_id) AND ((public.get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text])) OR ((public.get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = 'editor'::text) AND (c.created_by = ( SELECT auth.uid() AS uid))))))))
with check ((EXISTS ( SELECT 1
   FROM public.courses c
  WHERE ((c.id = published_file_library.course_id) AND ((public.get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text])) OR ((public.get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = 'editor'::text) AND (c.created_by = ( SELECT auth.uid() AS uid))))))));



  create policy "role_permissions_delete_policy"
  on "public"."role_permissions"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = ( SELECT auth.uid() AS uid)) AND (ur.role = 'go_su'::public.app_role)))));



  create policy "role_permissions_insert_policy"
  on "public"."role_permissions"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = ( SELECT auth.uid() AS uid)) AND (ur.role = 'go_su'::public.app_role)))));



  create policy "role_permissions_select_policy"
  on "public"."role_permissions"
  as permissive
  for select
  to authenticated
using (true);



  create policy "role_permissions_update_policy"
  on "public"."role_permissions"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = ( SELECT auth.uid() AS uid)) AND (ur.role = 'go_su'::public.app_role)))))
with check ((EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = ( SELECT auth.uid() AS uid)) AND (ur.role = 'go_su'::public.app_role)))));



  create policy "Authorized users can delete tier limits"
  on "public"."tier_limits"
  as permissive
  for delete
  to authenticated
using (public.authorize('go_su_delete'::public.app_permission));



  create policy "Authorized users can insert tier limits"
  on "public"."tier_limits"
  as permissive
  for insert
  to authenticated
with check (public.authorize('go_su_create'::public.app_permission));



  create policy "Authorized users can update tier limits"
  on "public"."tier_limits"
  as permissive
  for update
  to authenticated
using (public.authorize('go_su_update'::public.app_permission));



  create policy "Public can read tier limits"
  on "public"."tier_limits"
  as permissive
  for select
  to authenticated, anon
using (true);



  create policy "user_notifications_insert_own"
  on "public"."user_notifications"
  as permissive
  for insert
  to authenticated
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "user_notifications_select_own"
  on "public"."user_notifications"
  as permissive
  for select
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "user_notifications_update_own"
  on "public"."user_notifications"
  as permissive
  for update
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)))
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "user_notifications_types_delete_privileged"
  on "public"."user_notifications_types"
  as permissive
  for delete
  to authenticated
using ((public.authorize('go_su_delete'::public.app_permission) OR public.authorize('go_admin_delete'::public.app_permission)));



  create policy "user_notifications_types_insert_privileged"
  on "public"."user_notifications_types"
  as permissive
  for insert
  to authenticated
with check ((public.authorize('go_su_create'::public.app_permission) OR public.authorize('go_admin_create'::public.app_permission)));



  create policy "user_notifications_types_select_authenticated"
  on "public"."user_notifications_types"
  as permissive
  for select
  to authenticated
using (true);



  create policy "user_notifications_types_update_privileged"
  on "public"."user_notifications_types"
  as permissive
  for update
  to authenticated
using ((public.authorize('go_su_update'::public.app_permission) OR public.authorize('go_admin_update'::public.app_permission)));



  create policy "Users can view their own purchases"
  on "public"."user_purchases"
  as permissive
  for select
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Allow auth admin to read user roles"
  on "public"."user_roles"
  as permissive
  for select
  to supabase_auth_admin
using (true);



  create policy "user_wallets_select_own"
  on "public"."user_wallets"
  as permissive
  for select
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "Select: go_su, go_admin, or org owner/admin can read wallet_led"
  on "public"."wallet_ledger_entries"
  as permissive
  for select
  to authenticated
using ((public.authorize('go_su_read'::public.app_permission) OR public.authorize('go_admin_read'::public.app_permission) OR (public.get_user_org_role(COALESCE(( SELECT ow.organization_id
   FROM public.organization_wallets ow
  WHERE (ow.id = wallet_ledger_entries.source_wallet_id)
 LIMIT 1), ( SELECT ow.organization_id
   FROM public.organization_wallets ow
  WHERE (ow.id = wallet_ledger_entries.destination_wallet_id)
 LIMIT 1)), ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text]))));


CREATE TRIGGER trg_block_progress_set_updated_at BEFORE UPDATE ON public.block_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_chapter_progress_set_updated_at BEFORE UPDATE ON public.chapter_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_set_chapter_position BEFORE INSERT ON public.chapters FOR EACH ROW EXECUTE FUNCTION public.set_chapter_position();

CREATE TRIGGER trg_course_categories_set_updated_at BEFORE UPDATE ON public.course_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_ensure_editor_is_valid BEFORE INSERT OR UPDATE ON public.course_editors FOR EACH ROW EXECUTE FUNCTION public.ensure_editor_is_valid();

CREATE TRIGGER trg_enforce_at_least_one_active_tier BEFORE UPDATE ON public.course_pricing_tiers FOR EACH ROW EXECUTE FUNCTION public.enforce_at_least_one_active_pricing_tier();

CREATE TRIGGER trg_handle_free_tier AFTER INSERT OR UPDATE ON public.course_pricing_tiers FOR EACH ROW EXECUTE FUNCTION public.trg_delete_other_tiers_if_free();

CREATE TRIGGER trg_prevent_deactivating_last_free_tier BEFORE UPDATE ON public.course_pricing_tiers FOR EACH ROW WHEN (((old.is_active = true) AND (new.is_active = false))) EXECUTE FUNCTION public.trg_prevent_deactivating_last_free_tier();

CREATE TRIGGER trg_prevent_deleting_last_free_tier BEFORE DELETE ON public.course_pricing_tiers FOR EACH ROW EXECUTE FUNCTION public.trg_prevent_deleting_last_free_tier();

CREATE TRIGGER trg_prevent_last_paid_tier_deletion BEFORE DELETE ON public.course_pricing_tiers FOR EACH ROW EXECUTE FUNCTION public.trg_prevent_deleting_last_paid_tier();

CREATE TRIGGER trg_set_course_pricing_tier_position BEFORE INSERT ON public.course_pricing_tiers FOR EACH ROW EXECUTE FUNCTION public.set_course_pricing_tier_position();

CREATE TRIGGER trg_course_progress_set_updated_at BEFORE UPDATE ON public.course_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_course_sub_categories_set_updated_at BEFORE UPDATE ON public.course_sub_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_add_creator_as_course_editor AFTER INSERT ON public.courses FOR EACH ROW EXECUTE FUNCTION public.add_creator_as_course_editor();

CREATE TRIGGER trg_add_default_free_pricing_tier AFTER INSERT ON public.courses FOR EACH ROW EXECUTE FUNCTION public.add_default_free_pricing_tier();

CREATE TRIGGER trg_validate_subcategory BEFORE INSERT OR UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.validate_subcategory_belongs_to_category();

CREATE TRIGGER trg_set_file_type BEFORE INSERT OR UPDATE ON public.file_library FOR EACH ROW EXECUTE FUNCTION public.set_file_type_from_extension();

CREATE TRIGGER trg_update_timestamp BEFORE UPDATE ON public.file_library FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_gonasi_wallets_updated_at BEFORE UPDATE ON public.gonasi_wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_set_lesson_block_position BEFORE INSERT ON public.lesson_blocks FOR EACH ROW EXECUTE FUNCTION public.set_lesson_block_position();

CREATE TRIGGER trg_increment_lesson_reset_count AFTER DELETE ON public.lesson_progress FOR EACH ROW EXECUTE FUNCTION public.increment_lesson_reset_count();

CREATE TRIGGER trg_lesson_progress_set_updated_at BEFORE UPDATE ON public.lesson_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_lesson_reset_set_updated_at BEFORE UPDATE ON public.lesson_reset_count FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_lesson_types_set_updated_at BEFORE UPDATE ON public.lesson_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_set_lesson_position BEFORE INSERT ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.set_lesson_position();

CREATE TRIGGER after_update_role_on_org_members AFTER UPDATE OF role ON public.organization_members FOR EACH ROW EXECUTE FUNCTION public.delete_course_editors_on_role_change();

CREATE TRIGGER trg_organizations_wallets_updated_at BEFORE UPDATE ON public.organization_wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_assign_launch_subscription AFTER INSERT ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.assign_launch_subscription_to_new_org();

CREATE TRIGGER trg_create_org_ai_credits AFTER INSERT ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.handle_new_organization_ai_credits();

CREATE TRIGGER trg_create_organization_wallets AFTER INSERT ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.create_organization_wallets();

CREATE TRIGGER trg_insert_owner_into_organization_members AFTER INSERT ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.add_or_update_owner_in_organization_members();

CREATE TRIGGER trg_organizations_set_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_update_owner_into_organization_members AFTER UPDATE ON public.organizations FOR EACH ROW WHEN ((old.owned_by IS DISTINCT FROM new.owned_by)) EXECUTE FUNCTION public.add_or_update_owner_in_organization_members();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_course_structure_content_updated_at BEFORE UPDATE ON public.published_course_structure_content FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_published_courses_set_updated_at BEFORE UPDATE ON public.published_courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_set_published_course_version BEFORE INSERT ON public.published_courses FOR EACH ROW EXECUTE FUNCTION public.ensure_incremented_course_version();

CREATE TRIGGER trg_update_published_course_version BEFORE UPDATE ON public.published_courses FOR EACH ROW EXECUTE FUNCTION public.ensure_incremented_course_version();

CREATE TRIGGER trg_set_file_type BEFORE INSERT OR UPDATE ON public.published_file_library FOR EACH ROW EXECUTE FUNCTION public.set_file_type_from_extension();

CREATE TRIGGER trg_update_timestamp BEFORE UPDATE ON public.published_file_library FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER tr_after_insert_tier_limits_notify AFTER INSERT ON public.tier_limits FOR EACH ROW EXECUTE FUNCTION public.notify_tier_limits_change();

CREATE TRIGGER tr_after_update_tier_limits_notify AFTER UPDATE ON public.tier_limits FOR EACH ROW EXECUTE FUNCTION public.notify_tier_limits_change();

CREATE TRIGGER trg_tier_limits_updated_at BEFORE UPDATE ON public.tier_limits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_user_notification_email_dispatch AFTER INSERT ON public.user_notifications FOR EACH ROW EXECUTE FUNCTION public.trigger_user_notification_email_dispatch();

CREATE TRIGGER trg_user_wallets_updated_at BEFORE UPDATE ON public.user_wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_wallet_balance_update AFTER INSERT ON public.wallet_ledger_entries FOR EACH ROW EXECUTE FUNCTION public.update_wallet_balance();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER trg_create_user_wallets AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_user_wallets();


  create policy "Delete: Admins or owning editors can delete published files"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'published_files'::text) AND (EXISTS ( SELECT 1
   FROM public.courses c
  WHERE ((c.id = (split_part(objects.name, '/'::text, 2))::uuid) AND (c.organization_id = (split_part(objects.name, '/'::text, 1))::uuid) AND ((public.get_user_org_role(c.organization_id, auth.uid()) = ANY (ARRAY['owner'::text, 'admin'::text])) OR ((public.get_user_org_role(c.organization_id, auth.uid()) = 'editor'::text) AND (EXISTS ( SELECT 1
           FROM public.course_editors ce
          WHERE ((ce.course_id = c.id) AND (ce.user_id = ( SELECT auth.uid() AS uid))))))))))));



  create policy "Delete: Admins or owning editors can delete published_thumbnail"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'published_thumbnails'::text) AND (EXISTS ( SELECT 1
   FROM public.courses c
  WHERE ((c.id = (split_part(objects.name, '/'::text, 1))::uuid) AND ((public.get_user_org_role(c.organization_id, auth.uid()) = ANY (ARRAY['owner'::text, 'admin'::text])) OR (EXISTS ( SELECT 1
           FROM public.course_editors
          WHERE ((course_editors.course_id = c.id) AND (course_editors.user_id = auth.uid()))))))))));



  create policy "Delete: Admins or owning editors can delete thumbnails"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'thumbnails'::text) AND public.can_user_edit_course((split_part(name, '/'::text, 1))::uuid)));



  create policy "Insert: Org members can upload published_thumbnails"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'published_thumbnails'::text) AND (EXISTS ( SELECT 1
   FROM public.courses c
  WHERE ((c.id = (split_part(objects.name, '/'::text, 1))::uuid) AND (public.get_user_org_role(c.organization_id, auth.uid()) = ANY (ARRAY['owner'::text, 'admin'::text, 'editor'::text])))))));



  create policy "Insert: Org members can upload thumbnails"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'thumbnails'::text) AND public.can_user_edit_course((split_part(name, '/'::text, 1))::uuid)));



  create policy "Insert: Org members with elevated roles can upload published fi"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'published_files'::text) AND (EXISTS ( SELECT 1
   FROM public.courses c
  WHERE ((c.id = (split_part(objects.name, '/'::text, 2))::uuid) AND (c.organization_id = (split_part(objects.name, '/'::text, 1))::uuid) AND (public.get_user_org_role(c.organization_id, auth.uid()) = ANY (ARRAY['owner'::text, 'admin'::text, 'editor'::text])))))));



  create policy "Select: Org members can view thumbnails"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'thumbnails'::text) AND (EXISTS ( SELECT 1
   FROM public.courses c
  WHERE ((c.id = (split_part(objects.name, '/'::text, 1))::uuid) AND (public.get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) IS NOT NULL))))));



  create policy "Select: Org members, enrolled users, or public can view publish"
  on "storage"."objects"
  as permissive
  for select
  to public
using (((bucket_id = 'published_thumbnails'::text) AND ((EXISTS ( SELECT 1
   FROM public.courses c
  WHERE ((c.id = (split_part(objects.name, '/'::text, 1))::uuid) AND (public.get_user_org_role(c.organization_id, auth.uid()) IS NOT NULL)))) OR (EXISTS ( SELECT 1
   FROM public.published_courses pc
  WHERE ((pc.id = (split_part(objects.name, '/'::text, 1))::uuid) AND pc.is_active AND (pc.visibility = 'public'::public.course_access)))) OR (EXISTS ( SELECT 1
   FROM (public.course_enrollments ce
     JOIN public.published_courses pc ON ((pc.id = ce.published_course_id)))
  WHERE ((pc.id = (split_part(objects.name, '/'::text, 1))::uuid) AND pc.is_active AND (ce.user_id = auth.uid()) AND (ce.is_active = true) AND ((ce.expires_at IS NULL) OR (ce.expires_at > now()))))))));



  create policy "Update: Admins or owning editors can update published files"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'published_files'::text) AND (EXISTS ( SELECT 1
   FROM public.courses c
  WHERE ((c.id = (split_part(objects.name, '/'::text, 2))::uuid) AND (c.organization_id = (split_part(objects.name, '/'::text, 1))::uuid) AND ((public.get_user_org_role(c.organization_id, auth.uid()) = ANY (ARRAY['owner'::text, 'admin'::text])) OR ((public.get_user_org_role(c.organization_id, auth.uid()) = 'editor'::text) AND (EXISTS ( SELECT 1
           FROM public.course_editors ce
          WHERE ((ce.course_id = c.id) AND (ce.user_id = ( SELECT auth.uid() AS uid))))))))))))
with check (((bucket_id = 'published_files'::text) AND (EXISTS ( SELECT 1
   FROM public.courses c
  WHERE ((c.id = (split_part(objects.name, '/'::text, 2))::uuid) AND (c.organization_id = (split_part(objects.name, '/'::text, 1))::uuid) AND ((public.get_user_org_role(c.organization_id, auth.uid()) = ANY (ARRAY['owner'::text, 'admin'::text])) OR ((public.get_user_org_role(c.organization_id, auth.uid()) = 'editor'::text) AND (EXISTS ( SELECT 1
           FROM public.course_editors ce
          WHERE ((ce.course_id = c.id) AND (ce.user_id = ( SELECT auth.uid() AS uid))))))))))));



  create policy "Update: Admins or owning editors can update published_thumbnail"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'published_thumbnails'::text) AND (EXISTS ( SELECT 1
   FROM public.courses c
  WHERE ((c.id = (split_part(objects.name, '/'::text, 1))::uuid) AND ((public.get_user_org_role(c.organization_id, auth.uid()) = ANY (ARRAY['owner'::text, 'admin'::text])) OR (EXISTS ( SELECT 1
           FROM public.course_editors
          WHERE ((course_editors.course_id = c.id) AND (course_editors.user_id = auth.uid()))))))))))
with check (((bucket_id = 'published_thumbnails'::text) AND (EXISTS ( SELECT 1
   FROM public.courses c
  WHERE ((c.id = (split_part(objects.name, '/'::text, 1))::uuid) AND ((public.get_user_org_role(c.organization_id, auth.uid()) = ANY (ARRAY['owner'::text, 'admin'::text])) OR (EXISTS ( SELECT 1
           FROM public.course_editors
          WHERE ((course_editors.course_id = c.id) AND (course_editors.user_id = auth.uid()))))))))));



  create policy "Update: Admins or owning editors can update thumbnails"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'thumbnails'::text) AND public.can_user_edit_course((split_part(name, '/'::text, 1))::uuid)))
with check (((bucket_id = 'thumbnails'::text) AND public.can_user_edit_course((split_part(name, '/'::text, 1))::uuid)));



  create policy "delete: org owner/admin or course creator"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'files'::text) AND (EXISTS ( SELECT 1
   FROM public.file_library fl
  WHERE ((fl.path = objects.name) AND public.can_user_edit_course(fl.course_id))))));



  create policy "delete_avatar: only user can delete"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'profile_photos'::text) AND (split_part(name, '/'::text, 1) = (auth.uid())::text)));



  create policy "delete_banner: only org owner/admin"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'organization_banner_photos'::text) AND (EXISTS ( SELECT 1
   FROM public.organizations o
  WHERE ((o.id = (split_part(objects.name, '/'::text, 1))::uuid) AND (public.get_user_org_role(o.id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text])))))));



  create policy "delete_profile: only org owner/admin"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'organization_profile_photos'::text) AND (EXISTS ( SELECT 1
   FROM public.organizations o
  WHERE ((o.id = (split_part(objects.name, '/'::text, 1))::uuid) AND (public.get_user_org_role(o.id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text])))))));



  create policy "insert: org owner/admin or course creator with storage limit"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'files'::text) AND (EXISTS ( SELECT 1
   FROM public.courses c
  WHERE ((c.id = (split_part(objects.name, '/'::text, 2))::uuid) AND (c.organization_id = (split_part(objects.name, '/'::text, 1))::uuid) AND public.can_user_edit_course(c.id) AND (public.check_storage_limit(c.organization_id, COALESCE(((objects.metadata ->> 'size'::text))::bigint, (0)::bigint)) = true))))));



  create policy "insert_avatar: only user can upload"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'profile_photos'::text) AND (split_part(name, '/'::text, 1) = (auth.uid())::text)));



  create policy "insert_banner: only org owner/admin can upload"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'organization_banner_photos'::text) AND (EXISTS ( SELECT 1
   FROM public.organizations o
  WHERE ((o.id = (split_part(objects.name, '/'::text, 1))::uuid) AND (public.get_user_org_role(o.id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text])))))));



  create policy "insert_profile: only org owner/admin can upload"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'organization_profile_photos'::text) AND (EXISTS ( SELECT 1
   FROM public.organizations o
  WHERE ((o.id = (split_part(objects.name, '/'::text, 1))::uuid) AND (public.get_user_org_role(o.id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text])))))));



  create policy "select: enrolled users or org members can view published files"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'published_files'::text) AND ((EXISTS ( SELECT 1
   FROM (public.course_enrollments ce
     JOIN public.published_courses pc ON ((pc.id = ce.published_course_id)))
  WHERE ((pc.organization_id = (split_part(objects.name, '/'::text, 1))::uuid) AND (pc.id = (split_part(objects.name, '/'::text, 2))::uuid) AND pc.is_active AND (ce.user_id = ( SELECT auth.uid() AS uid)) AND (ce.is_active = true) AND ((ce.expires_at IS NULL) OR (ce.expires_at > now()))))) OR (public.get_user_org_role((split_part(name, '/'::text, 1))::uuid, ( SELECT auth.uid() AS uid)) IS NOT NULL))));



  create policy "select: org members can view files"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'files'::text) AND (EXISTS ( SELECT 1
   FROM public.file_library fl
  WHERE ((fl.path = objects.name) AND public.can_user_edit_course(fl.course_id))))));



  create policy "select_avatar: public if profile is public"
  on "storage"."objects"
  as permissive
  for select
  to authenticated, anon
using (((bucket_id = 'profile_photos'::text) AND ((split_part(name, '/'::text, 1) = (auth.uid())::text) OR (EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id)::text = split_part(objects.name, '/'::text, 1)))))));



  create policy "select_banner: public if org is public"
  on "storage"."objects"
  as permissive
  for select
  to authenticated, anon
using (((bucket_id = 'organization_banner_photos'::text) AND (EXISTS ( SELECT 1
   FROM public.organizations o
  WHERE ((o.id = (split_part(objects.name, '/'::text, 1))::uuid) AND (o.is_public = true))))));



  create policy "select_profile: public if org is public"
  on "storage"."objects"
  as permissive
  for select
  to authenticated, anon
using (((bucket_id = 'organization_profile_photos'::text) AND (EXISTS ( SELECT 1
   FROM public.organizations o
  WHERE ((o.id = (split_part(objects.name, '/'::text, 1))::uuid) AND (o.is_public = true))))));



  create policy "update: org owner/admin or course creator"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'files'::text) AND (EXISTS ( SELECT 1
   FROM public.file_library fl
  WHERE ((fl.path = objects.name) AND public.can_user_edit_course(fl.course_id))))))
with check (((bucket_id = 'files'::text) AND (EXISTS ( SELECT 1
   FROM public.file_library fl
  WHERE ((fl.path = objects.name) AND public.can_user_edit_course(fl.course_id))))));



  create policy "update_avatar: only user can update"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'profile_photos'::text) AND (split_part(name, '/'::text, 1) = (auth.uid())::text)))
with check (((bucket_id = 'profile_photos'::text) AND (split_part(name, '/'::text, 1) = (auth.uid())::text)));



  create policy "update_banner: only org owner/admin"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'organization_banner_photos'::text) AND (EXISTS ( SELECT 1
   FROM public.organizations o
  WHERE ((o.id = (split_part(objects.name, '/'::text, 1))::uuid) AND (public.get_user_org_role(o.id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text])))))))
with check (((bucket_id = 'organization_banner_photos'::text) AND (EXISTS ( SELECT 1
   FROM public.organizations o
  WHERE ((o.id = (split_part(objects.name, '/'::text, 1))::uuid) AND (public.get_user_org_role(o.id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text])))))));



  create policy "update_profile: only org owner/admin"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'organization_profile_photos'::text) AND (EXISTS ( SELECT 1
   FROM public.organizations o
  WHERE ((o.id = (split_part(objects.name, '/'::text, 1))::uuid) AND (public.get_user_org_role(o.id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text])))))))
with check (((bucket_id = 'organization_profile_photos'::text) AND (EXISTS ( SELECT 1
   FROM public.organizations o
  WHERE ((o.id = (split_part(objects.name, '/'::text, 1))::uuid) AND (public.get_user_org_role(o.id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text])))))));



