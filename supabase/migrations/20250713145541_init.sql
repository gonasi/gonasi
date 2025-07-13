create type "public"."analytics_level" as enum ('basic', 'intermediate', 'advanced', 'enterprise');

create type "public"."app_permission" as enum ('course_categories.insert', 'course_categories.update', 'course_categories.delete', 'course_sub_categories.insert', 'course_sub_categories.update', 'course_sub_categories.delete', 'featured_courses_pricing.insert', 'featured_courses_pricing.update', 'featured_courses_pricing.delete', 'lesson_types.insert', 'lesson_types.update', 'lesson_types.delete', 'pricing_tier.crud');

create type "public"."app_role" as enum ('go_su', 'go_admin', 'go_staff', 'user');

create type "public"."course_access" as enum ('public', 'private');

create type "public"."currency_code" as enum ('KES', 'USD');

create type "public"."file_type" as enum ('image', 'audio', 'video', 'model3d', 'document', 'other');

create type "public"."invite_delivery_status" as enum ('pending', 'sent', 'failed');

create type "public"."org_role" as enum ('owner', 'admin', 'editor');

create type "public"."payment_frequency" as enum ('monthly', 'bi_monthly', 'quarterly', 'semi_annual', 'annual');

create type "public"."profile_mode" as enum ('personal', 'organization');

create type "public"."subscription_status" as enum ('active', 'canceled', 'past_due', 'trialing', 'incomplete');

create type "public"."subscription_tier" as enum ('launch', 'scale', 'impact', 'enterprise');

create type "public"."support_level" as enum ('community', 'email', 'priority', 'dedicated');

create table "public"."chapters" (
    "id" uuid not null default uuid_generate_v4(),
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
    "id" uuid not null default uuid_generate_v4(),
    "name" text not null,
    "description" text not null,
    "course_count" bigint not null default 0,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_by" uuid,
    "updated_by" uuid
);


alter table "public"."course_categories" enable row level security;

create table "public"."course_enrollment_activities" (
    "id" uuid not null default uuid_generate_v4(),
    "enrollment_id" uuid not null,
    "pricing_tier_id" uuid,
    "tier_name" text,
    "tier_description" text,
    "payment_frequency" payment_frequency not null,
    "currency_code" currency_code not null,
    "is_free" boolean not null,
    "price_paid" numeric(19,4) not null default 0,
    "promotional_price" numeric(19,4),
    "was_promotional" boolean not null default false,
    "access_start" timestamp with time zone not null,
    "access_end" timestamp with time zone not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_by" uuid not null
);


create table "public"."course_enrollments" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "published_course_id" uuid not null,
    "organization_id" uuid not null,
    "enrolled_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "expires_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
);


create table "public"."course_payments" (
    "id" uuid not null default uuid_generate_v4(),
    "enrollment_id" uuid not null,
    "enrollment_activity_id" uuid not null,
    "amount_paid" numeric(19,4) not null,
    "currency_code" currency_code not null,
    "payment_method" text not null,
    "payment_processor_id" text,
    "payment_processor_fee" numeric(19,4),
    "net_amount" numeric(19,4) not null,
    "payment_status" text not null default 'pending'::text,
    "payment_intent_id" text,
    "organization_id" uuid not null,
    "payout_status" text not null default 'pending'::text,
    "payout_processed_at" timestamp with time zone,
    "payment_metadata" jsonb,
    "refund_amount" numeric(19,4) default 0,
    "refund_reason" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_by" uuid not null
);


create table "public"."course_pricing_tiers" (
    "id" uuid not null default uuid_generate_v4(),
    "organization_id" uuid not null,
    "course_id" uuid not null,
    "payment_frequency" payment_frequency not null,
    "is_free" boolean not null default true,
    "price" numeric(19,4) not null,
    "currency_code" currency_code not null default 'KES'::currency_code,
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

create table "public"."course_sub_categories" (
    "id" uuid not null default uuid_generate_v4(),
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
    "id" uuid not null default uuid_generate_v4(),
    "category_id" uuid,
    "subcategory_id" uuid,
    "organization_id" uuid,
    "owned_by" uuid,
    "name" text not null,
    "description" text,
    "image_url" text,
    "blur_hash" text,
    "visibility" course_access not null default 'public'::course_access,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "last_published" timestamp with time zone,
    "created_by" uuid,
    "updated_by" uuid
);


alter table "public"."courses" enable row level security;

create table "public"."file_library" (
    "id" uuid not null default uuid_generate_v4(),
    "course_id" uuid not null,
    "organization_id" uuid not null,
    "created_by" uuid,
    "updated_by" uuid,
    "name" text not null,
    "path" text not null,
    "size" bigint not null,
    "mime_type" text not null,
    "extension" text not null,
    "file_type" file_type not null default 'other'::file_type,
    "blur_preview" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."file_library" enable row level security;

create table "public"."lesson_blocks" (
    "id" uuid not null default uuid_generate_v4(),
    "lesson_id" uuid not null,
    "course_id" uuid not null,
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

create table "public"."lesson_types" (
    "id" uuid not null default uuid_generate_v4(),
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
    "id" uuid not null default uuid_generate_v4(),
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
    "role" org_role not null,
    "invited_by" uuid not null,
    "token" text not null,
    "resend_count" integer not null default 0,
    "last_sent_at" timestamp with time zone not null default now(),
    "expires_at" timestamp with time zone not null,
    "accepted_at" timestamp with time zone,
    "accepted_by" uuid,
    "revoked_at" timestamp with time zone,
    "delivery_status" invite_delivery_status not null default 'pending'::invite_delivery_status,
    "delivery_logs" jsonb not null default '[]'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."organization_invites" enable row level security;

create table "public"."organization_members" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "user_id" uuid not null,
    "role" org_role not null,
    "invited_by" uuid,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."organization_members" enable row level security;

create table "public"."organizations" (
    "id" uuid not null default uuid_generate_v4(),
    "name" text not null,
    "handle" text not null,
    "description" text,
    "website_url" text,
    "avatar_url" text,
    "blur_hash" text,
    "banner_url" text,
    "banner_blur_hash" text,
    "is_public" boolean not null default false,
    "is_verified" boolean not null default false,
    "email" text,
    "phone_number" text,
    "phone_number_verified" boolean not null default false,
    "email_verified" boolean not null default false,
    "whatsapp_number" text,
    "location" text,
    "tier" subscription_tier not null default 'launch'::subscription_tier,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_by" uuid,
    "owned_by" uuid,
    "updated_by" uuid,
    "deleted_by" uuid
);


alter table "public"."organizations" enable row level security;

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
    "mode" profile_mode not null default 'personal'::profile_mode,
    "active_organization_id" uuid,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."profiles" enable row level security;

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
    "visibility" course_access not null default 'public'::course_access,
    "course_structure" jsonb not null,
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


create table "public"."role_permissions" (
    "id" uuid not null default uuid_generate_v4(),
    "role" app_role not null,
    "permission" app_permission not null
);


alter table "public"."role_permissions" enable row level security;

create table "public"."tier_limits" (
    "tier" subscription_tier not null,
    "max_organizations_per_user" integer not null,
    "storage_limit_mb_per_org" integer not null,
    "max_members_per_org" integer not null,
    "max_free_courses_per_org" integer not null,
    "ai_tools_enabled" boolean not null default false,
    "ai_usage_limit_monthly" integer,
    "custom_domains_enabled" boolean not null default false,
    "max_custom_domains" integer,
    "analytics_level" analytics_level not null,
    "support_level" support_level not null,
    "platform_fee_percentage" numeric(5,2) not null default 15.00,
    "white_label_enabled" boolean not null default false,
    "price_monthly_usd" numeric(10,2) not null default 0.00,
    "price_yearly_usd" numeric(10,2) not null default 0.00
);


alter table "public"."tier_limits" enable row level security;

create table "public"."user_roles" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "role" app_role not null
);


alter table "public"."user_roles" enable row level security;

CREATE UNIQUE INDEX chapters_pkey ON public.chapters USING btree (id);

CREATE UNIQUE INDEX course_categories_pkey ON public.course_categories USING btree (id);

CREATE UNIQUE INDEX course_enrollment_activities_pkey ON public.course_enrollment_activities USING btree (id);

CREATE UNIQUE INDEX course_enrollments_pkey ON public.course_enrollments USING btree (id);

CREATE UNIQUE INDEX course_payments_pkey ON public.course_payments USING btree (id);

CREATE UNIQUE INDEX course_pricing_tiers_pkey ON public.course_pricing_tiers USING btree (id);

CREATE UNIQUE INDEX course_sub_categories_pkey ON public.course_sub_categories USING btree (id);

CREATE UNIQUE INDEX courses_organization_id_name_key ON public.courses USING btree (organization_id, name);

CREATE UNIQUE INDEX courses_pkey ON public.courses USING btree (id);

CREATE UNIQUE INDEX file_library_pkey ON public.file_library USING btree (id);

CREATE INDEX idx_chapters_course_id ON public.chapters USING btree (course_id);

CREATE INDEX idx_chapters_created_by ON public.chapters USING btree (created_by);

CREATE INDEX idx_chapters_organization_id ON public.chapters USING btree (organization_id);

CREATE INDEX idx_chapters_position ON public.chapters USING btree (course_id, "position");

CREATE INDEX idx_chapters_updated_by ON public.chapters USING btree (updated_by);

CREATE INDEX idx_course_categories_created_by ON public.course_categories USING btree (created_by);

CREATE INDEX idx_course_categories_updated_by ON public.course_categories USING btree (updated_by);

CREATE INDEX idx_course_enrollments_completed_at ON public.course_enrollments USING btree (completed_at);

CREATE INDEX idx_course_enrollments_enrolled_at ON public.course_enrollments USING btree (enrolled_at);

CREATE INDEX idx_course_enrollments_expires_at ON public.course_enrollments USING btree (expires_at);

CREATE INDEX idx_course_enrollments_is_active ON public.course_enrollments USING btree (is_active);

CREATE INDEX idx_course_enrollments_organization_id ON public.course_enrollments USING btree (organization_id);

CREATE INDEX idx_course_enrollments_published_course_id ON public.course_enrollments USING btree (published_course_id);

CREATE INDEX idx_course_enrollments_user_id ON public.course_enrollments USING btree (user_id);

CREATE INDEX idx_course_payments_created_at ON public.course_payments USING btree (created_at);

CREATE INDEX idx_course_payments_enrollment_activity_id ON public.course_payments USING btree (enrollment_activity_id);

CREATE INDEX idx_course_payments_enrollment_id ON public.course_payments USING btree (enrollment_id);

CREATE INDEX idx_course_payments_organization_id ON public.course_payments USING btree (organization_id);

CREATE INDEX idx_course_payments_payment_status ON public.course_payments USING btree (payment_status);

CREATE INDEX idx_course_payments_payout_status ON public.course_payments USING btree (payout_status);

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

CREATE INDEX idx_course_sub_categories_category_id ON public.course_sub_categories USING btree (category_id);

CREATE INDEX idx_course_sub_categories_created_by ON public.course_sub_categories USING btree (created_by);

CREATE INDEX idx_course_sub_categories_updated_by ON public.course_sub_categories USING btree (updated_by);

CREATE INDEX idx_courses_category_id ON public.courses USING btree (category_id);

CREATE INDEX idx_courses_created_by ON public.courses USING btree (created_by);

CREATE INDEX idx_courses_organization_id ON public.courses USING btree (organization_id);

CREATE INDEX idx_courses_owned_by ON public.courses USING btree (owned_by);

CREATE INDEX idx_courses_subcategory_id ON public.courses USING btree (subcategory_id);

CREATE INDEX idx_courses_updated_by ON public.courses USING btree (updated_by);

CREATE INDEX idx_courses_visibility ON public.courses USING btree (visibility);

CREATE INDEX idx_enrollment_activities_access_window ON public.course_enrollment_activities USING btree (access_start, access_end);

CREATE INDEX idx_enrollment_activities_created_at ON public.course_enrollment_activities USING btree (created_at);

CREATE INDEX idx_enrollment_activities_created_by ON public.course_enrollment_activities USING btree (created_by);

CREATE INDEX idx_enrollment_activities_enrollment_id ON public.course_enrollment_activities USING btree (enrollment_id);

CREATE INDEX idx_enrollment_activities_pricing_tier_id ON public.course_enrollment_activities USING btree (pricing_tier_id);

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

CREATE INDEX idx_lesson_blocks_course_id ON public.lesson_blocks USING btree (course_id);

CREATE INDEX idx_lesson_blocks_created_by ON public.lesson_blocks USING btree (created_by);

CREATE INDEX idx_lesson_blocks_lesson_id ON public.lesson_blocks USING btree (lesson_id);

CREATE INDEX idx_lesson_blocks_organization_id ON public.lesson_blocks USING btree (organization_id);

CREATE INDEX idx_lesson_blocks_position ON public.lesson_blocks USING btree ("position");

CREATE INDEX idx_lesson_blocks_updated_by ON public.lesson_blocks USING btree (updated_by);

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

CREATE INDEX idx_organization_members_invited_by ON public.organization_members USING btree (invited_by);

CREATE INDEX idx_organization_members_org_id ON public.organization_members USING btree (organization_id);

CREATE INDEX idx_organization_members_user_id ON public.organization_members USING btree (user_id);

CREATE INDEX idx_organizations_created_at ON public.organizations USING btree (created_at);

CREATE INDEX idx_organizations_created_by ON public.organizations USING btree (created_by);

CREATE INDEX idx_organizations_deleted_by ON public.organizations USING btree (deleted_by);

CREATE INDEX idx_organizations_owned_by ON public.organizations USING btree (owned_by);

CREATE INDEX idx_organizations_tier ON public.organizations USING btree (tier);

CREATE INDEX idx_organizations_updated_by ON public.organizations USING btree (updated_by);

CREATE INDEX idx_profiles_active_organization_id ON public.profiles USING btree (active_organization_id);

CREATE INDEX idx_profiles_country_code ON public.profiles USING btree (country_code);

CREATE INDEX idx_profiles_created_at ON public.profiles USING btree (created_at);

CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);

CREATE INDEX idx_profiles_username ON public.profiles USING btree (username) WHERE (username IS NOT NULL);

CREATE INDEX idx_profiles_verified_users ON public.profiles USING btree (id) WHERE (account_verified = true);

CREATE INDEX idx_published_courses_category_id ON public.published_courses USING btree (category_id);

CREATE INDEX idx_published_courses_chapters ON public.published_courses USING gin (((course_structure -> 'chapters'::text)));

CREATE INDEX idx_published_courses_enrollments ON public.published_courses USING btree (total_enrollments);

CREATE INDEX idx_published_courses_has_free ON public.published_courses USING btree (has_free_tier);

CREATE INDEX idx_published_courses_id_version ON public.published_courses USING btree (id, version DESC);

CREATE INDEX idx_published_courses_is_active ON public.published_courses USING btree (is_active) WHERE (is_active = true);

CREATE INDEX idx_published_courses_lessons ON public.published_courses USING gin (((course_structure -> 'lessons'::text)));

CREATE INDEX idx_published_courses_min_price ON public.published_courses USING btree (min_price);

CREATE INDEX idx_published_courses_org_active ON public.published_courses USING btree (organization_id, is_active);

CREATE INDEX idx_published_courses_org_id ON public.published_courses USING btree (organization_id);

CREATE INDEX idx_published_courses_published_at ON public.published_courses USING btree (published_at);

CREATE INDEX idx_published_courses_published_by ON public.published_courses USING btree (published_by);

CREATE INDEX idx_published_courses_rating ON public.published_courses USING btree (average_rating) WHERE (average_rating IS NOT NULL);

CREATE INDEX idx_published_courses_structure_gin ON public.published_courses USING gin (course_structure);

CREATE INDEX idx_published_courses_subcategory_id ON public.published_courses USING btree (subcategory_id);

CREATE INDEX idx_published_courses_version ON public.published_courses USING btree (id, version);

CREATE INDEX idx_published_courses_visibility ON public.published_courses USING btree (visibility);

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);

CREATE UNIQUE INDEX lesson_blocks_pkey ON public.lesson_blocks USING btree (id);

CREATE UNIQUE INDEX lesson_types_bg_color_key ON public.lesson_types USING btree (bg_color);

CREATE UNIQUE INDEX lesson_types_name_key ON public.lesson_types USING btree (name);

CREATE UNIQUE INDEX lesson_types_pkey ON public.lesson_types USING btree (id);

CREATE UNIQUE INDEX lessons_pkey ON public.lessons USING btree (id);

CREATE UNIQUE INDEX one_owner_per_organization ON public.organization_members USING btree (organization_id) WHERE (role = 'owner'::org_role);

CREATE UNIQUE INDEX organization_invites_pkey ON public.organization_invites USING btree (id);

CREATE UNIQUE INDEX organization_invites_token_key ON public.organization_invites USING btree (token);

CREATE UNIQUE INDEX organization_members_organization_id_user_id_key ON public.organization_members USING btree (organization_id, user_id);

CREATE UNIQUE INDEX organization_members_pkey ON public.organization_members USING btree (id);

CREATE UNIQUE INDEX organizations_handle_key ON public.organizations USING btree (handle);

CREATE UNIQUE INDEX organizations_pkey ON public.organizations USING btree (id);

CREATE UNIQUE INDEX profiles_email_key ON public.profiles USING btree (email);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX profiles_username_key ON public.profiles USING btree (username);

CREATE UNIQUE INDEX published_courses_pkey ON public.published_courses USING btree (id);

CREATE UNIQUE INDEX role_permissions_pkey ON public.role_permissions USING btree (id);

CREATE UNIQUE INDEX role_permissions_role_permission_key ON public.role_permissions USING btree (role, permission);

CREATE UNIQUE INDEX tier_limits_pkey ON public.tier_limits USING btree (tier);

CREATE UNIQUE INDEX uniq_course_sub_categories_name_per_category ON public.course_sub_categories USING btree (category_id, name);

CREATE UNIQUE INDEX unique_chapter_position_per_course ON public.chapters USING btree (course_id, "position");

CREATE UNIQUE INDEX unique_file_path_per_course ON public.file_library USING btree (course_id, path);

CREATE UNIQUE INDEX unique_lesson_block_position_per_lesson ON public.lesson_blocks USING btree (lesson_id, "position");

CREATE UNIQUE INDEX unique_lesson_position_per_chapter ON public.lessons USING btree (chapter_id, "position");

CREATE UNIQUE INDEX unique_pending_invite_per_user ON public.organization_invites USING btree (organization_id, email) WHERE ((accepted_at IS NULL) AND (revoked_at IS NULL));

CREATE UNIQUE INDEX uq_one_active_published_course ON public.published_courses USING btree (id, is_active);

CREATE UNIQUE INDEX uq_one_active_tier_per_frequency ON public.course_pricing_tiers USING btree (course_id, payment_frequency, is_active);

CREATE UNIQUE INDEX uq_user_course ON public.course_enrollments USING btree (user_id, published_course_id);

CREATE UNIQUE INDEX user_roles_pkey ON public.user_roles USING btree (id);

CREATE UNIQUE INDEX user_roles_user_id_role_key ON public.user_roles USING btree (user_id, role);

alter table "public"."chapters" add constraint "chapters_pkey" PRIMARY KEY using index "chapters_pkey";

alter table "public"."course_categories" add constraint "course_categories_pkey" PRIMARY KEY using index "course_categories_pkey";

alter table "public"."course_enrollment_activities" add constraint "course_enrollment_activities_pkey" PRIMARY KEY using index "course_enrollment_activities_pkey";

alter table "public"."course_enrollments" add constraint "course_enrollments_pkey" PRIMARY KEY using index "course_enrollments_pkey";

alter table "public"."course_payments" add constraint "course_payments_pkey" PRIMARY KEY using index "course_payments_pkey";

alter table "public"."course_pricing_tiers" add constraint "course_pricing_tiers_pkey" PRIMARY KEY using index "course_pricing_tiers_pkey";

alter table "public"."course_sub_categories" add constraint "course_sub_categories_pkey" PRIMARY KEY using index "course_sub_categories_pkey";

alter table "public"."courses" add constraint "courses_pkey" PRIMARY KEY using index "courses_pkey";

alter table "public"."file_library" add constraint "file_library_pkey" PRIMARY KEY using index "file_library_pkey";

alter table "public"."lesson_blocks" add constraint "lesson_blocks_pkey" PRIMARY KEY using index "lesson_blocks_pkey";

alter table "public"."lesson_types" add constraint "lesson_types_pkey" PRIMARY KEY using index "lesson_types_pkey";

alter table "public"."lessons" add constraint "lessons_pkey" PRIMARY KEY using index "lessons_pkey";

alter table "public"."organization_invites" add constraint "organization_invites_pkey" PRIMARY KEY using index "organization_invites_pkey";

alter table "public"."organization_members" add constraint "organization_members_pkey" PRIMARY KEY using index "organization_members_pkey";

alter table "public"."organizations" add constraint "organizations_pkey" PRIMARY KEY using index "organizations_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."published_courses" add constraint "published_courses_pkey" PRIMARY KEY using index "published_courses_pkey";

alter table "public"."role_permissions" add constraint "role_permissions_pkey" PRIMARY KEY using index "role_permissions_pkey";

alter table "public"."tier_limits" add constraint "tier_limits_pkey" PRIMARY KEY using index "tier_limits_pkey";

alter table "public"."user_roles" add constraint "user_roles_pkey" PRIMARY KEY using index "user_roles_pkey";

alter table "public"."chapters" add constraint "chapters_course_id_fkey" FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE not valid;

alter table "public"."chapters" validate constraint "chapters_course_id_fkey";

alter table "public"."chapters" add constraint "chapters_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."chapters" validate constraint "chapters_created_by_fkey";

alter table "public"."chapters" add constraint "chapters_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE not valid;

alter table "public"."chapters" validate constraint "chapters_organization_id_fkey";

alter table "public"."chapters" add constraint "chapters_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."chapters" validate constraint "chapters_updated_by_fkey";

alter table "public"."chapters" add constraint "unique_chapter_position_per_course" UNIQUE using index "unique_chapter_position_per_course";

alter table "public"."course_categories" add constraint "course_categories_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."course_categories" validate constraint "course_categories_created_by_fkey";

alter table "public"."course_categories" add constraint "course_categories_description_check" CHECK ((char_length(description) > 0)) not valid;

alter table "public"."course_categories" validate constraint "course_categories_description_check";

alter table "public"."course_categories" add constraint "course_categories_name_check" CHECK ((char_length(name) > 0)) not valid;

alter table "public"."course_categories" validate constraint "course_categories_name_check";

alter table "public"."course_categories" add constraint "course_categories_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."course_categories" validate constraint "course_categories_updated_by_fkey";

alter table "public"."course_enrollment_activities" add constraint "course_enrollment_activities_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."course_enrollment_activities" validate constraint "course_enrollment_activities_created_by_fkey";

alter table "public"."course_enrollment_activities" add constraint "course_enrollment_activities_enrollment_id_fkey" FOREIGN KEY (enrollment_id) REFERENCES course_enrollments(id) ON DELETE CASCADE not valid;

alter table "public"."course_enrollment_activities" validate constraint "course_enrollment_activities_enrollment_id_fkey";

alter table "public"."course_enrollment_activities" add constraint "course_enrollment_activities_pricing_tier_id_fkey" FOREIGN KEY (pricing_tier_id) REFERENCES course_pricing_tiers(id) not valid;

alter table "public"."course_enrollment_activities" validate constraint "course_enrollment_activities_pricing_tier_id_fkey";

alter table "public"."course_enrollments" add constraint "course_enrollments_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE not valid;

alter table "public"."course_enrollments" validate constraint "course_enrollments_organization_id_fkey";

alter table "public"."course_enrollments" add constraint "course_enrollments_published_course_id_fkey" FOREIGN KEY (published_course_id) REFERENCES published_courses(id) ON DELETE CASCADE not valid;

alter table "public"."course_enrollments" validate constraint "course_enrollments_published_course_id_fkey";

alter table "public"."course_enrollments" add constraint "course_enrollments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."course_enrollments" validate constraint "course_enrollments_user_id_fkey";

alter table "public"."course_enrollments" add constraint "uq_user_course" UNIQUE using index "uq_user_course";

alter table "public"."course_payments" add constraint "chk_payment_amounts" CHECK (((amount_paid >= (0)::numeric) AND (net_amount >= (0)::numeric))) not valid;

alter table "public"."course_payments" validate constraint "chk_payment_amounts";

alter table "public"."course_payments" add constraint "chk_payment_status" CHECK ((payment_status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'refunded'::text]))) not valid;

alter table "public"."course_payments" validate constraint "chk_payment_status";

alter table "public"."course_payments" add constraint "chk_payout_status" CHECK ((payout_status = ANY (ARRAY['pending'::text, 'processed'::text, 'failed'::text]))) not valid;

alter table "public"."course_payments" validate constraint "chk_payout_status";

alter table "public"."course_payments" add constraint "chk_refund_amount" CHECK (((refund_amount >= (0)::numeric) AND (refund_amount <= amount_paid))) not valid;

alter table "public"."course_payments" validate constraint "chk_refund_amount";

alter table "public"."course_payments" add constraint "course_payments_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."course_payments" validate constraint "course_payments_created_by_fkey";

alter table "public"."course_payments" add constraint "course_payments_enrollment_activity_id_fkey" FOREIGN KEY (enrollment_activity_id) REFERENCES course_enrollment_activities(id) ON DELETE CASCADE not valid;

alter table "public"."course_payments" validate constraint "course_payments_enrollment_activity_id_fkey";

alter table "public"."course_payments" add constraint "course_payments_enrollment_id_fkey" FOREIGN KEY (enrollment_id) REFERENCES course_enrollments(id) ON DELETE CASCADE not valid;

alter table "public"."course_payments" validate constraint "course_payments_enrollment_id_fkey";

alter table "public"."course_payments" add constraint "course_payments_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE not valid;

alter table "public"."course_payments" validate constraint "course_payments_organization_id_fkey";

alter table "public"."course_pricing_tiers" add constraint "chk_free_has_no_promo" CHECK (((is_free = false) OR ((promotional_price IS NULL) AND (promotion_start_date IS NULL) AND (promotion_end_date IS NULL)))) not valid;

alter table "public"."course_pricing_tiers" validate constraint "chk_free_has_no_promo";

alter table "public"."course_pricing_tiers" add constraint "chk_price_nonfree" CHECK (((is_free = true) OR (price > (0)::numeric))) not valid;

alter table "public"."course_pricing_tiers" validate constraint "chk_price_nonfree";

alter table "public"."course_pricing_tiers" add constraint "chk_promotion_dates" CHECK (((promotion_start_date IS NULL) OR (promotion_end_date IS NULL) OR (promotion_start_date < promotion_end_date))) not valid;

alter table "public"."course_pricing_tiers" validate constraint "chk_promotion_dates";

alter table "public"."course_pricing_tiers" add constraint "chk_promotional_price" CHECK (((is_free = true) OR (promotional_price IS NULL) OR (promotional_price < price))) not valid;

alter table "public"."course_pricing_tiers" validate constraint "chk_promotional_price";

alter table "public"."course_pricing_tiers" add constraint "course_pricing_tiers_course_id_fkey" FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE not valid;

alter table "public"."course_pricing_tiers" validate constraint "course_pricing_tiers_course_id_fkey";

alter table "public"."course_pricing_tiers" add constraint "course_pricing_tiers_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."course_pricing_tiers" validate constraint "course_pricing_tiers_created_by_fkey";

alter table "public"."course_pricing_tiers" add constraint "course_pricing_tiers_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE not valid;

alter table "public"."course_pricing_tiers" validate constraint "course_pricing_tiers_organization_id_fkey";

alter table "public"."course_pricing_tiers" add constraint "course_pricing_tiers_price_check" CHECK ((price >= (0)::numeric)) not valid;

alter table "public"."course_pricing_tiers" validate constraint "course_pricing_tiers_price_check";

alter table "public"."course_pricing_tiers" add constraint "course_pricing_tiers_promotional_price_check" CHECK ((promotional_price >= (0)::numeric)) not valid;

alter table "public"."course_pricing_tiers" validate constraint "course_pricing_tiers_promotional_price_check";

alter table "public"."course_pricing_tiers" add constraint "course_pricing_tiers_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."course_pricing_tiers" validate constraint "course_pricing_tiers_updated_by_fkey";

alter table "public"."course_pricing_tiers" add constraint "uq_one_active_tier_per_frequency" UNIQUE using index "uq_one_active_tier_per_frequency" DEFERRABLE INITIALLY DEFERRED;

alter table "public"."course_sub_categories" add constraint "course_sub_categories_category_id_fkey" FOREIGN KEY (category_id) REFERENCES course_categories(id) ON DELETE CASCADE not valid;

alter table "public"."course_sub_categories" validate constraint "course_sub_categories_category_id_fkey";

alter table "public"."course_sub_categories" add constraint "course_sub_categories_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."course_sub_categories" validate constraint "course_sub_categories_created_by_fkey";

alter table "public"."course_sub_categories" add constraint "course_sub_categories_name_check" CHECK ((char_length(name) > 0)) not valid;

alter table "public"."course_sub_categories" validate constraint "course_sub_categories_name_check";

alter table "public"."course_sub_categories" add constraint "course_sub_categories_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."course_sub_categories" validate constraint "course_sub_categories_updated_by_fkey";

alter table "public"."courses" add constraint "chk_course_owner" CHECK (((organization_id IS NOT NULL) OR (owned_by IS NOT NULL))) not valid;

alter table "public"."courses" validate constraint "chk_course_owner";

alter table "public"."courses" add constraint "courses_category_id_fkey" FOREIGN KEY (category_id) REFERENCES course_categories(id) ON DELETE SET NULL not valid;

alter table "public"."courses" validate constraint "courses_category_id_fkey";

alter table "public"."courses" add constraint "courses_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."courses" validate constraint "courses_created_by_fkey";

alter table "public"."courses" add constraint "courses_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE not valid;

alter table "public"."courses" validate constraint "courses_organization_id_fkey";

alter table "public"."courses" add constraint "courses_organization_id_name_key" UNIQUE using index "courses_organization_id_name_key";

alter table "public"."courses" add constraint "courses_owned_by_fkey" FOREIGN KEY (owned_by) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."courses" validate constraint "courses_owned_by_fkey";

alter table "public"."courses" add constraint "courses_subcategory_id_fkey" FOREIGN KEY (subcategory_id) REFERENCES course_sub_categories(id) ON DELETE SET NULL not valid;

alter table "public"."courses" validate constraint "courses_subcategory_id_fkey";

alter table "public"."courses" add constraint "courses_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."courses" validate constraint "courses_updated_by_fkey";

alter table "public"."file_library" add constraint "file_library_course_id_fkey" FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE not valid;

alter table "public"."file_library" validate constraint "file_library_course_id_fkey";

alter table "public"."file_library" add constraint "file_library_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."file_library" validate constraint "file_library_created_by_fkey";

alter table "public"."file_library" add constraint "file_library_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE not valid;

alter table "public"."file_library" validate constraint "file_library_organization_id_fkey";

alter table "public"."file_library" add constraint "file_library_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."file_library" validate constraint "file_library_updated_by_fkey";

alter table "public"."file_library" add constraint "unique_file_path_per_course" UNIQUE using index "unique_file_path_per_course";

alter table "public"."file_library" add constraint "valid_file_extension" CHECK ((((file_type = 'image'::file_type) AND (lower(extension) = ANY (ARRAY['jpg'::text, 'jpeg'::text, 'png'::text, 'gif'::text, 'webp'::text, 'svg'::text, 'bmp'::text, 'tif'::text, 'tiff'::text, 'heic'::text]))) OR ((file_type = 'audio'::file_type) AND (lower(extension) = ANY (ARRAY['mp3'::text, 'wav'::text, 'aac'::text, 'flac'::text, 'ogg'::text, 'm4a'::text, 'aiff'::text, 'aif'::text]))) OR ((file_type = 'video'::file_type) AND (lower(extension) = ANY (ARRAY['mp4'::text, 'webm'::text, 'mov'::text, 'avi'::text, 'mkv'::text, 'flv'::text, 'wmv'::text]))) OR ((file_type = 'model3d'::file_type) AND (lower(extension) = ANY (ARRAY['gltf'::text, 'glb'::text, 'obj'::text, 'fbx'::text, 'stl'::text, 'dae'::text, '3ds'::text, 'usdz'::text]))) OR ((file_type = 'document'::file_type) AND (lower(extension) = ANY (ARRAY['pdf'::text, 'doc'::text, 'docx'::text, 'xls'::text, 'xlsx'::text, 'ppt'::text, 'pptx'::text, 'txt'::text]))) OR (file_type = 'other'::file_type))) not valid;

alter table "public"."file_library" validate constraint "valid_file_extension";

alter table "public"."lesson_blocks" add constraint "lesson_blocks_course_id_fkey" FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE not valid;

alter table "public"."lesson_blocks" validate constraint "lesson_blocks_course_id_fkey";

alter table "public"."lesson_blocks" add constraint "lesson_blocks_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."lesson_blocks" validate constraint "lesson_blocks_created_by_fkey";

alter table "public"."lesson_blocks" add constraint "lesson_blocks_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE not valid;

alter table "public"."lesson_blocks" validate constraint "lesson_blocks_lesson_id_fkey";

alter table "public"."lesson_blocks" add constraint "lesson_blocks_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE not valid;

alter table "public"."lesson_blocks" validate constraint "lesson_blocks_organization_id_fkey";

alter table "public"."lesson_blocks" add constraint "lesson_blocks_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."lesson_blocks" validate constraint "lesson_blocks_updated_by_fkey";

alter table "public"."lesson_types" add constraint "lesson_types_bg_color_key" UNIQUE using index "lesson_types_bg_color_key";

alter table "public"."lesson_types" add constraint "lesson_types_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."lesson_types" validate constraint "lesson_types_created_by_fkey";

alter table "public"."lesson_types" add constraint "lesson_types_name_key" UNIQUE using index "lesson_types_name_key";

alter table "public"."lesson_types" add constraint "lesson_types_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."lesson_types" validate constraint "lesson_types_updated_by_fkey";

alter table "public"."lessons" add constraint "lessons_chapter_id_fkey" FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE not valid;

alter table "public"."lessons" validate constraint "lessons_chapter_id_fkey";

alter table "public"."lessons" add constraint "lessons_course_id_fkey" FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE not valid;

alter table "public"."lessons" validate constraint "lessons_course_id_fkey";

alter table "public"."lessons" add constraint "lessons_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."lessons" validate constraint "lessons_created_by_fkey";

alter table "public"."lessons" add constraint "lessons_lesson_type_id_fkey" FOREIGN KEY (lesson_type_id) REFERENCES lesson_types(id) ON DELETE SET NULL not valid;

alter table "public"."lessons" validate constraint "lessons_lesson_type_id_fkey";

alter table "public"."lessons" add constraint "lessons_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE not valid;

alter table "public"."lessons" validate constraint "lessons_organization_id_fkey";

alter table "public"."lessons" add constraint "lessons_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."lessons" validate constraint "lessons_updated_by_fkey";

alter table "public"."organization_invites" add constraint "organization_invites_accepted_by_fkey" FOREIGN KEY (accepted_by) REFERENCES auth.users(id) not valid;

alter table "public"."organization_invites" validate constraint "organization_invites_accepted_by_fkey";

alter table "public"."organization_invites" add constraint "organization_invites_invited_by_fkey" FOREIGN KEY (invited_by) REFERENCES auth.users(id) not valid;

alter table "public"."organization_invites" validate constraint "organization_invites_invited_by_fkey";

alter table "public"."organization_invites" add constraint "organization_invites_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE not valid;

alter table "public"."organization_invites" validate constraint "organization_invites_organization_id_fkey";

alter table "public"."organization_invites" add constraint "organization_invites_token_key" UNIQUE using index "organization_invites_token_key";

alter table "public"."organization_members" add constraint "organization_members_invited_by_fkey" FOREIGN KEY (invited_by) REFERENCES auth.users(id) not valid;

alter table "public"."organization_members" validate constraint "organization_members_invited_by_fkey";

alter table "public"."organization_members" add constraint "organization_members_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE not valid;

alter table "public"."organization_members" validate constraint "organization_members_organization_id_fkey";

alter table "public"."organization_members" add constraint "organization_members_organization_id_user_id_key" UNIQUE using index "organization_members_organization_id_user_id_key";

alter table "public"."organization_members" add constraint "organization_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."organization_members" validate constraint "organization_members_user_id_fkey";

alter table "public"."organization_members" add constraint "organization_members_user_id_fkey_profiles" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."organization_members" validate constraint "organization_members_user_id_fkey_profiles";

alter table "public"."organizations" add constraint "handle_length" CHECK ((char_length(handle) >= 3)) not valid;

alter table "public"."organizations" validate constraint "handle_length";

alter table "public"."organizations" add constraint "handle_lowercase" CHECK ((handle = lower(handle))) not valid;

alter table "public"."organizations" validate constraint "handle_lowercase";

alter table "public"."organizations" add constraint "organizations_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."organizations" validate constraint "organizations_created_by_fkey";

alter table "public"."organizations" add constraint "organizations_deleted_by_fkey" FOREIGN KEY (deleted_by) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."organizations" validate constraint "organizations_deleted_by_fkey";

alter table "public"."organizations" add constraint "organizations_handle_key" UNIQUE using index "organizations_handle_key";

alter table "public"."organizations" add constraint "organizations_owned_by_fkey" FOREIGN KEY (owned_by) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."organizations" validate constraint "organizations_owned_by_fkey";

alter table "public"."organizations" add constraint "organizations_tier_fkey" FOREIGN KEY (tier) REFERENCES tier_limits(tier) not valid;

alter table "public"."organizations" validate constraint "organizations_tier_fkey";

alter table "public"."organizations" add constraint "organizations_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."organizations" validate constraint "organizations_updated_by_fkey";

alter table "public"."profiles" add constraint "email_valid" CHECK ((email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text)) not valid;

alter table "public"."profiles" validate constraint "email_valid";

alter table "public"."profiles" add constraint "mode_organization_consistency" CHECK ((((mode = 'personal'::profile_mode) AND (active_organization_id IS NULL)) OR ((mode = 'organization'::profile_mode) AND (active_organization_id IS NOT NULL)))) not valid;

alter table "public"."profiles" validate constraint "mode_organization_consistency";

alter table "public"."profiles" add constraint "profiles_active_organization_id_fkey" FOREIGN KEY (active_organization_id) REFERENCES organizations(id) ON DELETE SET NULL not valid;

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

alter table "public"."published_courses" add constraint "chk_average_rating" CHECK (((average_rating >= (1)::numeric) AND (average_rating <= (5)::numeric))) not valid;

alter table "public"."published_courses" validate constraint "chk_average_rating";

alter table "public"."published_courses" add constraint "chk_completion_rate" CHECK (((completion_rate >= (0)::numeric) AND (completion_rate <= (100)::numeric))) not valid;

alter table "public"."published_courses" validate constraint "chk_completion_rate";

alter table "public"."published_courses" add constraint "chk_version_positive" CHECK ((version > 0)) not valid;

alter table "public"."published_courses" validate constraint "chk_version_positive";

alter table "public"."published_courses" add constraint "published_courses_category_id_fkey" FOREIGN KEY (category_id) REFERENCES course_categories(id) ON DELETE SET NULL not valid;

alter table "public"."published_courses" validate constraint "published_courses_category_id_fkey";

alter table "public"."published_courses" add constraint "published_courses_id_fkey" FOREIGN KEY (id) REFERENCES courses(id) ON DELETE CASCADE not valid;

alter table "public"."published_courses" validate constraint "published_courses_id_fkey";

alter table "public"."published_courses" add constraint "published_courses_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE not valid;

alter table "public"."published_courses" validate constraint "published_courses_organization_id_fkey";

alter table "public"."published_courses" add constraint "published_courses_published_by_fkey" FOREIGN KEY (published_by) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."published_courses" validate constraint "published_courses_published_by_fkey";

alter table "public"."published_courses" add constraint "published_courses_subcategory_id_fkey" FOREIGN KEY (subcategory_id) REFERENCES course_sub_categories(id) ON DELETE SET NULL not valid;

alter table "public"."published_courses" validate constraint "published_courses_subcategory_id_fkey";

alter table "public"."published_courses" add constraint "published_courses_total_blocks_check" CHECK ((total_blocks > 0)) not valid;

alter table "public"."published_courses" validate constraint "published_courses_total_blocks_check";

alter table "public"."published_courses" add constraint "published_courses_total_chapters_check" CHECK ((total_chapters > 0)) not valid;

alter table "public"."published_courses" validate constraint "published_courses_total_chapters_check";

alter table "public"."published_courses" add constraint "published_courses_total_lessons_check" CHECK ((total_lessons > 0)) not valid;

alter table "public"."published_courses" validate constraint "published_courses_total_lessons_check";

alter table "public"."published_courses" add constraint "uq_one_active_published_course" UNIQUE using index "uq_one_active_published_course" DEFERRABLE INITIALLY DEFERRED;

alter table "public"."role_permissions" add constraint "role_permissions_role_permission_key" UNIQUE using index "role_permissions_role_permission_key";

alter table "public"."user_roles" add constraint "user_roles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."user_roles" validate constraint "user_roles_user_id_fkey";

alter table "public"."user_roles" add constraint "user_roles_user_id_role_key" UNIQUE using index "user_roles_user_id_role_key";

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
  if not public.can_accept_new_member(v_invite.organization_id) then
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

CREATE OR REPLACE FUNCTION public.authorize(requested_permission app_permission)
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

CREATE OR REPLACE FUNCTION public.calculate_access_end_date(start_date timestamp with time zone, frequency payment_frequency)
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

CREATE OR REPLACE FUNCTION public.can_accept_new_member(arg_org_id uuid)
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
  select (counts.active_members + counts.pending_invites) < limits.max_members_per_org
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
      public.get_user_org_role(c.organization_id, auth.uid()) in ('owner', 'admin')

      -- OR user is an editor and also owns the course
      or (
        public.get_user_org_role(c.organization_id, auth.uid()) = 'editor'
        and c.owned_by = auth.uid()
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
  v_owned_by uuid;
  v_position int;
begin
  -- Fetch course, org, owner, and tier position
  select t.course_id, c.organization_id, c.owned_by, t.position
  into v_course_id, v_org_id, v_owned_by, v_position
  from public.course_pricing_tiers t
  join public.courses c on c.id = t.course_id
  where t.id = p_tier_id;

  if v_course_id is null then
    raise exception 'Pricing tier not found';
  end if;

  -- Permission check using organization roles
  if not (
    public.has_org_role(v_org_id, 'owner', p_deleted_by)
    or public.has_org_role(v_org_id, 'admin', p_deleted_by)
    or (
      public.has_org_role(v_org_id, 'editor', p_deleted_by)
      and v_owned_by = p_deleted_by
    )
  ) then
    raise exception 'Insufficient permissions to delete pricing tiers in this course';
  end if;

  -- Delete the tier
  delete from public.course_pricing_tiers
  where id = p_tier_id;

  -- Reorder remaining tiers (shift down positions > deleted tier)
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
 RETURNS file_type
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

CREATE OR REPLACE FUNCTION public.enroll_user_in_published_course(p_user_id uuid, p_published_course_id uuid, p_tier_id text, p_payment_processor_id text DEFAULT NULL::text, p_payment_amount numeric DEFAULT NULL::numeric, p_payment_method text DEFAULT NULL::text, p_created_by uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  -- IDs to be returned
  enrollment_id uuid;
  activity_id uuid;
  payment_id uuid;

  -- Data holders
  published_course_record record;
  tier_record record;
  pricing_info record;

  -- Access window
  access_start timestamptz := timezone('utc', now()); -- Start now in UTC
  access_end timestamptz;

  -- Final output
  result jsonb;
begin
  -- =========================================================================
  -- STEP 1: Validate that the published course exists and is active
  -- =========================================================================
  select * into published_course_record
  from public.published_courses 
  where id = p_published_course_id and is_active = true;

  if not found then
    raise exception 'Published course not found or inactive';
  end if;

  -- =========================================================================
  -- STEP 2: Fetch the tier record (price, frequency, name, etc)
  -- =========================================================================
  select * into tier_record
  from public.get_published_course_pricing_tier(p_published_course_id, p_tier_id)
  limit 1;

  -- =========================================================================
  -- STEP 3: Determine the effective pricing (promotion-aware)
  -- =========================================================================
  select * into pricing_info
  from public.get_effective_pricing_for_published_tier(p_published_course_id, p_tier_id)
  limit 1;

  -- =========================================================================
  -- STEP 4: Compute the access expiration date based on frequency
  -- =========================================================================
  access_end := public.calculate_access_end_date(access_start, tier_record.payment_frequency);

  -- =========================================================================
  -- STEP 5: Create or update the course enrollment
  -- =========================================================================
  insert into public.course_enrollments (
    user_id,
    published_course_id,
    organization_id,
    enrolled_at,
    expires_at,
    is_active
  ) values (
    p_user_id,
    p_published_course_id,
    published_course_record.organization_id,
    access_start,
    access_end,
    true
  )
  on conflict (user_id, published_course_id)
  do update set
    expires_at = excluded.expires_at,
    is_active = true,
    enrolled_at = case 
      when public.course_enrollments.is_active = false then excluded.enrolled_at
      else public.course_enrollments.enrolled_at
    end
  returning id into enrollment_id;

  -- =========================================================================
  -- STEP 6: Log the enrollment activity
  -- =========================================================================
  insert into public.course_enrollment_activities (
    enrollment_id,
    pricing_tier_id,
    tier_name,
    tier_description,
    payment_frequency,
    currency_code,
    is_free,
    price_paid,
    promotional_price,
    was_promotional,
    access_start,
    access_end,
    created_by
  ) values (
    enrollment_id,
    p_tier_id::uuid,
    tier_record.tier_name,
    tier_record.tier_description,
    tier_record.payment_frequency,
    tier_record.currency_code::public.currency_code,
    tier_record.is_free,
    pricing_info.effective_price,
    pricing_info.promotional_price,
    pricing_info.is_promotional,
    access_start,
    access_end,
    coalesce(p_created_by, p_user_id)
  ) returning id into activity_id;

  -- =========================================================================
  -- STEP 7: If paid tier, validate payment and record transaction
  -- =========================================================================
  if not tier_record.is_free then
    -- Ensure payment metadata is present
    if p_payment_processor_id is null or p_payment_amount is null then
      raise exception 'Payment information required for paid enrollment';
    end if;

    -- Validate that payment matches expected price
    if p_payment_amount != pricing_info.effective_price then
      raise exception 'Payment amount does not match tier price';
    end if;

    -- Log payment
    insert into public.course_payments (
      enrollment_id,
      enrollment_activity_id,
      amount_paid,
      currency_code,
      payment_method,
      payment_processor_id,
      net_amount,
      payment_status,
      organization_id,
      created_by
    ) values (
      enrollment_id,
      activity_id,
      p_payment_amount,
      tier_record.currency_code::currency_code,
      p_payment_method,
      p_payment_processor_id,
      p_payment_amount, -- TODO: apply payment processor fee subtraction
      'completed',
      published_course_record.organization_id,
      coalesce(p_created_by, p_user_id)
    ) returning id into payment_id;
  end if;

  -- =========================================================================
  -- STEP 8: Update overall stats on the published course
  -- =========================================================================
  update public.published_courses 
  set 
    total_enrollments = total_enrollments + 1,
    active_enrollments = (
      select count(*)
      from public.course_enrollments ce
      where ce.published_course_id = p_published_course_id
        and ce.is_active = true
        and (ce.expires_at is null or ce.expires_at > timezone('utc', now()))
    ),
    updated_at = timezone('utc', now())
  where id = p_published_course_id;

  -- =========================================================================
  -- STEP 9: Return a structured result
  -- =========================================================================
  result := jsonb_build_object(
    'enrollment_id', enrollment_id,
    'activity_id', activity_id,
    'payment_id', case when tier_record.is_free then null else payment_id end,
    'is_free', tier_record.is_free,
    'access_granted', true
  );

  return result;
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
  -- Get the current max version for this course
  select coalesce(max(version), 0)
  into latest_version
  from public.published_courses
  where id = NEW.id;

  if TG_OP = 'INSERT' then
    -- On insert, bump version if not explicitly set higher
    if NEW.version is null or NEW.version <= latest_version then
      NEW.version := latest_version + 1;
    end if;
    NEW.published_at := timezone('utc', now());

  elsif TG_OP = 'UPDATE' then
    -- Detect meaningful content changes
    content_changed := (
      NEW.name IS DISTINCT FROM OLD.name OR
      NEW.description IS DISTINCT FROM OLD.description OR
      NEW.image_url IS DISTINCT FROM OLD.image_url OR
      NEW.blur_hash IS DISTINCT FROM OLD.blur_hash OR
      NEW.visibility IS DISTINCT FROM OLD.visibility OR
      NEW.course_structure IS DISTINCT FROM OLD.course_structure OR
      NEW.pricing_tiers IS DISTINCT FROM OLD.pricing_tiers
    );

    -- If changed, bump version and update published_at
    if content_changed then
      NEW.version := greatest(OLD.version + 1, latest_version + 1);
      NEW.published_at := timezone('utc', now());
    else
      -- Otherwise, keep old version & published_at (only stats were updated)
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
 RETURNS payment_frequency[]
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

CREATE OR REPLACE FUNCTION public.get_effective_pricing_for_published_tier(p_published_course_id uuid, p_tier_id text)
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
  from public.get_published_course_pricing_tier(p_published_course_id, p_tier_id)
  limit 1;


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

CREATE OR REPLACE FUNCTION public.get_published_course_pricing_tier(p_published_course_id uuid, p_tier_id text)
 RETURNS TABLE(tier_id text, payment_frequency payment_frequency, is_free boolean, price numeric, currency_code text, promotional_price numeric, promotion_start_date timestamp with time zone, promotion_end_date timestamp with time zone, tier_name text, tier_description text, is_active boolean, "position" integer, is_popular boolean, is_recommended boolean)
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  tier_data jsonb;
begin
  -- Extract the pricing tier JSON object matching the tier ID
  select tier into tier_data
  from public.published_courses pc,
    jsonb_array_elements(pc.pricing_tiers) as tier
  where pc.id = p_published_course_id
    and pc.is_active = true                               -- Only consider active courses
    and tier->>'id' = p_tier_id                           -- Match tier by ID
    and (tier->>'is_active')::boolean = true;             -- Only include active tiers

  -- Raise error if no such tier is found
  if tier_data is null then
    raise exception 'Pricing tier not found or inactive: %', p_tier_id;
  end if;

  -- Return the parsed tier fields, casting from JSONB to proper types
  return query select
    tier_data->>'id',
    (tier_data->>'payment_frequency')::payment_frequency,
    (tier_data->>'is_free')::boolean,
    (tier_data->>'price')::numeric(19,4),
    tier_data->>'currency_code',

    -- Handle nullable promotional price
    case 
      when tier_data->>'promotional_price' = 'null' then null
      else (tier_data->>'promotional_price')::numeric(19,4)
    end,

    -- Handle nullable promotion start date
    case 
      when tier_data->>'promotion_start_date' = 'null' then null
      else (tier_data->>'promotion_start_date')::timestamptz
    end,

    -- Handle nullable promotion end date
    case 
      when tier_data->>'promotion_end_date' = 'null' then null
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

create or replace view "public"."public_profiles" as  SELECT profiles.id,
    profiles.username,
    profiles.full_name,
    profiles.avatar_url,
    profiles.blur_hash,
    profiles.is_public,
    profiles.account_verified,
    profiles.created_at
   FROM profiles
  WHERE ((profiles.is_public = true) OR (profiles.id = ( SELECT auth.uid() AS uid)));


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
  v_owned_by uuid;
  temp_offset int := 1000000;
begin
  -- Ensure input is not null or empty
  if tier_positions is null or jsonb_array_length(tier_positions) = 0 then
    raise exception 'tier_positions array cannot be null or empty';
  end if;

  -- Retrieve course organization and creator
  select organization_id, owned_by
  into v_org_id, v_owned_by
  from public.courses
  where id = p_course_id;

  if v_org_id is null then
    raise exception 'Course not found';
  end if;

  -- Enforce permission check using organization roles
  if not (
    public.has_org_role(v_org_id, 'owner', p_updated_by)
    or public.has_org_role(v_org_id, 'admin', p_updated_by)
    or (
      public.has_org_role(v_org_id, 'editor', p_updated_by)
      and v_owned_by = p_updated_by
    )
  ) then
    raise exception 'Insufficient permissions to reorder pricing tiers in this course';
  end if;

  -- Ensure all provided tier IDs are valid and belong to the course
  if exists (
    select 1 
    from jsonb_array_elements(tier_positions) as tp
    left join public.course_pricing_tiers t on t.id = (tp->>'id')::uuid
    where t.id is null or t.course_id != p_course_id
  ) then
    raise exception 'One or more pricing tier IDs do not exist or do not belong to the specified course';
  end if;

  -- Validate that all positions are positive integers
  if exists (
    select 1 from jsonb_array_elements(tier_positions) as tp
    where (tp->>'position')::int <= 0
  ) then
    raise exception 'All position values must be positive integers';
  end if;

  -- Ensure every tier for this course is included exactly once
  if (
    select count(*) from public.course_pricing_tiers
    where course_id = p_course_id
  ) != jsonb_array_length(tier_positions) then
    raise exception 'All tiers for the course must be included in the reorder operation';
  end if;

  -- Ensure there are no duplicate positions
  if (
    select count(distinct (tp->>'position')::int)
    from jsonb_array_elements(tier_positions) as tp
  ) != jsonb_array_length(tier_positions) then
    raise exception 'Duplicate position values are not allowed';
  end if;

  -- Temporarily shift all positions to prevent conflicts
  update public.course_pricing_tiers
  set position = position + temp_offset
  where course_id = p_course_id;

  -- Apply new positions in the desired order
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

    can_add := public.can_accept_new_member(organization_id_from_url);
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
  can_add := public.can_accept_new_member(organization_id_from_url);
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
  v_owned_by uuid;
  has_paid_tiers boolean;
begin
  select organization_id, owned_by
  into v_org_id, v_owned_by
  from public.courses
  where id = p_course_id;

  if not (
    public.has_org_role(v_org_id, 'owner', p_user_id) or
    public.has_org_role(v_org_id, 'admin', p_user_id) or
    (public.has_org_role(v_org_id, 'editor', p_user_id) and v_owned_by = p_user_id)
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
  v_owned_by uuid;
  paid_tiers_count int;
begin
  select organization_id, owned_by
  into v_org_id, v_owned_by
  from public.courses
  where id = p_course_id;

  if not (
    public.has_org_role(v_org_id, 'owner', p_user_id) or
    public.has_org_role(v_org_id, 'admin', p_user_id) or
    (public.has_org_role(v_org_id, 'editor', p_user_id) and v_owned_by = p_user_id)
  ) then
    raise exception 'permission denied: insufficient privileges for course %', p_course_id;
  end if;

  select count(*)
  into paid_tiers_count
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

CREATE OR REPLACE FUNCTION public.switch_course_pricing_model(p_course_id uuid, p_user_id uuid, p_target_model text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_org_id uuid;
  v_owned_by uuid;
  current_model text;
begin
  select organization_id, owned_by
  into v_org_id, v_owned_by
  from public.courses
  where id = p_course_id;

  if not (
    public.has_org_role(v_org_id, 'owner', p_user_id) or
    public.has_org_role(v_org_id, 'admin', p_user_id) or
    (public.has_org_role(v_org_id, 'editor', p_user_id) and v_owned_by = p_user_id)
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
  end
  into current_model;

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

CREATE OR REPLACE FUNCTION public.validate_course_owner_in_org()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  if NEW.organization_id is not null and NEW.owned_by is not null then
    if not exists (
      select 1
      from public.organization_members
      where organization_id = NEW.organization_id
        and user_id = NEW.owned_by
    ) then
      raise exception 'User % must be a member of organization %', NEW.owned_by, NEW.organization_id;
    end if;
  end if;
  return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_subcategory_belongs_to_category()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  if NEW.category_id is not null and NEW.subcategory_id is not null then
    if not exists (
      select 1
      from public.course_sub_categories
      where id = NEW.subcategory_id
        and category_id = NEW.category_id
    ) then
      raise exception 'Subcategory % does not belong to category %', NEW.subcategory_id, NEW.category_id;
    end if;
  end if;
  return NEW;
end;
$function$
;

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

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

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

create policy "delete: can_user_edit_course allows deleting chapters"
on "public"."chapters"
as permissive
for delete
to authenticated
using (can_user_edit_course(course_id));


create policy "insert: can_user_edit_course allows inserting chapters"
on "public"."chapters"
as permissive
for insert
to authenticated
with check (can_user_edit_course(course_id));


create policy "select: org members can view chapters"
on "public"."chapters"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = chapters.course_id) AND (get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) IS NOT NULL)))));


create policy "update: can_user_edit_course allows updating chapters"
on "public"."chapters"
as permissive
for update
to authenticated
using (can_user_edit_course(course_id))
with check (can_user_edit_course(course_id));


create policy "course_categories_delete_authenticated"
on "public"."course_categories"
as permissive
for delete
to authenticated
using (authorize('course_categories.delete'::app_permission));


create policy "course_categories_insert_authenticated"
on "public"."course_categories"
as permissive
for insert
to authenticated
with check (( SELECT authorize('course_categories.insert'::app_permission) AS authorize));


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
using (authorize('course_categories.update'::app_permission));


create policy "delete: can_user_edit_course allows deleting pricing tiers"
on "public"."course_pricing_tiers"
as permissive
for delete
to authenticated
using (can_user_edit_course(course_id));


create policy "insert: can_user_edit_course allows adding pricing tiers"
on "public"."course_pricing_tiers"
as permissive
for insert
to authenticated
with check (can_user_edit_course(course_id));


create policy "select: org members can view pricing tiers"
on "public"."course_pricing_tiers"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = course_pricing_tiers.course_id) AND (get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) IS NOT NULL)))));


create policy "update: can_user_edit_course allows updating pricing tiers"
on "public"."course_pricing_tiers"
as permissive
for update
to authenticated
using (can_user_edit_course(course_id))
with check (can_user_edit_course(course_id));


create policy "course_sub_categories_delete_authenticated"
on "public"."course_sub_categories"
as permissive
for delete
to authenticated
using (authorize('course_sub_categories.delete'::app_permission));


create policy "course_sub_categories_insert_authenticated"
on "public"."course_sub_categories"
as permissive
for insert
to authenticated
with check (( SELECT authorize('course_sub_categories.insert'::app_permission) AS authorize));


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
using (authorize('course_sub_categories.update'::app_permission));


create policy "Delete: Admins or owning editors can delete courses"
on "public"."courses"
as permissive
for delete
to public
using (((get_user_org_role(organization_id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text])) OR ((get_user_org_role(organization_id, ( SELECT auth.uid() AS uid)) = 'editor'::text) AND (owned_by = ( SELECT auth.uid() AS uid)))));


create policy "Insert: Org members can create courses"
on "public"."courses"
as permissive
for insert
to public
with check ((get_user_org_role(organization_id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text, 'editor'::text])));


create policy "Select: Org members can view courses"
on "public"."courses"
as permissive
for select
to authenticated
using ((get_user_org_role(organization_id, ( SELECT auth.uid() AS uid)) IS NOT NULL));


create policy "Update: Admins or owning editors can update courses"
on "public"."courses"
as permissive
for update
to public
using (((get_user_org_role(organization_id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text])) OR ((get_user_org_role(organization_id, ( SELECT auth.uid() AS uid)) = 'editor'::text) AND (owned_by = ( SELECT auth.uid() AS uid)))));


create policy "delete: org owner/admin or course creator"
on "public"."file_library"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = file_library.course_id) AND ((get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text])) OR ((get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = 'editor'::text) AND (c.created_by = ( SELECT auth.uid() AS uid))))))));


create policy "insert: org owner/admin or course creator"
on "public"."file_library"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = file_library.course_id) AND ((get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text])) OR ((get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = 'editor'::text) AND (c.created_by = ( SELECT auth.uid() AS uid))))))));


create policy "select: org members can view file_library"
on "public"."file_library"
as permissive
for select
to authenticated
using ((get_user_org_role(organization_id, ( SELECT auth.uid() AS uid)) IS NOT NULL));


create policy "update: org owner/admin or course creator"
on "public"."file_library"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = file_library.course_id) AND ((get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text])) OR ((get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = 'editor'::text) AND (c.created_by = ( SELECT auth.uid() AS uid))))))))
with check ((EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = file_library.course_id) AND ((get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text])) OR ((get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = 'editor'::text) AND (c.created_by = ( SELECT auth.uid() AS uid))))))));


create policy "delete: can_user_edit_course allows deleting lesson blocks"
on "public"."lesson_blocks"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM lessons l
  WHERE ((l.id = lesson_blocks.lesson_id) AND can_user_edit_course(l.course_id)))));


create policy "insert: can_user_edit_course allows adding lesson blocks"
on "public"."lesson_blocks"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM lessons l
  WHERE ((l.id = lesson_blocks.lesson_id) AND can_user_edit_course(l.course_id)))));


create policy "select: org members can view lesson blocks"
on "public"."lesson_blocks"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM (courses c
     JOIN lessons l ON ((l.course_id = c.id)))
  WHERE ((l.id = lesson_blocks.lesson_id) AND (get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) IS NOT NULL)))));


create policy "update: can_user_edit_course allows modifying lesson blocks"
on "public"."lesson_blocks"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM lessons l
  WHERE ((l.id = lesson_blocks.lesson_id) AND can_user_edit_course(l.course_id)))))
with check ((EXISTS ( SELECT 1
   FROM lessons l
  WHERE ((l.id = lesson_blocks.lesson_id) AND can_user_edit_course(l.course_id)))));


create policy "Authenticated users can delete lesson types"
on "public"."lesson_types"
as permissive
for delete
to authenticated
using (( SELECT authorize('lesson_types.delete'::app_permission) AS authorize));


create policy "Authenticated users can insert lesson types"
on "public"."lesson_types"
as permissive
for insert
to authenticated
with check (( SELECT authorize('lesson_types.insert'::app_permission) AS authorize));


create policy "Authenticated users can update lesson types"
on "public"."lesson_types"
as permissive
for update
to authenticated
using (( SELECT authorize('lesson_types.update'::app_permission) AS authorize));


create policy "Public can read lesson types"
on "public"."lesson_types"
as permissive
for select
to authenticated, anon
using (true);


create policy "delete: can_user_edit_course allows deleting lessons"
on "public"."lessons"
as permissive
for delete
to authenticated
using (can_user_edit_course(course_id));


create policy "insert: can_user_edit_course allows adding lessons"
on "public"."lessons"
as permissive
for insert
to authenticated
with check (can_user_edit_course(course_id));


create policy "select: org members can view lessons"
on "public"."lessons"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = lessons.course_id) AND (get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) IS NOT NULL)))));


create policy "update: can_user_edit_course allows updating lessons"
on "public"."lessons"
as permissive
for update
to authenticated
using (can_user_edit_course(course_id))
with check (can_user_edit_course(course_id));


create policy "organization_invites_delete"
on "public"."organization_invites"
as permissive
for delete
to authenticated
using (has_org_role(organization_id, 'owner'::text, ( SELECT auth.uid() AS uid)));


create policy "organization_invites_insert"
on "public"."organization_invites"
as permissive
for insert
to authenticated
with check ((has_org_role(organization_id, 'admin'::text, ( SELECT auth.uid() AS uid)) AND (invited_by = ( SELECT auth.uid() AS uid)) AND can_accept_new_member(organization_id) AND ((role <> 'admin'::org_role) OR has_org_role(organization_id, 'owner'::text, ( SELECT auth.uid() AS uid))) AND (email <> ( SELECT profiles.email
   FROM profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid)))) AND (NOT is_user_already_member(organization_id, email))));


create policy "organization_invites_select_authenticated"
on "public"."organization_invites"
as permissive
for select
to authenticated
using ((has_org_role(organization_id, 'admin'::text, ( SELECT auth.uid() AS uid)) OR ((email = ( SELECT profiles.email
   FROM profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid)))) AND (accepted_at IS NULL) AND (revoked_at IS NULL) AND (expires_at > now()))));


create policy "organization_invites_update"
on "public"."organization_invites"
as permissive
for update
to authenticated
using ((has_org_role(organization_id, 'admin'::text, ( SELECT auth.uid() AS uid)) OR ((email = ( SELECT profiles.email
   FROM profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid)))) AND (accepted_at IS NULL) AND (revoked_at IS NULL) AND (expires_at > now()))))
with check ((((role <> 'admin'::org_role) OR has_org_role(organization_id, 'owner'::text, ( SELECT auth.uid() AS uid))) AND ((accepted_by IS NULL) OR (accepted_by = ( SELECT auth.uid() AS uid))) AND ((accepted_at IS NULL) OR can_accept_new_member(organization_id)) AND ((revoked_at IS NULL) OR has_org_role(organization_id, 'admin'::text, ( SELECT auth.uid() AS uid)))));


create policy "organization_members_delete"
on "public"."organization_members"
as permissive
for delete
to authenticated
using ((((user_id = ( SELECT auth.uid() AS uid)) AND (role <> 'owner'::org_role)) OR ((role = 'editor'::org_role) AND (user_id <> ( SELECT auth.uid() AS uid)) AND has_org_role(organization_id, 'admin'::text, ( SELECT auth.uid() AS uid))) OR ((user_id <> ( SELECT auth.uid() AS uid)) AND has_org_role(organization_id, 'owner'::text, ( SELECT auth.uid() AS uid)))));


create policy "organization_members_insert"
on "public"."organization_members"
as permissive
for insert
to authenticated
with check ((((user_id = ( SELECT auth.uid() AS uid)) AND (role = 'owner'::org_role)) OR (has_org_role(organization_id, 'admin'::text, ( SELECT auth.uid() AS uid)) AND can_accept_new_member(organization_id) AND ((role <> 'admin'::org_role) OR has_org_role(organization_id, 'owner'::text, ( SELECT auth.uid() AS uid))))));


create policy "organization_members_select"
on "public"."organization_members"
as permissive
for select
to authenticated
using (((user_id = ( SELECT auth.uid() AS uid)) OR has_org_role(organization_id, 'admin'::text, ( SELECT auth.uid() AS uid))));


create policy "organization_members_update"
on "public"."organization_members"
as permissive
for update
to authenticated
using (has_org_role(organization_id, 'owner'::text, ( SELECT auth.uid() AS uid)))
with check (((user_id <> ( SELECT auth.uid() AS uid)) AND (role = ANY (ARRAY['admin'::org_role, 'editor'::org_role]))));


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
with check (((owned_by = ( SELECT auth.uid() AS uid)) AND can_create_organization((tier)::text, ( SELECT auth.uid() AS uid))));


create policy "organizations_select"
on "public"."organizations"
as permissive
for select
to public
using (((is_public = true) OR (owned_by = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM organization_members om
  WHERE ((om.organization_id = organizations.id) AND (om.user_id = ( SELECT auth.uid() AS uid)))))));


create policy "organizations_update"
on "public"."organizations"
as permissive
for update
to authenticated
using (((owned_by = ( SELECT auth.uid() AS uid)) OR has_org_role(id, 'admin'::text, ( SELECT auth.uid() AS uid))))
with check ((((owned_by = ( SELECT auth.uid() AS uid)) OR has_org_role(id, 'admin'::text, owned_by)) AND ((owned_by = ( SELECT auth.uid() AS uid)) OR has_org_role(id, 'admin'::text, ( SELECT auth.uid() AS uid)))));


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
with check (((( SELECT auth.uid() AS uid) = id) AND ((active_organization_id IS NULL) OR (EXISTS ( SELECT 1
   FROM organization_members m
  WHERE ((m.user_id = ( SELECT auth.uid() AS uid)) AND (m.organization_id = profiles.active_organization_id)))))));


create policy "Allow UPDATE of own profile by authenticated users"
on "public"."profiles"
as permissive
for update
to authenticated
using ((( SELECT auth.uid() AS uid) = id))
with check ((( SELECT auth.uid() AS uid) = id));


create policy "Allow authenticated users to SELECT own profile"
on "public"."profiles"
as permissive
for select
to authenticated
using ((( SELECT auth.uid() AS uid) = id));


create policy "role_permissions_delete_policy"
on "public"."role_permissions"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = ( SELECT auth.uid() AS uid)) AND (ur.role = 'go_su'::app_role)))));


create policy "role_permissions_insert_policy"
on "public"."role_permissions"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = ( SELECT auth.uid() AS uid)) AND (ur.role = 'go_su'::app_role)))));


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
   FROM user_roles ur
  WHERE ((ur.user_id = ( SELECT auth.uid() AS uid)) AND (ur.role = 'go_su'::app_role)))))
with check ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = ( SELECT auth.uid() AS uid)) AND (ur.role = 'go_su'::app_role)))));


create policy "Authorized users can delete tier limits"
on "public"."tier_limits"
as permissive
for delete
to authenticated
using (( SELECT authorize('pricing_tier.crud'::app_permission) AS authorize));


create policy "Authorized users can insert tier limits"
on "public"."tier_limits"
as permissive
for insert
to authenticated
with check (( SELECT authorize('pricing_tier.crud'::app_permission) AS authorize));


create policy "Authorized users can update tier limits"
on "public"."tier_limits"
as permissive
for update
to authenticated
using (( SELECT authorize('pricing_tier.crud'::app_permission) AS authorize));


create policy "Public can read tier limits"
on "public"."tier_limits"
as permissive
for select
to authenticated, anon
using (true);


create policy "Allow auth admin to read user roles"
on "public"."user_roles"
as permissive
for select
to supabase_auth_admin
using (true);


CREATE TRIGGER trg_set_chapter_position BEFORE INSERT ON public.chapters FOR EACH ROW EXECUTE FUNCTION set_chapter_position();

CREATE TRIGGER trg_course_categories_set_updated_at BEFORE UPDATE ON public.course_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_enforce_at_least_one_active_tier BEFORE UPDATE ON public.course_pricing_tiers FOR EACH ROW EXECUTE FUNCTION enforce_at_least_one_active_pricing_tier();

CREATE TRIGGER trg_handle_free_tier AFTER INSERT OR UPDATE ON public.course_pricing_tiers FOR EACH ROW EXECUTE FUNCTION trg_delete_other_tiers_if_free();

CREATE TRIGGER trg_prevent_deactivating_last_free_tier BEFORE UPDATE ON public.course_pricing_tiers FOR EACH ROW WHEN (((old.is_active = true) AND (new.is_active = false))) EXECUTE FUNCTION trg_prevent_deactivating_last_free_tier();

CREATE TRIGGER trg_prevent_deleting_last_free_tier BEFORE DELETE ON public.course_pricing_tiers FOR EACH ROW EXECUTE FUNCTION trg_prevent_deleting_last_free_tier();

CREATE TRIGGER trg_prevent_last_paid_tier_deletion BEFORE DELETE ON public.course_pricing_tiers FOR EACH ROW EXECUTE FUNCTION trg_prevent_deleting_last_paid_tier();

CREATE TRIGGER trg_set_course_pricing_tier_position BEFORE INSERT ON public.course_pricing_tiers FOR EACH ROW EXECUTE FUNCTION set_course_pricing_tier_position();

CREATE TRIGGER trg_course_sub_categories_set_updated_at BEFORE UPDATE ON public.course_sub_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_add_default_free_pricing_tier AFTER INSERT ON public.courses FOR EACH ROW EXECUTE FUNCTION add_default_free_pricing_tier();

CREATE TRIGGER trg_validate_course_owner BEFORE INSERT OR UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION validate_course_owner_in_org();

CREATE TRIGGER trg_validate_subcategory BEFORE INSERT OR UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION validate_subcategory_belongs_to_category();

CREATE TRIGGER trg_set_file_type BEFORE INSERT OR UPDATE ON public.file_library FOR EACH ROW EXECUTE FUNCTION set_file_type_from_extension();

CREATE TRIGGER trg_update_timestamp BEFORE UPDATE ON public.file_library FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_set_lesson_block_position BEFORE INSERT ON public.lesson_blocks FOR EACH ROW EXECUTE FUNCTION set_lesson_block_position();

CREATE TRIGGER trg_lesson_types_set_updated_at BEFORE UPDATE ON public.lesson_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_set_lesson_position BEFORE INSERT ON public.lessons FOR EACH ROW EXECUTE FUNCTION set_lesson_position();

CREATE TRIGGER trg_insert_owner_into_organization_members AFTER INSERT ON public.organizations FOR EACH ROW EXECUTE FUNCTION add_or_update_owner_in_organization_members();

CREATE TRIGGER trg_organizations_set_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_owner_into_organization_members AFTER UPDATE ON public.organizations FOR EACH ROW WHEN ((old.owned_by IS DISTINCT FROM new.owned_by)) EXECUTE FUNCTION add_or_update_owner_in_organization_members();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_published_courses_set_updated_at BEFORE UPDATE ON public.published_courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_set_published_course_version BEFORE INSERT ON public.published_courses FOR EACH ROW EXECUTE FUNCTION ensure_incremented_course_version();

CREATE TRIGGER trg_update_published_course_version BEFORE UPDATE ON public.published_courses FOR EACH ROW EXECUTE FUNCTION ensure_incremented_course_version();


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();


create policy "Allow authenticated uploads to own avatar folder"
on "storage"."objects"
as permissive
for insert
to authenticated
with check (((bucket_id = 'profile_photos'::text) AND ((storage.foldername(name))[1] = ( SELECT (auth.uid())::text AS uid))));


create policy "Allow public access to public profile profile_photos"
on "storage"."objects"
as permissive
for select
to authenticated, anon
using (((bucket_id = 'profile_photos'::text) AND ((owner = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE (((profiles.id)::text = (storage.foldername(objects.name))[1]) AND (profiles.is_public = true)))))));


create policy "Allow user to delete own avatar"
on "storage"."objects"
as permissive
for delete
to authenticated
using (((owner = ( SELECT auth.uid() AS uid)) AND (bucket_id = 'profile_photos'::text)));


create policy "Allow user to update own avatar"
on "storage"."objects"
as permissive
for update
to authenticated
using ((owner = ( SELECT auth.uid() AS uid)))
with check (((bucket_id = 'profile_photos'::text) AND ((storage.foldername(name))[1] = ( SELECT (auth.uid())::text AS uid))));


create policy "Delete: Admins or owning editors can delete published_thumbnail"
on "storage"."objects"
as permissive
for delete
to authenticated
using (((bucket_id = 'published_thumbnails'::text) AND (EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = (split_part(objects.name, '/'::text, 1))::uuid) AND ((get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text])) OR ((get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = 'editor'::text) AND (c.owned_by = ( SELECT auth.uid() AS uid)))))))));


create policy "Delete: Admins or owning editors can delete thumbnails"
on "storage"."objects"
as permissive
for delete
to authenticated
using (((bucket_id = 'thumbnails'::text) AND (EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = (split_part(objects.name, '/'::text, 1))::uuid) AND ((get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text])) OR ((get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = 'editor'::text) AND (c.owned_by = ( SELECT auth.uid() AS uid)))))))));


create policy "Insert: Org members can upload published_thumbnails"
on "storage"."objects"
as permissive
for insert
to authenticated
with check (((bucket_id = 'published_thumbnails'::text) AND (EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = (split_part(objects.name, '/'::text, 1))::uuid) AND (get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text, 'editor'::text])))))));


create policy "Insert: Org members can upload thumbnails"
on "storage"."objects"
as permissive
for insert
to authenticated
with check (((bucket_id = 'thumbnails'::text) AND (EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = (split_part(objects.name, '/'::text, 1))::uuid) AND (get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text, 'editor'::text])))))));


create policy "Select: Org members can view thumbnails"
on "storage"."objects"
as permissive
for select
to authenticated
using (((bucket_id = 'thumbnails'::text) AND (EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = (split_part(objects.name, '/'::text, 1))::uuid) AND (get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) IS NOT NULL))))));


create policy "Select: Org members or public can view published_thumbnails"
on "storage"."objects"
as permissive
for select
to public
using (((bucket_id = 'published_thumbnails'::text) AND ((EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = (split_part(objects.name, '/'::text, 1))::uuid) AND (get_user_org_role(c.organization_id, auth.uid()) IS NOT NULL)))) OR (EXISTS ( SELECT 1
   FROM published_courses pc
  WHERE ((pc.id = (split_part(objects.name, '/'::text, 1))::uuid) AND pc.is_active AND (pc.visibility = 'public'::course_access)))))));


create policy "Update: Admins or owning editors can update published_thumbnail"
on "storage"."objects"
as permissive
for update
to authenticated
using (((bucket_id = 'published_thumbnails'::text) AND (EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = (split_part(objects.name, '/'::text, 1))::uuid) AND ((get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text])) OR ((get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = 'editor'::text) AND (c.owned_by = ( SELECT auth.uid() AS uid)))))))))
with check (((bucket_id = 'published_thumbnails'::text) AND (EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = (split_part(objects.name, '/'::text, 1))::uuid) AND ((get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text])) OR ((get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = 'editor'::text) AND (c.owned_by = ( SELECT auth.uid() AS uid)))))))));


create policy "Update: Admins or owning editors can update thumbnails"
on "storage"."objects"
as permissive
for update
to authenticated
using (((bucket_id = 'thumbnails'::text) AND (EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = (split_part(objects.name, '/'::text, 1))::uuid) AND ((get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text])) OR ((get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = 'editor'::text) AND (c.owned_by = ( SELECT auth.uid() AS uid)))))))))
with check (((bucket_id = 'thumbnails'::text) AND (EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = (split_part(objects.name, '/'::text, 1))::uuid) AND ((get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text])) OR ((get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = 'editor'::text) AND (c.owned_by = ( SELECT auth.uid() AS uid)))))))));


create policy "delete: org owner/admin or course creator"
on "storage"."objects"
as permissive
for delete
to authenticated
using (((bucket_id = 'files'::text) AND (EXISTS ( SELECT 1
   FROM (file_library fl
     JOIN courses c ON ((c.id = fl.course_id)))
  WHERE ((fl.path = objects.name) AND ((get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text])) OR ((get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = 'editor'::text) AND (c.created_by = ( SELECT auth.uid() AS uid)))))))));


create policy "insert: org owner/admin or course creator with storage limit"
on "storage"."objects"
as permissive
for insert
to authenticated
with check (((bucket_id = 'files'::text) AND (EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = (split_part(objects.name, '/'::text, 2))::uuid) AND (c.organization_id = (split_part(objects.name, '/'::text, 1))::uuid) AND ((get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text])) OR ((get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = 'editor'::text) AND (c.created_by = ( SELECT auth.uid() AS uid)))) AND (check_storage_limit(c.organization_id, COALESCE(((objects.metadata ->> 'size'::text))::bigint, (0)::bigint)) = true))))));


create policy "select: org members can view files"
on "storage"."objects"
as permissive
for select
to authenticated
using (((bucket_id = 'files'::text) AND (EXISTS ( SELECT 1
   FROM file_library fl
  WHERE ((fl.path = objects.name) AND (get_user_org_role(fl.organization_id, ( SELECT auth.uid() AS uid)) IS NOT NULL))))));


create policy "update: org owner/admin or course creator"
on "storage"."objects"
as permissive
for update
to authenticated
using (((bucket_id = 'files'::text) AND (EXISTS ( SELECT 1
   FROM (file_library fl
     JOIN courses c ON ((c.id = fl.course_id)))
  WHERE ((fl.path = objects.name) AND ((get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text])) OR ((get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = 'editor'::text) AND (c.created_by = ( SELECT auth.uid() AS uid)))))))))
with check (((bucket_id = 'files'::text) AND (EXISTS ( SELECT 1
   FROM (file_library fl
     JOIN courses c ON ((c.id = fl.course_id)))
  WHERE ((fl.path = objects.name) AND ((get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text])) OR ((get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = 'editor'::text) AND (c.created_by = ( SELECT auth.uid() AS uid)))))))));



