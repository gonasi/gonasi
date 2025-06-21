create type "public"."app_permission" as enum ('course_categories.insert', 'course_categories.update', 'course_categories.delete', 'course_sub_categories.insert', 'course_sub_categories.update', 'course_sub_categories.delete', 'featured_courses_pricing.insert', 'featured_courses_pricing.update', 'featured_courses_pricing.delete', 'lesson_types.insert', 'lesson_types.update', 'lesson_types.delete');

create type "public"."app_role" as enum ('go_su', 'go_admin', 'go_staff', 'user');

create type "public"."course_access" as enum ('public', 'private');

create type "public"."course_role" as enum ('admin', 'editor', 'viewer');

create type "public"."currency_code" as enum ('KES', 'USD');

create type "public"."file_type" as enum ('image', 'audio', 'video', 'model3d', 'document', 'other');

create type "public"."payment_frequency" as enum ('monthly', 'bi_monthly', 'quarterly', 'semi_annual', 'annual');

create table "public"."chapters" (
    "id" uuid not null default uuid_generate_v4(),
    "course_id" uuid not null,
    "name" text not null,
    "description" text,
    "requires_payment" boolean not null default false,
    "position" integer default 0,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_by" uuid not null,
    "updated_by" uuid not null
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

create table "public"."course_collaborators" (
    "id" uuid not null default gen_random_uuid(),
    "course_id" uuid not null,
    "user_id" uuid not null,
    "role" course_role not null default 'viewer'::course_role,
    "created_by" uuid,
    "invited_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "is_accepted" boolean default false,
    "accepted_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."course_collaborators" enable row level security;

create table "public"."course_pricing_tiers" (
    "id" uuid not null default uuid_generate_v4(),
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
    "pathway_id" uuid,
    "category_id" uuid,
    "subcategory_id" uuid,
    "name" text not null,
    "description" text,
    "image_url" text,
    "blur_hash" text,
    "visibility" course_access not null default 'public'::course_access,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "last_published" timestamp with time zone,
    "created_by" uuid not null,
    "updated_by" uuid not null
);


alter table "public"."courses" enable row level security;

create table "public"."file_library" (
    "id" uuid not null default uuid_generate_v4(),
    "course_id" uuid not null,
    "created_by" uuid not null,
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
    "course_id" uuid not null,
    "lesson_id" uuid not null,
    "plugin_type" text not null,
    "position" integer not null default 0,
    "content" jsonb not null default '{}'::jsonb,
    "settings" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_by" uuid not null,
    "updated_by" uuid not null
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
    "chapter_id" uuid not null,
    "lesson_type_id" uuid not null,
    "name" text not null,
    "position" integer default 0,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_by" uuid not null,
    "updated_by" uuid not null,
    "settings" jsonb not null default '{}'::jsonb
);


alter table "public"."lessons" enable row level security;

create table "public"."pathways" (
    "id" uuid not null default uuid_generate_v4(),
    "name" text not null,
    "description" text not null,
    "image_url" text not null,
    "blur_hash" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_by" uuid not null,
    "updated_by" uuid not null
);


alter table "public"."pathways" enable row level security;

create table "public"."payments" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid,
    "enrollment_activity_id" uuid,
    "published_course_id" uuid not null,
    "provider" text not null default 'paystack'::text,
    "provider_reference" text not null,
    "status" text not null,
    "currency_code" currency_code not null,
    "amount" numeric(19,4) not null,
    "paid_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_by" uuid
);


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
    "country_code" character(2) default 'KE'::bpchar,
    "preferred_language" character(2) default 'en'::bpchar,
    "bio" text,
    "website_url" text,
    "is_onboarding_complete" boolean not null default false,
    "account_verified" boolean not null default false,
    "notifications_enabled" boolean not null default true,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "twitter_url" text,
    "linkedin_url" text,
    "github_url" text,
    "instagram_url" text,
    "facebook_url" text,
    "tiktok_url" text,
    "youtube_url" text,
    "discord_url" text
);


alter table "public"."profiles" enable row level security;

create table "public"."published_course_enrollment_activities" (
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


alter table "public"."published_course_enrollment_activities" enable row level security;

create table "public"."published_course_enrollments" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "published_course_id" uuid not null,
    "enrolled_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "expires_at" timestamp with time zone not null,
    "is_active" boolean not null default true
);


alter table "public"."published_course_enrollments" enable row level security;

create table "public"."published_courses" (
    "id" uuid not null,
    "published_at" timestamp with time zone not null default now(),
    "version" integer not null default 1,
    "name" text not null,
    "description" text,
    "image_url" text,
    "blur_hash" text,
    "course_category_id" uuid not null,
    "course_sub_category_id" uuid not null,
    "course_categories" jsonb,
    "course_sub_categories" jsonb,
    "pathway_id" uuid not null,
    "pathways" jsonb,
    "pricing_data" jsonb,
    "chapters_count" integer not null default 0,
    "lessons_count" integer not null default 0,
    "course_chapters" jsonb,
    "lessons_with_blocks" jsonb,
    "created_by" uuid not null,
    "updated_by" uuid not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


create table "public"."role_permissions" (
    "id" uuid not null default uuid_generate_v4(),
    "role" app_role not null,
    "permission" app_permission not null
);


alter table "public"."role_permissions" enable row level security;

create table "public"."user_roles" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "role" app_role not null
);


alter table "public"."user_roles" enable row level security;

CREATE UNIQUE INDEX chapters_pkey ON public.chapters USING btree (id);

CREATE UNIQUE INDEX course_categories_pkey ON public.course_categories USING btree (id);

CREATE UNIQUE INDEX course_collaborators_course_id_user_id_key ON public.course_collaborators USING btree (course_id, user_id);

CREATE UNIQUE INDEX course_collaborators_pkey ON public.course_collaborators USING btree (id);

CREATE UNIQUE INDEX course_pricing_tiers_pkey ON public.course_pricing_tiers USING btree (id);

CREATE UNIQUE INDEX course_sub_categories_pkey ON public.course_sub_categories USING btree (id);

CREATE UNIQUE INDEX courses_pkey ON public.courses USING btree (id);

CREATE UNIQUE INDEX file_library_pkey ON public.file_library USING btree (id);

CREATE INDEX idx_chapters_course_id ON public.chapters USING btree (course_id);

CREATE INDEX idx_chapters_created_by ON public.chapters USING btree (created_by);

CREATE INDEX idx_chapters_position ON public.chapters USING btree (course_id, "position");

CREATE INDEX idx_chapters_updated_by ON public.chapters USING btree (updated_by);

CREATE INDEX idx_course_categories_created_by ON public.course_categories USING btree (created_by);

CREATE INDEX idx_course_categories_updated_by ON public.course_categories USING btree (updated_by);

CREATE INDEX idx_course_collaborators_course_id ON public.course_collaborators USING btree (course_id);

CREATE INDEX idx_course_collaborators_created_by ON public.course_collaborators USING btree (created_by);

CREATE INDEX idx_course_collaborators_is_accepted ON public.course_collaborators USING btree (is_accepted);

CREATE INDEX idx_course_collaborators_user_id ON public.course_collaborators USING btree (user_id);

CREATE INDEX idx_course_pricing_tiers_course_id ON public.course_pricing_tiers USING btree (course_id);

CREATE INDEX idx_course_pricing_tiers_course_id_active ON public.course_pricing_tiers USING btree (course_id, is_active);

CREATE INDEX idx_course_pricing_tiers_created_by ON public.course_pricing_tiers USING btree (created_by);

CREATE INDEX idx_course_pricing_tiers_popular_recommended ON public.course_pricing_tiers USING btree (is_popular, is_recommended);

CREATE INDEX idx_course_pricing_tiers_position ON public.course_pricing_tiers USING btree (course_id, "position");

CREATE INDEX idx_course_pricing_tiers_promotion_dates ON public.course_pricing_tiers USING btree (promotion_start_date, promotion_end_date);

CREATE INDEX idx_course_pricing_tiers_updated_by ON public.course_pricing_tiers USING btree (updated_by);

CREATE INDEX idx_course_sub_categories_category_id ON public.course_sub_categories USING btree (category_id);

CREATE INDEX idx_course_sub_categories_created_by ON public.course_sub_categories USING btree (created_by);

CREATE INDEX idx_course_sub_categories_updated_by ON public.course_sub_categories USING btree (updated_by);

CREATE INDEX idx_courses_category_id ON public.courses USING btree (category_id);

CREATE INDEX idx_courses_created_by ON public.courses USING btree (created_by);

CREATE INDEX idx_courses_pathway_id ON public.courses USING btree (pathway_id);

CREATE INDEX idx_courses_subcategory_id ON public.courses USING btree (subcategory_id);

CREATE INDEX idx_courses_updated_by ON public.courses USING btree (updated_by);

CREATE INDEX idx_courses_visibility ON public.courses USING btree (visibility);

CREATE INDEX idx_enrollment_activities_access_window ON public.published_course_enrollment_activities USING btree (access_start, access_end);

CREATE INDEX idx_enrollment_activities_created_at ON public.published_course_enrollment_activities USING btree (created_at);

CREATE INDEX idx_enrollment_activities_created_by ON public.published_course_enrollment_activities USING btree (created_by);

CREATE INDEX idx_enrollment_activities_enrollment_id ON public.published_course_enrollment_activities USING btree (enrollment_id);

CREATE INDEX idx_enrollment_activities_pricing_tier_id ON public.published_course_enrollment_activities USING btree (pricing_tier_id);

CREATE INDEX idx_enrollments_course_id ON public.published_course_enrollments USING btree (published_course_id);

CREATE INDEX idx_enrollments_expires_at ON public.published_course_enrollments USING btree (expires_at);

CREATE INDEX idx_enrollments_is_active ON public.published_course_enrollments USING btree (is_active);

CREATE INDEX idx_enrollments_user_id ON public.published_course_enrollments USING btree (user_id);

CREATE INDEX idx_file_library_course_id ON public.file_library USING btree (course_id);

CREATE INDEX idx_file_library_created_at_desc ON public.file_library USING btree (created_at DESC);

CREATE INDEX idx_file_library_created_by ON public.file_library USING btree (created_by);

CREATE INDEX idx_file_library_extension ON public.file_library USING btree (extension);

CREATE INDEX idx_file_library_file_type ON public.file_library USING btree (file_type);

CREATE INDEX idx_file_library_updated_by ON public.file_library USING btree (updated_by);

CREATE INDEX idx_lesson_blocks_course_id ON public.lesson_blocks USING btree (course_id);

CREATE INDEX idx_lesson_blocks_created_by ON public.lesson_blocks USING btree (created_by);

CREATE INDEX idx_lesson_blocks_lesson_id ON public.lesson_blocks USING btree (lesson_id);

CREATE INDEX idx_lesson_blocks_position ON public.lesson_blocks USING btree ("position");

CREATE INDEX idx_lesson_blocks_updated_by ON public.lesson_blocks USING btree (updated_by);

CREATE INDEX idx_lesson_types_created_by ON public.lesson_types USING btree (created_by);

CREATE INDEX idx_lesson_types_updated_by ON public.lesson_types USING btree (updated_by);

CREATE INDEX idx_lessons_chapter_id ON public.lessons USING btree (chapter_id);

CREATE INDEX idx_lessons_course_id ON public.lessons USING btree (course_id);

CREATE INDEX idx_lessons_created_by ON public.lessons USING btree (created_by);

CREATE INDEX idx_lessons_lesson_type_id ON public.lessons USING btree (lesson_type_id);

CREATE INDEX idx_lessons_position ON public.lessons USING btree ("position");

CREATE INDEX idx_lessons_updated_by ON public.lessons USING btree (updated_by);

CREATE INDEX idx_pathways_created_by ON public.pathways USING btree (created_by);

CREATE INDEX idx_pathways_updated_by ON public.pathways USING btree (updated_by);

CREATE INDEX idx_profiles_country_code ON public.profiles USING btree (country_code);

CREATE INDEX idx_profiles_created_at ON public.profiles USING btree (created_at);

CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);

CREATE INDEX idx_profiles_onboarding_status ON public.profiles USING btree (is_onboarding_complete, account_verified);

CREATE INDEX idx_profiles_username ON public.profiles USING btree (username) WHERE (username IS NOT NULL);

CREATE INDEX idx_profiles_verified_users ON public.profiles USING btree (id) WHERE (account_verified = true);

CREATE INDEX idx_published_courses_category_id ON public.published_courses USING btree (course_category_id);

CREATE INDEX idx_published_courses_id ON public.published_courses USING btree (id);

CREATE INDEX idx_published_courses_pathway_id ON public.published_courses USING btree (pathway_id);

CREATE INDEX idx_published_courses_published_at ON public.published_courses USING btree (published_at);

CREATE INDEX idx_published_courses_sub_category_id ON public.published_courses USING btree (course_sub_categories);

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);

CREATE UNIQUE INDEX lesson_blocks_pkey ON public.lesson_blocks USING btree (id);

CREATE UNIQUE INDEX lesson_types_bg_color_key ON public.lesson_types USING btree (bg_color);

CREATE UNIQUE INDEX lesson_types_name_key ON public.lesson_types USING btree (name);

CREATE UNIQUE INDEX lesson_types_pkey ON public.lesson_types USING btree (id);

CREATE UNIQUE INDEX lessons_pkey ON public.lessons USING btree (id);

CREATE UNIQUE INDEX pathways_pkey ON public.pathways USING btree (id);

CREATE UNIQUE INDEX payments_pkey ON public.payments USING btree (id);

CREATE UNIQUE INDEX payments_provider_reference_key ON public.payments USING btree (provider_reference);

CREATE UNIQUE INDEX profiles_email_key ON public.profiles USING btree (email);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX profiles_username_key ON public.profiles USING btree (username);

CREATE UNIQUE INDEX published_course_enrollment_activities_pkey ON public.published_course_enrollment_activities USING btree (id);

CREATE UNIQUE INDEX published_course_enrollments_pkey ON public.published_course_enrollments USING btree (id);

CREATE UNIQUE INDEX published_courses_pkey ON public.published_courses USING btree (id);

CREATE UNIQUE INDEX role_permissions_pkey ON public.role_permissions USING btree (id);

CREATE UNIQUE INDEX role_permissions_role_permission_key ON public.role_permissions USING btree (role, permission);

CREATE UNIQUE INDEX unique_chapter_position_per_course ON public.chapters USING btree (course_id, "position");

CREATE UNIQUE INDEX unique_file_path_per_course ON public.file_library USING btree (course_id, path);

CREATE UNIQUE INDEX unique_lesson_block_position_per_lesson ON public.lesson_blocks USING btree (lesson_id, "position");

CREATE UNIQUE INDEX unique_lesson_position_per_chapter ON public.lessons USING btree (chapter_id, "position");

CREATE UNIQUE INDEX uq_one_active_tier_per_frequency ON public.course_pricing_tiers USING btree (course_id, payment_frequency, is_active);

CREATE UNIQUE INDEX uq_user_course ON public.published_course_enrollments USING btree (user_id, published_course_id);

CREATE UNIQUE INDEX user_roles_pkey ON public.user_roles USING btree (id);

CREATE UNIQUE INDEX user_roles_user_id_role_key ON public.user_roles USING btree (user_id, role);

alter table "public"."chapters" add constraint "chapters_pkey" PRIMARY KEY using index "chapters_pkey";

alter table "public"."course_categories" add constraint "course_categories_pkey" PRIMARY KEY using index "course_categories_pkey";

alter table "public"."course_collaborators" add constraint "course_collaborators_pkey" PRIMARY KEY using index "course_collaborators_pkey";

alter table "public"."course_pricing_tiers" add constraint "course_pricing_tiers_pkey" PRIMARY KEY using index "course_pricing_tiers_pkey";

alter table "public"."course_sub_categories" add constraint "course_sub_categories_pkey" PRIMARY KEY using index "course_sub_categories_pkey";

alter table "public"."courses" add constraint "courses_pkey" PRIMARY KEY using index "courses_pkey";

alter table "public"."file_library" add constraint "file_library_pkey" PRIMARY KEY using index "file_library_pkey";

alter table "public"."lesson_blocks" add constraint "lesson_blocks_pkey" PRIMARY KEY using index "lesson_blocks_pkey";

alter table "public"."lesson_types" add constraint "lesson_types_pkey" PRIMARY KEY using index "lesson_types_pkey";

alter table "public"."lessons" add constraint "lessons_pkey" PRIMARY KEY using index "lessons_pkey";

alter table "public"."pathways" add constraint "pathways_pkey" PRIMARY KEY using index "pathways_pkey";

alter table "public"."payments" add constraint "payments_pkey" PRIMARY KEY using index "payments_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."published_course_enrollment_activities" add constraint "published_course_enrollment_activities_pkey" PRIMARY KEY using index "published_course_enrollment_activities_pkey";

alter table "public"."published_course_enrollments" add constraint "published_course_enrollments_pkey" PRIMARY KEY using index "published_course_enrollments_pkey";

alter table "public"."published_courses" add constraint "published_courses_pkey" PRIMARY KEY using index "published_courses_pkey";

alter table "public"."role_permissions" add constraint "role_permissions_pkey" PRIMARY KEY using index "role_permissions_pkey";

alter table "public"."user_roles" add constraint "user_roles_pkey" PRIMARY KEY using index "user_roles_pkey";

alter table "public"."chapters" add constraint "chapters_course_id_fkey" FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE not valid;

alter table "public"."chapters" validate constraint "chapters_course_id_fkey";

alter table "public"."chapters" add constraint "chapters_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT not valid;

alter table "public"."chapters" validate constraint "chapters_created_by_fkey";

alter table "public"."chapters" add constraint "chapters_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE RESTRICT not valid;

alter table "public"."chapters" validate constraint "chapters_updated_by_fkey";

alter table "public"."chapters" add constraint "unique_chapter_position_per_course" UNIQUE using index "unique_chapter_position_per_course";

alter table "public"."course_categories" add constraint "course_categories_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) not valid;

alter table "public"."course_categories" validate constraint "course_categories_created_by_fkey";

alter table "public"."course_categories" add constraint "course_categories_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) not valid;

alter table "public"."course_categories" validate constraint "course_categories_updated_by_fkey";

alter table "public"."course_collaborators" add constraint "course_collaborators_course_id_fkey" FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE not valid;

alter table "public"."course_collaborators" validate constraint "course_collaborators_course_id_fkey";

alter table "public"."course_collaborators" add constraint "course_collaborators_course_id_user_id_key" UNIQUE using index "course_collaborators_course_id_user_id_key";

alter table "public"."course_collaborators" add constraint "course_collaborators_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) not valid;

alter table "public"."course_collaborators" validate constraint "course_collaborators_created_by_fkey";

alter table "public"."course_collaborators" add constraint "course_collaborators_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."course_collaborators" validate constraint "course_collaborators_user_id_fkey";

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

alter table "public"."course_pricing_tiers" add constraint "course_pricing_tiers_price_check" CHECK ((price >= (0)::numeric)) not valid;

alter table "public"."course_pricing_tiers" validate constraint "course_pricing_tiers_price_check";

alter table "public"."course_pricing_tiers" add constraint "course_pricing_tiers_promotional_price_check" CHECK ((promotional_price >= (0)::numeric)) not valid;

alter table "public"."course_pricing_tiers" validate constraint "course_pricing_tiers_promotional_price_check";

alter table "public"."course_pricing_tiers" add constraint "course_pricing_tiers_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."course_pricing_tiers" validate constraint "course_pricing_tiers_updated_by_fkey";

alter table "public"."course_pricing_tiers" add constraint "uq_one_active_tier_per_frequency" UNIQUE using index "uq_one_active_tier_per_frequency" DEFERRABLE INITIALLY DEFERRED;

alter table "public"."course_sub_categories" add constraint "course_sub_categories_category_id_fkey" FOREIGN KEY (category_id) REFERENCES course_categories(id) ON DELETE CASCADE not valid;

alter table "public"."course_sub_categories" validate constraint "course_sub_categories_category_id_fkey";

alter table "public"."course_sub_categories" add constraint "course_sub_categories_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) not valid;

alter table "public"."course_sub_categories" validate constraint "course_sub_categories_created_by_fkey";

alter table "public"."course_sub_categories" add constraint "course_sub_categories_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) not valid;

alter table "public"."course_sub_categories" validate constraint "course_sub_categories_updated_by_fkey";

alter table "public"."courses" add constraint "courses_category_id_fkey" FOREIGN KEY (category_id) REFERENCES course_categories(id) ON DELETE SET NULL not valid;

alter table "public"."courses" validate constraint "courses_category_id_fkey";

alter table "public"."courses" add constraint "courses_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."courses" validate constraint "courses_created_by_fkey";

alter table "public"."courses" add constraint "courses_pathway_id_fkey" FOREIGN KEY (pathway_id) REFERENCES pathways(id) ON DELETE SET NULL not valid;

alter table "public"."courses" validate constraint "courses_pathway_id_fkey";

alter table "public"."courses" add constraint "courses_subcategory_id_fkey" FOREIGN KEY (subcategory_id) REFERENCES course_sub_categories(id) ON DELETE SET NULL not valid;

alter table "public"."courses" validate constraint "courses_subcategory_id_fkey";

alter table "public"."courses" add constraint "courses_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."courses" validate constraint "courses_updated_by_fkey";

alter table "public"."file_library" add constraint "file_library_course_id_fkey" FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE not valid;

alter table "public"."file_library" validate constraint "file_library_course_id_fkey";

alter table "public"."file_library" add constraint "file_library_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT not valid;

alter table "public"."file_library" validate constraint "file_library_created_by_fkey";

alter table "public"."file_library" add constraint "file_library_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."file_library" validate constraint "file_library_updated_by_fkey";

alter table "public"."file_library" add constraint "unique_file_path_per_course" UNIQUE using index "unique_file_path_per_course";

alter table "public"."file_library" add constraint "valid_file_extension" CHECK ((((file_type = 'image'::file_type) AND (lower(extension) = ANY (ARRAY['jpg'::text, 'jpeg'::text, 'png'::text, 'gif'::text, 'webp'::text, 'svg'::text, 'bmp'::text, 'tif'::text, 'tiff'::text, 'heic'::text]))) OR ((file_type = 'audio'::file_type) AND (lower(extension) = ANY (ARRAY['mp3'::text, 'wav'::text, 'aac'::text, 'flac'::text, 'ogg'::text, 'm4a'::text, 'aiff'::text, 'aif'::text]))) OR ((file_type = 'video'::file_type) AND (lower(extension) = ANY (ARRAY['mp4'::text, 'webm'::text, 'mov'::text, 'avi'::text, 'mkv'::text, 'flv'::text, 'wmv'::text]))) OR ((file_type = 'model3d'::file_type) AND (lower(extension) = ANY (ARRAY['gltf'::text, 'glb'::text, 'obj'::text, 'fbx'::text, 'stl'::text, 'dae'::text, '3ds'::text, 'usdz'::text]))) OR ((file_type = 'document'::file_type) AND (lower(extension) = ANY (ARRAY['pdf'::text, 'doc'::text, 'docx'::text, 'xls'::text, 'xlsx'::text, 'ppt'::text, 'pptx'::text, 'txt'::text]))) OR (file_type = 'other'::file_type))) not valid;

alter table "public"."file_library" validate constraint "valid_file_extension";

alter table "public"."lesson_blocks" add constraint "lesson_blocks_course_id_fkey" FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE not valid;

alter table "public"."lesson_blocks" validate constraint "lesson_blocks_course_id_fkey";

alter table "public"."lesson_blocks" add constraint "lesson_blocks_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT not valid;

alter table "public"."lesson_blocks" validate constraint "lesson_blocks_created_by_fkey";

alter table "public"."lesson_blocks" add constraint "lesson_blocks_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE not valid;

alter table "public"."lesson_blocks" validate constraint "lesson_blocks_lesson_id_fkey";

alter table "public"."lesson_blocks" add constraint "lesson_blocks_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE RESTRICT not valid;

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

alter table "public"."lessons" add constraint "lessons_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT not valid;

alter table "public"."lessons" validate constraint "lessons_created_by_fkey";

alter table "public"."lessons" add constraint "lessons_lesson_type_id_fkey" FOREIGN KEY (lesson_type_id) REFERENCES lesson_types(id) ON DELETE SET NULL not valid;

alter table "public"."lessons" validate constraint "lessons_lesson_type_id_fkey";

alter table "public"."lessons" add constraint "lessons_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE RESTRICT not valid;

alter table "public"."lessons" validate constraint "lessons_updated_by_fkey";

alter table "public"."pathways" add constraint "pathways_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."pathways" validate constraint "pathways_created_by_fkey";

alter table "public"."pathways" add constraint "pathways_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."pathways" validate constraint "pathways_updated_by_fkey";

alter table "public"."payments" add constraint "payments_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."payments" validate constraint "payments_created_by_fkey";

alter table "public"."payments" add constraint "payments_enrollment_activity_id_fkey" FOREIGN KEY (enrollment_activity_id) REFERENCES published_course_enrollment_activities(id) ON DELETE SET NULL not valid;

alter table "public"."payments" validate constraint "payments_enrollment_activity_id_fkey";

alter table "public"."payments" add constraint "payments_provider_reference_key" UNIQUE using index "payments_provider_reference_key";

alter table "public"."payments" add constraint "payments_published_course_id_fkey" FOREIGN KEY (published_course_id) REFERENCES published_courses(id) ON DELETE SET NULL not valid;

alter table "public"."payments" validate constraint "payments_published_course_id_fkey";

alter table "public"."payments" add constraint "payments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."payments" validate constraint "payments_user_id_fkey";

alter table "public"."profiles" add constraint "email_valid" CHECK ((email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text)) not valid;

alter table "public"."profiles" validate constraint "email_valid";

alter table "public"."profiles" add constraint "profiles_country_code_check" CHECK ((country_code ~* '^[A-Z]{2}$'::text)) not valid;

alter table "public"."profiles" validate constraint "profiles_country_code_check";

alter table "public"."profiles" add constraint "profiles_discord_url_check" CHECK ((discord_url ~* '^https?://(www\.)?discord\.gg/[^/]+/?$'::text)) not valid;

alter table "public"."profiles" validate constraint "profiles_discord_url_check";

alter table "public"."profiles" add constraint "profiles_email_key" UNIQUE using index "profiles_email_key";

alter table "public"."profiles" add constraint "profiles_facebook_url_check" CHECK ((facebook_url ~* '^https?://(www\.)?facebook\.com/[^/]+/?$'::text)) not valid;

alter table "public"."profiles" validate constraint "profiles_facebook_url_check";

alter table "public"."profiles" add constraint "profiles_github_url_check" CHECK ((github_url ~* '^https?://(www\.)?github\.com/[^/]+/?$'::text)) not valid;

alter table "public"."profiles" validate constraint "profiles_github_url_check";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."profiles" add constraint "profiles_instagram_url_check" CHECK ((instagram_url ~* '^https?://(www\.)?instagram\.com/[^/]+/?$'::text)) not valid;

alter table "public"."profiles" validate constraint "profiles_instagram_url_check";

alter table "public"."profiles" add constraint "profiles_linkedin_url_check" CHECK ((linkedin_url ~* '^https?://(www\.)?linkedin\.com/in/[^/]+/?$'::text)) not valid;

alter table "public"."profiles" validate constraint "profiles_linkedin_url_check";

alter table "public"."profiles" add constraint "profiles_preferred_language_check" CHECK ((preferred_language ~* '^[a-z]{2}$'::text)) not valid;

alter table "public"."profiles" validate constraint "profiles_preferred_language_check";

alter table "public"."profiles" add constraint "profiles_tiktok_url_check" CHECK ((tiktok_url ~* '^https?://(www\.)?tiktok\.com/@[^/]+/?$'::text)) not valid;

alter table "public"."profiles" validate constraint "profiles_tiktok_url_check";

alter table "public"."profiles" add constraint "profiles_twitter_url_check" CHECK ((twitter_url ~* '^https?://(www\.)?twitter\.com/[^/]+/?$'::text)) not valid;

alter table "public"."profiles" validate constraint "profiles_twitter_url_check";

alter table "public"."profiles" add constraint "profiles_username_key" UNIQUE using index "profiles_username_key";

alter table "public"."profiles" add constraint "profiles_website_url_check" CHECK ((website_url ~* '^https?://[a-z0-9.-]+\.[a-z]{2,}(/.*)?$'::text)) not valid;

alter table "public"."profiles" validate constraint "profiles_website_url_check";

alter table "public"."profiles" add constraint "profiles_youtube_url_check" CHECK ((youtube_url ~* '^https?://(www\.)?youtube\.com/(c|channel|user)/[^/]+/?$'::text)) not valid;

alter table "public"."profiles" validate constraint "profiles_youtube_url_check";

alter table "public"."profiles" add constraint "username_length" CHECK ((char_length(username) >= 3)) not valid;

alter table "public"."profiles" validate constraint "username_length";

alter table "public"."profiles" add constraint "username_lowercase" CHECK ((username = lower(username))) not valid;

alter table "public"."profiles" validate constraint "username_lowercase";

alter table "public"."published_course_enrollment_activities" add constraint "published_course_enrollment_activities_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."published_course_enrollment_activities" validate constraint "published_course_enrollment_activities_created_by_fkey";

alter table "public"."published_course_enrollment_activities" add constraint "published_course_enrollment_activities_enrollment_id_fkey" FOREIGN KEY (enrollment_id) REFERENCES published_course_enrollments(id) ON DELETE CASCADE not valid;

alter table "public"."published_course_enrollment_activities" validate constraint "published_course_enrollment_activities_enrollment_id_fkey";

alter table "public"."published_course_enrollment_activities" add constraint "published_course_enrollment_activities_pricing_tier_id_fkey" FOREIGN KEY (pricing_tier_id) REFERENCES course_pricing_tiers(id) not valid;

alter table "public"."published_course_enrollment_activities" validate constraint "published_course_enrollment_activities_pricing_tier_id_fkey";

alter table "public"."published_course_enrollments" add constraint "published_course_enrollments_published_course_id_fkey" FOREIGN KEY (published_course_id) REFERENCES published_courses(id) ON DELETE CASCADE not valid;

alter table "public"."published_course_enrollments" validate constraint "published_course_enrollments_published_course_id_fkey";

alter table "public"."published_course_enrollments" add constraint "published_course_enrollments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."published_course_enrollments" validate constraint "published_course_enrollments_user_id_fkey";

alter table "public"."published_course_enrollments" add constraint "uq_user_course" UNIQUE using index "uq_user_course";

alter table "public"."published_courses" add constraint "published_courses_course_category_id_fkey" FOREIGN KEY (course_category_id) REFERENCES course_categories(id) ON DELETE RESTRICT not valid;

alter table "public"."published_courses" validate constraint "published_courses_course_category_id_fkey";

alter table "public"."published_courses" add constraint "published_courses_course_sub_category_id_fkey" FOREIGN KEY (course_sub_category_id) REFERENCES course_sub_categories(id) ON DELETE RESTRICT not valid;

alter table "public"."published_courses" validate constraint "published_courses_course_sub_category_id_fkey";

alter table "public"."published_courses" add constraint "published_courses_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT not valid;

alter table "public"."published_courses" validate constraint "published_courses_created_by_fkey";

alter table "public"."published_courses" add constraint "published_courses_id_fkey" FOREIGN KEY (id) REFERENCES courses(id) ON DELETE CASCADE not valid;

alter table "public"."published_courses" validate constraint "published_courses_id_fkey";

alter table "public"."published_courses" add constraint "published_courses_pathway_id_fkey" FOREIGN KEY (pathway_id) REFERENCES pathways(id) ON DELETE RESTRICT not valid;

alter table "public"."published_courses" validate constraint "published_courses_pathway_id_fkey";

alter table "public"."published_courses" add constraint "published_courses_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE RESTRICT not valid;

alter table "public"."published_courses" validate constraint "published_courses_updated_by_fkey";

alter table "public"."role_permissions" add constraint "role_permissions_role_permission_key" UNIQUE using index "role_permissions_role_permission_key";

alter table "public"."user_roles" add constraint "user_roles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."user_roles" validate constraint "user_roles_user_id_fkey";

alter table "public"."user_roles" add constraint "user_roles_user_id_role_key" UNIQUE using index "user_roles_user_id_role_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.add_default_free_pricing_tier()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  -- Insert a basic free tier for every new course
  -- Uses course creator as both creator and updater for audit trail
  INSERT INTO public.course_pricing_tiers (
    course_id,
    is_free,
    price,
    currency_code,
    created_by,
    updated_by,
    payment_frequency,
    tier_name
  )
  VALUES (
    new.id,              -- The newly created course
    true,                -- Free tier
    0,                   -- No cost
    'USD',               -- Default currency
    new.created_by,      -- Course creator
    new.created_by,      -- Course creator
    'monthly',           -- Default frequency
    'Free'               -- Descriptive name
  );

  RETURN new;
END;
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

CREATE OR REPLACE FUNCTION public.can_convert_course_pricing(p_course_id uuid, p_target_model text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    has_active_subscriptions BOOLEAN;
BEGIN
    -- Check for active subscriptions (assuming you have a subscriptions table)
    -- This prevents converting a course that has paying customers
    SELECT EXISTS (
        SELECT 1 FROM subscriptions s
        JOIN course_pricing_tiers cpt ON s.pricing_tier_id = cpt.id
        WHERE cpt.course_id = p_course_id
          AND s.status = 'active'
          AND cpt.is_free = false
    ) INTO has_active_subscriptions;

    -- Prevent converting paid course to free if there are active paid subscriptions
    IF p_target_model = 'free' AND has_active_subscriptions THEN
        RETURN false;
    END IF;

    RETURN true;
END;
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
  v_course_id uuid;         -- Course that owns the chapter
  v_chapter_position int;   -- Position of the chapter being deleted
begin
  -- Step 1: Fetch the course ID and position of the chapter to be deleted
  select c.course_id, c.position
  into v_course_id, v_chapter_position
  from public.chapters c
  where c.id = p_chapter_id;

  -- Step 2: Ensure the chapter exists
  if v_course_id is null then
    raise exception 'Chapter does not exist';
  end if;

  -- Step 3: Permission check – ensure user can delete chapters in this course
  if not exists (
    select 1
    from public.courses c
    where c.id = v_course_id
      and (
        public.is_course_admin(c.id, p_deleted_by) or
        public.is_course_editor(c.id, p_deleted_by) or
        c.created_by = p_deleted_by
      )
  ) then
    raise exception 'Insufficient permissions to delete chapters in this course';
  end if;

  -- Step 4: Delete the chapter (this will cascade delete lessons and blocks, if FK is configured)
  delete from public.chapters
  where id = p_chapter_id;

  -- Step 5: Confirm that the chapter was actually deleted
  if not found then
    raise exception 'Failed to delete chapter';
  end if;

  -- Step 6: Reorder remaining chapters in the same course
  -- Temporarily move affected chapters far below to avoid conflicts with any unique index on position
  update public.chapters
  set position = position - 1000000
  where course_id = v_course_id
    and position > v_chapter_position;

  -- Step 7: Move them back with corrected positions
  update public.chapters
  set 
    position = position + 999999,  -- Net effect is: position = position - 1
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
  v_course_id uuid;        -- to store the course_id for permission checking
  v_chapter_id uuid;       -- to store the chapter_id for lesson reordering
  v_lesson_position int;   -- position of the lesson being deleted
begin
  -- Get the course_id, chapter_id, and current position of the lesson to be deleted
  select l.course_id, l.chapter_id, l.position
  into v_course_id, v_chapter_id, v_lesson_position
  from public.lessons l
  where l.id = p_lesson_id;

  -- Check if lesson exists
  if v_course_id is null then
    raise exception 'Lesson does not exist';
  end if;

  -- Verify user has permission to modify lessons in this course
  if not exists (
    select 1 
    from public.courses c
    where c.id = v_course_id
      and (
        public.is_course_admin(c.id, p_deleted_by) or
        public.is_course_editor(c.id, p_deleted_by) or
        c.created_by = p_deleted_by
      )
  ) then
    raise exception 'Insufficient permissions to delete lessons in this course';
  end if;

  -- Delete the specified lesson (this will cascade delete all related lesson blocks)
  delete from public.lessons
  where id = p_lesson_id;

  -- Check if the delete was successful
  if not found then
    raise exception 'Failed to delete lesson';
  end if;

  -- Reorder remaining lessons: shift down all lessons that were positioned after the deleted lesson within the same chapter
  -- Step 1: Temporarily offset positions to avoid unique constraint conflict
  update public.lessons
  set position = position - 1000000
  where chapter_id = v_chapter_id
    and position > v_lesson_position;

  -- Step 2: Apply the final position update with metadata
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
  v_lesson_id uuid;        -- to store the lesson_id for the block
  v_course_id uuid;        -- to store the course_id for permission checking
  v_block_position int;    -- position of the block being deleted
begin
  -- Get the lesson_id and current position of the block to be deleted
  select lb.lesson_id, lb.position
  into v_lesson_id, v_block_position
  from public.lesson_blocks lb
  where lb.id = p_block_id;

  -- Check if block exists
  if v_lesson_id is null then
    raise exception 'Lesson block does not exist';
  end if;

  -- Get the course_id for the lesson to check permissions
  select l.course_id into v_course_id
  from public.lessons l
  where l.id = v_lesson_id;

  -- Check if lesson exists (should not happen if block exists, but safety check)
  if v_course_id is null then
    raise exception 'Associated lesson does not exist';
  end if;

  -- Verify user has permission to modify blocks in this lesson
  if not exists (
    select 1 
    from public.courses c
    where c.id = v_course_id
      and (
        public.is_course_admin(c.id, p_deleted_by) or
        public.is_course_editor(c.id, p_deleted_by) or
        c.created_by = p_deleted_by
      )
  ) then
    raise exception 'Insufficient permissions to delete blocks in this lesson';
  end if;

  -- Delete the specified block
  delete from public.lesson_blocks
  where id = p_block_id;

  -- Check if the delete was successful
  if not found then
    raise exception 'Failed to delete lesson block';
  end if;

  -- Reorder remaining blocks: shift down all blocks that were positioned after the deleted block
  update  public.lesson_blocks
  set position = position - 1000000
  where chapter_id = v_chapter_id
    and position > v_lesson_position;

  -- Step 2: Apply the final position update with metadata
  update  public.lesson_blocks
  set 
    position = position + 999999,
    updated_at = timezone('utc', now()),
    updated_by = p_deleted_by
  where chapter_id = v_chapter_id
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
  v_position int;
begin
  -- Retrieve course ID and position
  select course_id, position
  into v_course_id, v_position
  from public.course_pricing_tiers
  where id = p_tier_id;

  -- Check existence
  if v_course_id is null then
    raise exception 'Pricing tier does not exist';
  end if;

  -- Permission check
  if not exists (
    select 1 
    from public.courses c
    where c.id = v_course_id
      and (
        public.is_course_admin(c.id, p_deleted_by) or
        public.is_course_editor(c.id, p_deleted_by) or
        c.created_by = p_deleted_by
      )
  ) then
    raise exception 'Insufficient permissions to delete pricing tiers in this course';
  end if;

  -- Delete the tier
  delete from public.course_pricing_tiers
  where id = p_tier_id;

  -- Reorder remaining tiers
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

CREATE OR REPLACE FUNCTION public.enforce_at_least_one_active_tier()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF new.is_active = false THEN
    -- Check if this is the last active tier for this course
    IF NOT EXISTS (
      SELECT 1
      FROM course_pricing_tiers
      WHERE course_id = new.course_id
        AND id != new.id
        AND is_active = true
    ) THEN
      RAISE EXCEPTION 'Each course must have at least one active pricing tier.';
    END IF;
  END IF;
  RETURN new;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_available_payment_frequencies(p_course_id uuid)
 RETURNS payment_frequency[]
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  all_frequencies public.payment_frequency[]; -- All possible enum values
  used_frequencies public.payment_frequency[]; -- Values already used for this course
BEGIN
  -- Get all possible enum values
  SELECT enum_range(null::public.payment_frequency)
  INTO all_frequencies;

  -- Get used frequencies for the course (only active tiers)
  SELECT array_agg(payment_frequency)
  INTO used_frequencies
  FROM public.course_pricing_tiers
  WHERE course_id = p_course_id;

  -- Return unused frequencies
  RETURN (
    SELECT array_agg(freq)
    FROM unnest(all_frequencies) AS freq
    WHERE used_frequencies IS NULL OR freq != ALL(used_frequencies)
  );
END;
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

CREATE OR REPLACE FUNCTION public.is_course_admin(course_id uuid, user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1 from public.course_collaborators
    where public.course_collaborators.course_id = $1
      and public.course_collaborators.user_id = $2
      and public.course_collaborators.role = 'admin'
      and public.course_collaborators.is_accepted = true
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_course_editor(course_id uuid, user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1 from public.course_collaborators
    where public.course_collaborators.course_id = $1
      and public.course_collaborators.user_id = $2
      and public.course_collaborators.role = 'editor'
      and public.course_collaborators.is_accepted = true
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_course_viewer(course_id uuid, user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1 from public.course_collaborators
    where public.course_collaborators.course_id = $1
      and public.course_collaborators.user_id = $2
      and public.course_collaborators.role = 'viewer'
      and public.course_collaborators.is_accepted = true
  );
$function$
;

CREATE OR REPLACE FUNCTION public.reorder_chapters(p_course_id uuid, chapter_positions jsonb, p_updated_by uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  temp_offset int := 1000000;  -- large offset to avoid unique position conflicts during update
begin
  -- Validate that chapter_positions array is not empty or null
  if chapter_positions is null or jsonb_array_length(chapter_positions) = 0 then
    raise exception 'chapter_positions array cannot be null or empty';
  end if;

  -- Verify user has permission to modify chapters in this course
  if not exists (
    select 1 
    from public.courses c
    where c.id = p_course_id
      and (
        public.is_course_admin(c.id, p_updated_by) or
        public.is_course_editor(c.id, p_updated_by) or
        c.created_by = p_updated_by
      )
  ) then
    raise exception 'Insufficient permissions to reorder chapters in this course';
  end if;

  -- Validate that all chapter IDs exist and belong to the specified course
  if exists (
    select 1 
    from jsonb_array_elements(chapter_positions) as cp
    left join public.chapters ch on ch.id = (cp->>'id')::uuid
    where ch.id is null or ch.course_id != p_course_id
  ) then
    raise exception 'One or more chapter IDs do not exist or do not belong to the specified course';
  end if;

  -- Validate that position values are positive integers
  if exists (
    select 1
    from jsonb_array_elements(chapter_positions) as cp
    where (cp->>'position')::int <= 0
  ) then
    raise exception 'All position values must be positive integers';
  end if;

  -- Validate that we're not missing any chapters from the course
  if (
    select count(*)
    from public.chapters
    where course_id = p_course_id
  ) != jsonb_array_length(chapter_positions) then
    raise exception 'All chapters in the course must be included in the reorder operation';
  end if;

  -- Check for duplicate positions in the input
  if (
    select count(distinct (cp->>'position')::int)
    from jsonb_array_elements(chapter_positions) as cp
  ) != jsonb_array_length(chapter_positions) then
    raise exception 'Duplicate position values are not allowed';
  end if;

  -- Temporarily shift all chapter positions to avoid unique constraint conflicts
  update public.chapters
  set position = position + temp_offset
  where course_id = p_course_id;

  -- Apply new positions and update audit fields
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
  temp_offset int := 1000000;  -- large offset to avoid unique position conflicts during update
  v_course_id uuid;            -- to store the course_id for permission checking
begin
  -- Validate that block_positions array is not empty or null
  if block_positions is null or jsonb_array_length(block_positions) = 0 then
    raise exception 'block_positions array cannot be null or empty';
  end if;

  -- Get the course_id for the lesson to check permissions
  select l.course_id into v_course_id
  from public.lessons l
  where l.id = p_lesson_id;

  -- Check if lesson exists
  if v_course_id is null then
    raise exception 'Lesson does not exist';
  end if;

  -- Verify user has permission to modify blocks in this lesson
  if not exists (
    select 1 
    from public.courses c
    where c.id = v_course_id
      and (
        public.is_course_admin(c.id, p_updated_by) or
        public.is_course_editor(c.id, p_updated_by) or
        c.created_by = p_updated_by
      )
  ) then
    raise exception 'Insufficient permissions to reorder blocks in this lesson';
  end if;

  -- Validate that all block IDs exist and belong to the specified lesson
  if exists (
    select 1 
    from jsonb_array_elements(block_positions) as bp
    left join public.lesson_blocks lb on lb.id = (bp->>'id')::uuid
    where lb.id is null or lb.lesson_id != p_lesson_id
  ) then
    raise exception 'One or more block IDs do not exist or do not belong to the specified lesson';
  end if;

  -- Validate that position values are positive integers
  if exists (
    select 1
    from jsonb_array_elements(block_positions) as bp
    where (bp->>'position')::int <= 0
  ) then
    raise exception 'All position values must be positive integers';
  end if;

  -- Validate that we're not missing any blocks from the lesson
  if (
    select count(*)
    from public.lesson_blocks
    where lesson_id = p_lesson_id
  ) != jsonb_array_length(block_positions) then
    raise exception 'All blocks in the lesson must be included in the reorder operation';
  end if;

  -- Check for duplicate positions in the input
  if (
    select count(distinct (bp->>'position')::int)
    from jsonb_array_elements(block_positions) as bp
  ) != jsonb_array_length(block_positions) then
    raise exception 'Duplicate position values are not allowed';
  end if;

  -- Temporarily shift all block positions to avoid unique constraint conflicts
  update public.lesson_blocks
  set position = position + temp_offset
  where lesson_id = p_lesson_id;

  -- Apply new positions and update audit fields
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
  temp_offset int := 1000000;  -- large offset to avoid unique position conflicts during update
  v_course_id uuid;            -- to store the course_id for permission checking
begin
  -- Validate that lesson_positions array is not empty or null
  if lesson_positions is null or jsonb_array_length(lesson_positions) = 0 then
    raise exception 'lesson_positions array cannot be null or empty';
  end if;

  -- Get the course_id for the chapter to check permissions
  select c.course_id into v_course_id
  from public.chapters c
  where c.id = p_chapter_id;

  -- Check if chapter exists
  if v_course_id is null then
    raise exception 'Chapter does not exist';
  end if;

  -- Verify user has permission to modify lessons in this chapter
  if not exists (
    select 1 
    from public.courses c
    where c.id = v_course_id
      and (
        public.is_course_admin(c.id, p_updated_by) or
        public.is_course_editor(c.id, p_updated_by) or
        c.created_by = p_updated_by
      )
  ) then
    raise exception 'Insufficient permissions to reorder lessons in this chapter';
  end if;

  -- Validate that all lesson IDs exist and belong to the specified chapter
  if exists (
    select 1 
    from jsonb_array_elements(lesson_positions) as lp
    left join public.lessons l on l.id = (lp->>'id')::uuid
    where l.id is null or l.chapter_id != p_chapter_id
  ) then
    raise exception 'One or more lesson IDs do not exist or do not belong to the specified chapter';
  end if;

  -- Validate that position values are positive integers
  if exists (
    select 1
    from jsonb_array_elements(lesson_positions) as lp
    where (lp->>'position')::int <= 0
  ) then
    raise exception 'All position values must be positive integers';
  end if;

  -- Validate that we're not missing any lessons from the chapter
  if (
    select count(*)
    from public.lessons
    where chapter_id = p_chapter_id
  ) != jsonb_array_length(lesson_positions) then
    raise exception 'All lessons in the chapter must be included in the reorder operation';
  end if;

  -- Check for duplicate positions in the input
  if (
    select count(distinct (lp->>'position')::int)
    from jsonb_array_elements(lesson_positions) as lp
  ) != jsonb_array_length(lesson_positions) then
    raise exception 'Duplicate position values are not allowed';
  end if;

  -- Temporarily shift all lesson positions to avoid unique constraint conflicts
  update public.lessons
  set position = position + temp_offset
  where chapter_id = p_chapter_id;

  -- Apply new positions and update audit fields
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
  temp_offset int := 1000000;
begin
  -- Validate that tier_positions array is not empty or null
  if tier_positions is null or jsonb_array_length(tier_positions) = 0 then
    raise exception 'tier_positions array cannot be null or empty';
  end if;

  -- Validate permissions (assumes similar role functions as for chapters)
  if not exists (
    select 1 
    from public.courses c
    where c.id = p_course_id
      and (
        public.is_course_admin(c.id, p_updated_by) or
        public.is_course_editor(c.id, p_updated_by) or
        c.created_by = p_updated_by
      )
  ) then
    raise exception 'Insufficient permissions to reorder pricing tiers in this course';
  end if;

  -- Validate that all tier IDs exist and belong to the course
  if exists (
    select 1 
    from jsonb_array_elements(tier_positions) as tp
    left join public.course_pricing_tiers t on t.id = (tp->>'id')::uuid
    where t.id is null or t.course_id != p_course_id
  ) then
    raise exception 'One or more pricing tier IDs do not exist or do not belong to the specified course';
  end if;

  -- Validate that position values are positive integers
  if exists (
    select 1
    from jsonb_array_elements(tier_positions) as tp
    where (tp->>'position')::int <= 0
  ) then
    raise exception 'All position values must be positive integers';
  end if;

  -- Ensure all tiers are included
  if (
    select count(*) from public.course_pricing_tiers
    where course_id = p_course_id
  ) != jsonb_array_length(tier_positions) then
    raise exception 'All tiers for the course must be included in the reorder operation';
  end if;

  -- Check for duplicate positions
  if (
    select count(distinct (tp->>'position')::int)
    from jsonb_array_elements(tier_positions) as tp
  ) != jsonb_array_length(tier_positions) then
    raise exception 'Duplicate position values are not allowed';
  end if;

  -- Temporarily shift all active tier positions
  update public.course_pricing_tiers
  set position = position + temp_offset
  where course_id = p_course_id;

  -- Apply new positions and audit
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

CREATE OR REPLACE FUNCTION public.set_course_enrollment_expiry()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if NEW.payment_frequency = 'monthly' then
    NEW.expires_at := NEW.enrolled_at + interval '1 month';
  elsif NEW.payment_frequency = 'bi_monthly' then
    NEW.expires_at := NEW.enrolled_at + interval '2 months';
  elsif NEW.payment_frequency = 'quarterly' then
    NEW.expires_at := NEW.enrolled_at + interval '3 months';
  elsif NEW.payment_frequency = 'semi_annual' then
    NEW.expires_at := NEW.enrolled_at + interval '6 months';
  elsif NEW.payment_frequency = 'annual' then
    NEW.expires_at := NEW.enrolled_at + interval '12 months';
  else
    raise exception 'Unknown payment_frequency';
  end if;

  return NEW;
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
  has_access boolean;
  has_paid_tiers boolean;
begin
  -- verify user has permission to modify course pricing
  -- only course admins, editors, and creators can change pricing models
  select exists (
    select 1 from public.courses c
    where c.id = p_course_id
      and (
        public.is_course_admin(c.id, p_user_id)
        or public.is_course_editor(c.id, p_user_id)
        or c.created_by = p_user_id
      )
  ) into has_access;

  if not has_access then
    raise exception 'permission denied: you do not have access to modify this course (course_id=%)', p_course_id
      using errcode = '42501'; -- insufficient_privilege
  end if;

  -- check if course actually has paid tiers to convert
  -- prevents unnecessary operations on already-free courses
  select exists (
    select 1 from public.course_pricing_tiers
    where course_id = p_course_id
      and is_free = false
  ) into has_paid_tiers;

  if not has_paid_tiers then
    raise exception 'course (id=%) is already free.', p_course_id
      using errcode = 'P0001';
  end if;

  -- temporarily bypass business rule triggers during conversion
  -- this allows deletion of all tiers without triggering "last paid tier" protection
  perform set_config('app.converting_course_pricing', 'true', true);

  -- remove all existing pricing tiers (both free and paid)
  delete from public.course_pricing_tiers
  where course_id = p_course_id;

  -- re-enable business rule triggers
  perform set_config('app.converting_course_pricing', 'false', true);

  -- insert a new standard free tier
  insert into public.course_pricing_tiers (
    course_id, 
    is_free, 
    price, 
    currency_code, 
    created_by, 
    updated_by,
    payment_frequency, 
    tier_name,
    is_active
  ) values (
    p_course_id, 
    true,           -- free tier
    0,              -- no cost
    'KES',          -- local currency default
    p_user_id,      -- conversion performer
    p_user_id,      -- conversion performer
    'monthly',      -- default frequency
    'Free',         -- standard name
    true            -- active tier
  );

  -- mark all chapters in the course as not requiring payment
  update public.chapters
  set requires_payment = false
  where course_id = p_course_id;
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
  has_access boolean;
  paid_tiers_count integer;
begin
  -- verify user permissions for course pricing changes
  select exists (
    select 1 from public.courses c
    where c.id = p_course_id
      and (
        public.is_course_admin(c.id, p_user_id)
        or public.is_course_editor(c.id, p_user_id)
        or c.created_by = p_user_id
      )
  ) into has_access;

  if not has_access then
    raise exception 'permission denied: you do not have access to modify this course (course_id=%)', p_course_id
      using errcode = '42501'; -- insufficient_privilege
  end if;

  -- check if course already has paid tiers
  -- prevents accidental re-conversion of already-paid courses
  select count(*) into paid_tiers_count
  from public.course_pricing_tiers
  where course_id = p_course_id
    and is_free = false;

  if paid_tiers_count > 0 then
    raise exception 'course (id=%) already has a paid tier and is considered paid.', p_course_id
      using errcode = 'P0001';
  end if;

  -- temporarily bypass business rule triggers for clean conversion
  perform set_config('app.converting_course_pricing', 'true', true);

  -- remove all existing tiers to avoid constraint conflicts
  delete from public.course_pricing_tiers
  where course_id = p_course_id;

  -- re-enable business rule enforcement
  perform set_config('app.converting_course_pricing', 'false', true);

  -- create default paid tier with starter pricing
  insert into public.course_pricing_tiers (
    course_id,
    is_free,
    price,
    currency_code,
    created_by,
    updated_by,
    payment_frequency,
    tier_name,
    tier_description,
    is_active
  ) values (
    p_course_id,
    false,                                                      -- paid tier
    100.00,                                                     -- starter price
    'KES',                                                      -- local currency
    p_user_id,
    p_user_id,
    'monthly',
    'Basic Plan',
    'automatically added paid tier. you can update this.',
    true
  );

  -- mark all chapters in the course as requiring payment
  update public.chapters
  set requires_payment = true
  where course_id = p_course_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_course_pricing_tier_position()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  -- Only set position if it's not provided or is zero
  IF new.position IS NULL OR new.position = 0 THEN
    -- Find the highest existing position for this course and add 1
    SELECT COALESCE(MAX(position), 0) + 1
    INTO new.position
    FROM public.course_pricing_tiers
    WHERE course_id = new.course_id;
  END IF;
  RETURN new;
END;
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
DECLARE
    has_access BOOLEAN;
    current_model TEXT;
BEGIN
    -- Verify user permissions
    SELECT EXISTS (
        SELECT 1 FROM public.courses c
        WHERE c.id = p_course_id
          AND (
            public.is_course_admin(c.id, p_user_id)
            OR public.is_course_editor(c.id, p_user_id)
            OR c.created_by = p_user_id
          )
    ) INTO has_access;

    IF NOT has_access THEN
        RAISE EXCEPTION 'Permission denied: you do not have access to modify this course'
            USING errcode = '42501';
    END IF;

    -- Validate target model
    IF p_target_model NOT IN ('free', 'paid') THEN
        RAISE EXCEPTION 'Invalid target model: must be ''free'' or ''paid''';
    END IF;

    -- Determine current model
    SELECT CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.course_pricing_tiers 
            WHERE course_id = p_course_id AND is_free = false
        ) THEN 'paid'
        ELSE 'free'
    END INTO current_model;

    -- Skip if already in target model
    IF current_model = p_target_model THEN
        RAISE NOTICE 'Course is already in % model', p_target_model;
        RETURN;
    END IF;

    -- Perform the switch
    IF p_target_model = 'free' THEN
        PERFORM public.set_course_free(p_course_id, p_user_id);
    ELSE
        PERFORM public.set_course_paid(p_course_id, p_user_id);
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trg_delete_other_tiers_if_free()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  bypass_check BOOLEAN;
BEGIN
  -- Check if we're in a course conversion context
  SELECT COALESCE(current_setting('app.converting_course_pricing', true)::boolean, false) 
  INTO bypass_check;
  
  -- Skip trigger during course conversion to prevent conflicts
  IF bypass_check THEN
    RETURN new;
  END IF;

  IF new.is_free = true THEN
    -- Delete all other tiers for this course when adding a free tier
    DELETE FROM public.course_pricing_tiers
    WHERE course_id = new.course_id
      AND id != new.id;
  END IF;
  RETURN new;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trg_ensure_active_tier_exists()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  active_tier_count INTEGER;
  bypass_check BOOLEAN;
BEGIN
  -- Check if we're in a course conversion context
  SELECT COALESCE(current_setting('app.converting_course_pricing', true)::boolean, false) 
  INTO bypass_check;
  
  -- Skip trigger during course conversion to prevent conflicts
  IF bypass_check THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Handle DELETE operations
  IF TG_OP = 'DELETE' THEN
    -- Count remaining active tiers for this course after deletion
    SELECT COUNT(*)
    INTO active_tier_count
    FROM public.course_pricing_tiers
    WHERE course_id = OLD.course_id
      AND is_active = true
      AND id != OLD.id; -- Exclude the row being deleted
    
    -- Prevent deletion if it would leave no active tiers
    IF active_tier_count = 0 THEN
      RAISE EXCEPTION 'Cannot delete tier: Course must have at least one active pricing tier (course_id: %)', OLD.course_id;
    END IF;
    
    RETURN OLD;
  END IF;

  -- Handle UPDATE operations (deactivating a tier)
  IF TG_OP = 'UPDATE' AND OLD.is_active = true AND NEW.is_active = false THEN
    -- Count remaining active tiers for this course after deactivation
    SELECT COUNT(*)
    INTO active_tier_count
    FROM public.course_pricing_tiers
    WHERE course_id = NEW.course_id
      AND is_active = true
      AND id != NEW.id; -- Exclude the row being updated
    
    -- Prevent deactivation if it would leave no active tiers
    IF active_tier_count = 0 THEN
      RAISE EXCEPTION 'Cannot deactivate tier: Course must have at least one active pricing tier (course_id: %)', NEW.course_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trg_prevent_deactivating_last_free_tier()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
    bypass_check BOOLEAN;
BEGIN
    -- Check if we're in a course conversion context
    SELECT COALESCE(current_setting('app.converting_course_pricing', true)::boolean, false) 
    INTO bypass_check;
    
    -- Skip check during course conversion
    IF bypass_check THEN
        RETURN new;
    END IF;

    -- Only run check if the tier is free and is being deactivated
    IF old.is_free
       AND old.is_active
       AND new.is_active = false THEN

        -- Check if other active free tiers exist for the same course
        IF NOT EXISTS (
            SELECT 1 FROM public.course_pricing_tiers
            WHERE course_id = old.course_id
              AND id <> old.id
              AND is_free = true
              AND is_active = true
        ) THEN
            RAISE EXCEPTION 'Cannot deactivate the only free pricing tier for course %', old.course_id;
        END IF;
    END IF;

    -- Allow update
    RETURN new;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trg_prevent_deleting_last_free_tier()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
    remaining_free_count INT;
    bypass_check BOOLEAN;
BEGIN
    -- Check if we're in a course conversion context
    SELECT COALESCE(current_setting('app.converting_course_pricing', true)::boolean, false) 
    INTO bypass_check;
    
    -- Skip check during course conversion
    IF bypass_check THEN
        RETURN old;
    END IF;

    -- Only run check if the deleted tier is free
    IF old.is_free THEN
        -- Count remaining active free tiers for the same course, excluding the one being deleted
        SELECT count(*) INTO remaining_free_count
        FROM public.course_pricing_tiers
        WHERE course_id = old.course_id
          AND id <> old.id
          AND is_free = true
          AND is_active = true;

        -- If none remain, raise an error
        IF remaining_free_count = 0 THEN
            RAISE EXCEPTION 'Cannot delete the only free pricing tier for course %', old.course_id;
        END IF;
    END IF;

    -- Allow deletion
    RETURN old;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trg_prevent_deleting_last_paid_tier()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  remaining_paid_tiers INT;
  bypass_check BOOLEAN;
BEGIN
  -- Check if we're in a course conversion context (bulk operations)
  -- This allows controlled deletion during course type changes
  SELECT COALESCE(current_setting('app.converting_course_pricing', true)::boolean, false) 
  INTO bypass_check;
  
  IF bypass_check THEN
    RETURN old; -- Skip the check during course conversion
  END IF;

  -- Only check if we're deleting a paid tier
  IF old.is_free = false THEN
    -- Count remaining paid tiers after this deletion
    SELECT count(*) INTO remaining_paid_tiers
    FROM public.course_pricing_tiers
    WHERE course_id = old.course_id
      AND id != old.id
      AND is_free = false;

    -- Prevent deletion if this would leave zero paid tiers
    IF remaining_paid_tiers = 0 THEN
      RAISE EXCEPTION 'Cannot delete the last paid tier for a paid course (course_id=%)', old.course_id;
    END IF;
  END IF;
  
  RETURN old;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trg_set_updated_at_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.trg_touch_course_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  target_course_id uuid;
begin
  -- determine course_id based on operation type
  if tg_op = 'delete' then
    target_course_id := old.course_id;
  else
    target_course_id := new.course_id;
  end if;

  -- update the parent course if course_id is present
  if target_course_id is not null then
    update public.courses
    set updated_at = timezone('utc', now())
    where id = target_course_id;
  end if;

  -- return appropriate row based on trigger operation
  if tg_op = 'delete' then
    return old;
  else
    return new;
  end if;
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

grant delete on table "public"."course_collaborators" to "anon";

grant insert on table "public"."course_collaborators" to "anon";

grant references on table "public"."course_collaborators" to "anon";

grant select on table "public"."course_collaborators" to "anon";

grant trigger on table "public"."course_collaborators" to "anon";

grant truncate on table "public"."course_collaborators" to "anon";

grant update on table "public"."course_collaborators" to "anon";

grant delete on table "public"."course_collaborators" to "authenticated";

grant insert on table "public"."course_collaborators" to "authenticated";

grant references on table "public"."course_collaborators" to "authenticated";

grant select on table "public"."course_collaborators" to "authenticated";

grant trigger on table "public"."course_collaborators" to "authenticated";

grant truncate on table "public"."course_collaborators" to "authenticated";

grant update on table "public"."course_collaborators" to "authenticated";

grant delete on table "public"."course_collaborators" to "service_role";

grant insert on table "public"."course_collaborators" to "service_role";

grant references on table "public"."course_collaborators" to "service_role";

grant select on table "public"."course_collaborators" to "service_role";

grant trigger on table "public"."course_collaborators" to "service_role";

grant truncate on table "public"."course_collaborators" to "service_role";

grant update on table "public"."course_collaborators" to "service_role";

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

grant delete on table "public"."pathways" to "anon";

grant insert on table "public"."pathways" to "anon";

grant references on table "public"."pathways" to "anon";

grant select on table "public"."pathways" to "anon";

grant trigger on table "public"."pathways" to "anon";

grant truncate on table "public"."pathways" to "anon";

grant update on table "public"."pathways" to "anon";

grant delete on table "public"."pathways" to "authenticated";

grant insert on table "public"."pathways" to "authenticated";

grant references on table "public"."pathways" to "authenticated";

grant select on table "public"."pathways" to "authenticated";

grant trigger on table "public"."pathways" to "authenticated";

grant truncate on table "public"."pathways" to "authenticated";

grant update on table "public"."pathways" to "authenticated";

grant delete on table "public"."pathways" to "service_role";

grant insert on table "public"."pathways" to "service_role";

grant references on table "public"."pathways" to "service_role";

grant select on table "public"."pathways" to "service_role";

grant trigger on table "public"."pathways" to "service_role";

grant truncate on table "public"."pathways" to "service_role";

grant update on table "public"."pathways" to "service_role";

grant delete on table "public"."payments" to "anon";

grant insert on table "public"."payments" to "anon";

grant references on table "public"."payments" to "anon";

grant select on table "public"."payments" to "anon";

grant trigger on table "public"."payments" to "anon";

grant truncate on table "public"."payments" to "anon";

grant update on table "public"."payments" to "anon";

grant delete on table "public"."payments" to "authenticated";

grant insert on table "public"."payments" to "authenticated";

grant references on table "public"."payments" to "authenticated";

grant select on table "public"."payments" to "authenticated";

grant trigger on table "public"."payments" to "authenticated";

grant truncate on table "public"."payments" to "authenticated";

grant update on table "public"."payments" to "authenticated";

grant delete on table "public"."payments" to "service_role";

grant insert on table "public"."payments" to "service_role";

grant references on table "public"."payments" to "service_role";

grant select on table "public"."payments" to "service_role";

grant trigger on table "public"."payments" to "service_role";

grant truncate on table "public"."payments" to "service_role";

grant update on table "public"."payments" to "service_role";

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

grant delete on table "public"."published_course_enrollment_activities" to "anon";

grant insert on table "public"."published_course_enrollment_activities" to "anon";

grant references on table "public"."published_course_enrollment_activities" to "anon";

grant select on table "public"."published_course_enrollment_activities" to "anon";

grant trigger on table "public"."published_course_enrollment_activities" to "anon";

grant truncate on table "public"."published_course_enrollment_activities" to "anon";

grant update on table "public"."published_course_enrollment_activities" to "anon";

grant delete on table "public"."published_course_enrollment_activities" to "authenticated";

grant insert on table "public"."published_course_enrollment_activities" to "authenticated";

grant references on table "public"."published_course_enrollment_activities" to "authenticated";

grant select on table "public"."published_course_enrollment_activities" to "authenticated";

grant trigger on table "public"."published_course_enrollment_activities" to "authenticated";

grant truncate on table "public"."published_course_enrollment_activities" to "authenticated";

grant update on table "public"."published_course_enrollment_activities" to "authenticated";

grant delete on table "public"."published_course_enrollment_activities" to "service_role";

grant insert on table "public"."published_course_enrollment_activities" to "service_role";

grant references on table "public"."published_course_enrollment_activities" to "service_role";

grant select on table "public"."published_course_enrollment_activities" to "service_role";

grant trigger on table "public"."published_course_enrollment_activities" to "service_role";

grant truncate on table "public"."published_course_enrollment_activities" to "service_role";

grant update on table "public"."published_course_enrollment_activities" to "service_role";

grant delete on table "public"."published_course_enrollments" to "anon";

grant insert on table "public"."published_course_enrollments" to "anon";

grant references on table "public"."published_course_enrollments" to "anon";

grant select on table "public"."published_course_enrollments" to "anon";

grant trigger on table "public"."published_course_enrollments" to "anon";

grant truncate on table "public"."published_course_enrollments" to "anon";

grant update on table "public"."published_course_enrollments" to "anon";

grant delete on table "public"."published_course_enrollments" to "authenticated";

grant insert on table "public"."published_course_enrollments" to "authenticated";

grant references on table "public"."published_course_enrollments" to "authenticated";

grant select on table "public"."published_course_enrollments" to "authenticated";

grant trigger on table "public"."published_course_enrollments" to "authenticated";

grant truncate on table "public"."published_course_enrollments" to "authenticated";

grant update on table "public"."published_course_enrollments" to "authenticated";

grant delete on table "public"."published_course_enrollments" to "service_role";

grant insert on table "public"."published_course_enrollments" to "service_role";

grant references on table "public"."published_course_enrollments" to "service_role";

grant select on table "public"."published_course_enrollments" to "service_role";

grant trigger on table "public"."published_course_enrollments" to "service_role";

grant truncate on table "public"."published_course_enrollments" to "service_role";

grant update on table "public"."published_course_enrollments" to "service_role";

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

create policy "delete: course admins, editors, and owners can remove chapters"
on "public"."chapters"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = chapters.course_id) AND (is_course_admin(c.id, ( SELECT auth.uid() AS uid)) OR is_course_editor(c.id, ( SELECT auth.uid() AS uid)) OR (c.created_by = ( SELECT auth.uid() AS uid)))))));


create policy "insert: users with course roles or owners can add chapters"
on "public"."chapters"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = chapters.course_id) AND (is_course_admin(c.id, ( SELECT auth.uid() AS uid)) OR is_course_editor(c.id, ( SELECT auth.uid() AS uid)) OR (c.created_by = ( SELECT auth.uid() AS uid)))))));


create policy "select: users with course roles or owners can view chapters"
on "public"."chapters"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = chapters.course_id) AND (is_course_admin(c.id, ( SELECT auth.uid() AS uid)) OR is_course_editor(c.id, ( SELECT auth.uid() AS uid)) OR is_course_viewer(c.id, ( SELECT auth.uid() AS uid)) OR (c.created_by = ( SELECT auth.uid() AS uid)))))));


create policy "update: users with admin/editor roles or owners can modify chap"
on "public"."chapters"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = chapters.course_id) AND (is_course_admin(c.id, ( SELECT auth.uid() AS uid)) OR is_course_editor(c.id, ( SELECT auth.uid() AS uid)) OR (c.created_by = ( SELECT auth.uid() AS uid)))))))
with check ((EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = chapters.course_id) AND (is_course_admin(c.id, ( SELECT auth.uid() AS uid)) OR is_course_editor(c.id, ( SELECT auth.uid() AS uid)) OR (c.created_by = ( SELECT auth.uid() AS uid)))))));


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


create policy "RLS: Delete if course admin or self"
on "public"."course_collaborators"
as permissive
for delete
to authenticated
using ((is_course_admin(course_id, ( SELECT auth.uid() AS uid)) OR (user_id = ( SELECT auth.uid() AS uid))));


create policy "RLS: Insert if course admin or created_by self"
on "public"."course_collaborators"
as permissive
for insert
to authenticated
with check ((is_course_admin(course_id, ( SELECT auth.uid() AS uid)) OR (( SELECT auth.uid() AS uid) = created_by)));


create policy "RLS: Select if course admin or self"
on "public"."course_collaborators"
as permissive
for select
to authenticated
using ((is_course_admin(course_id, ( SELECT auth.uid() AS uid)) OR (user_id = ( SELECT auth.uid() AS uid))));


create policy "RLS: Update if course admin or created_by self"
on "public"."course_collaborators"
as permissive
for update
to authenticated
using ((is_course_admin(course_id, ( SELECT auth.uid() AS uid)) OR (( SELECT auth.uid() AS uid) = created_by)))
with check ((is_course_admin(course_id, ( SELECT auth.uid() AS uid)) OR (( SELECT auth.uid() AS uid) = created_by)));


create policy "delete: course admins, editors, and owners can remove pricing t"
on "public"."course_pricing_tiers"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = course_pricing_tiers.course_id) AND (is_course_admin(c.id, ( SELECT auth.uid() AS uid)) OR is_course_editor(c.id, ( SELECT auth.uid() AS uid)) OR (c.created_by = ( SELECT auth.uid() AS uid)))))));


create policy "insert: users with course roles or owners can add pricing tiers"
on "public"."course_pricing_tiers"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = course_pricing_tiers.course_id) AND (is_course_admin(c.id, ( SELECT auth.uid() AS uid)) OR is_course_editor(c.id, ( SELECT auth.uid() AS uid)) OR (c.created_by = ( SELECT auth.uid() AS uid)))))));


create policy "select: users with course roles or owners can view pricing tier"
on "public"."course_pricing_tiers"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = course_pricing_tiers.course_id) AND (is_course_admin(c.id, ( SELECT auth.uid() AS uid)) OR is_course_editor(c.id, ( SELECT auth.uid() AS uid)) OR is_course_viewer(c.id, ( SELECT auth.uid() AS uid)) OR (c.created_by = ( SELECT auth.uid() AS uid)))))));


create policy "update: users with admin/editor roles or owners can modify pric"
on "public"."course_pricing_tiers"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = course_pricing_tiers.course_id) AND (is_course_admin(c.id, ( SELECT auth.uid() AS uid)) OR is_course_editor(c.id, ( SELECT auth.uid() AS uid)) OR (c.created_by = ( SELECT auth.uid() AS uid)))))))
with check ((EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = course_pricing_tiers.course_id) AND (is_course_admin(c.id, ( SELECT auth.uid() AS uid)) OR is_course_editor(c.id, ( SELECT auth.uid() AS uid)) OR (c.created_by = ( SELECT auth.uid() AS uid)))))));


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


create policy "Delete: owner can remove their own course"
on "public"."courses"
as permissive
for delete
to authenticated
using ((created_by = ( SELECT auth.uid() AS uid)));


create policy "Insert: user can create a course under their ID"
on "public"."courses"
as permissive
for insert
to authenticated
with check ((( SELECT auth.uid() AS uid) = created_by));


create policy "Select: user can read their own course or if admin/editor/viewe"
on "public"."courses"
as permissive
for select
to authenticated
using ((is_course_admin(id, ( SELECT auth.uid() AS uid)) OR is_course_editor(id, ( SELECT auth.uid() AS uid)) OR is_course_viewer(id, ( SELECT auth.uid() AS uid)) OR (created_by = ( SELECT auth.uid() AS uid))));


create policy "Update: admin/editor or owner can modify their own course"
on "public"."courses"
as permissive
for update
to authenticated
using ((is_course_admin(id, ( SELECT auth.uid() AS uid)) OR is_course_editor(id, ( SELECT auth.uid() AS uid)) OR (created_by = ( SELECT auth.uid() AS uid))))
with check ((is_course_admin(id, ( SELECT auth.uid() AS uid)) OR is_course_editor(id, ( SELECT auth.uid() AS uid)) OR (created_by = ( SELECT auth.uid() AS uid))));


create policy "file_library_delete_owner_only"
on "public"."file_library"
as permissive
for delete
to public
using ((( SELECT auth.uid() AS uid) = created_by));


create policy "file_library_insert_owner_only"
on "public"."file_library"
as permissive
for insert
to public
with check ((( SELECT auth.uid() AS uid) = created_by));


create policy "file_library_read_all"
on "public"."file_library"
as permissive
for select
to authenticated, anon
using (true);


create policy "file_library_update_owner_only"
on "public"."file_library"
as permissive
for update
to public
using ((( SELECT auth.uid() AS uid) = created_by));


create policy "delete: course admins, editors, and owners can remove lesson bl"
on "public"."lesson_blocks"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM (courses c
     JOIN lessons l ON ((l.course_id = c.id)))
  WHERE ((l.id = lesson_blocks.lesson_id) AND (is_course_admin(c.id, ( SELECT auth.uid() AS uid)) OR is_course_editor(c.id, ( SELECT auth.uid() AS uid)) OR (c.created_by = ( SELECT auth.uid() AS uid)))))));


create policy "insert: users with course roles (admin/editor) or owners can ad"
on "public"."lesson_blocks"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM (courses c
     JOIN lessons l ON ((l.course_id = c.id)))
  WHERE ((l.id = lesson_blocks.lesson_id) AND (is_course_admin(c.id, ( SELECT auth.uid() AS uid)) OR is_course_editor(c.id, ( SELECT auth.uid() AS uid)) OR (c.created_by = ( SELECT auth.uid() AS uid)))))));


create policy "select: users with course roles (admin/editor/viewer) or owners"
on "public"."lesson_blocks"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM (courses c
     JOIN lessons l ON ((l.course_id = c.id)))
  WHERE ((l.id = lesson_blocks.lesson_id) AND (is_course_admin(c.id, ( SELECT auth.uid() AS uid)) OR is_course_editor(c.id, ( SELECT auth.uid() AS uid)) OR is_course_viewer(c.id, ( SELECT auth.uid() AS uid)) OR (c.created_by = ( SELECT auth.uid() AS uid)))))));


create policy "update: users with admin/editor roles or owners can modify less"
on "public"."lesson_blocks"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM (courses c
     JOIN lessons l ON ((l.course_id = c.id)))
  WHERE ((l.id = lesson_blocks.lesson_id) AND (is_course_admin(c.id, ( SELECT auth.uid() AS uid)) OR is_course_editor(c.id, ( SELECT auth.uid() AS uid)) OR (c.created_by = ( SELECT auth.uid() AS uid)))))))
with check ((EXISTS ( SELECT 1
   FROM (courses c
     JOIN lessons l ON ((l.course_id = c.id)))
  WHERE ((l.id = lesson_blocks.lesson_id) AND (is_course_admin(c.id, ( SELECT auth.uid() AS uid)) OR is_course_editor(c.id, ( SELECT auth.uid() AS uid)) OR (c.created_by = ( SELECT auth.uid() AS uid)))))));


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


create policy "delete: admins, editors, or owners can remove lessons"
on "public"."lessons"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = lessons.course_id) AND (is_course_admin(c.id, ( SELECT auth.uid() AS uid)) OR is_course_editor(c.id, ( SELECT auth.uid() AS uid)) OR (c.created_by = ( SELECT auth.uid() AS uid)))))));


create policy "insert: admins, editors, or owners can add lessons"
on "public"."lessons"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = lessons.course_id) AND (is_course_admin(c.id, ( SELECT auth.uid() AS uid)) OR is_course_editor(c.id, ( SELECT auth.uid() AS uid)) OR (c.created_by = ( SELECT auth.uid() AS uid)))))));


create policy "select: users with course roles or owners can view lessons"
on "public"."lessons"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = lessons.course_id) AND (is_course_admin(c.id, ( SELECT auth.uid() AS uid)) OR is_course_editor(c.id, ( SELECT auth.uid() AS uid)) OR is_course_viewer(c.id, ( SELECT auth.uid() AS uid)) OR (c.created_by = ( SELECT auth.uid() AS uid)))))));


create policy "update: admins, editors, or owners can modify lessons"
on "public"."lessons"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = lessons.course_id) AND (is_course_admin(c.id, ( SELECT auth.uid() AS uid)) OR is_course_editor(c.id, ( SELECT auth.uid() AS uid)) OR (c.created_by = ( SELECT auth.uid() AS uid)))))))
with check ((EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = lessons.course_id) AND (is_course_admin(c.id, ( SELECT auth.uid() AS uid)) OR is_course_editor(c.id, ( SELECT auth.uid() AS uid)) OR (c.created_by = ( SELECT auth.uid() AS uid)))))));


create policy "pathways_delete_own_record"
on "public"."pathways"
as permissive
for delete
to public
using ((( SELECT auth.uid() AS uid) = created_by));


create policy "pathways_insert_own_record"
on "public"."pathways"
as permissive
for insert
to public
with check ((( SELECT auth.uid() AS uid) = created_by));


create policy "pathways_read_public"
on "public"."pathways"
as permissive
for select
to authenticated, anon
using (true);


create policy "pathways_update_own_record"
on "public"."pathways"
as permissive
for update
to public
using ((( SELECT auth.uid() AS uid) = created_by));


create policy "Allow public read access to profiles"
on "public"."profiles"
as permissive
for select
to authenticated, anon
using (true);


create policy "Allow user to create own profile"
on "public"."profiles"
as permissive
for insert
to authenticated
with check ((( SELECT auth.uid() AS uid) = id));


create policy "Allow user to delete own profile"
on "public"."profiles"
as permissive
for delete
to authenticated
using ((( SELECT auth.uid() AS uid) = id));


create policy "Allow user to update own profile"
on "public"."profiles"
as permissive
for update
to authenticated
using ((( SELECT auth.uid() AS uid) = id))
with check ((( SELECT auth.uid() AS uid) = id));


create policy "Authenticated users can insert their enrollment activities"
on "public"."published_course_enrollment_activities"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM published_course_enrollments e
  WHERE ((e.id = published_course_enrollment_activities.enrollment_id) AND (e.user_id = auth.uid())))));


create policy "Authenticated users can read their enrollment activities"
on "public"."published_course_enrollment_activities"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM published_course_enrollments e
  WHERE ((e.id = published_course_enrollment_activities.enrollment_id) AND (e.user_id = auth.uid())))));


create policy "Authenticated users can update their enrollment activities"
on "public"."published_course_enrollment_activities"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM published_course_enrollments e
  WHERE ((e.id = published_course_enrollment_activities.enrollment_id) AND (e.user_id = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM published_course_enrollments e
  WHERE ((e.id = published_course_enrollment_activities.enrollment_id) AND (e.user_id = auth.uid())))));


create policy "Allow authenticated users to insert their enrollments"
on "public"."published_course_enrollments"
as permissive
for insert
to authenticated
with check ((user_id = auth.uid()));


create policy "Allow authenticated users to update their enrollments"
on "public"."published_course_enrollments"
as permissive
for update
to authenticated
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));


create policy "select: users with course roles (admin/editor/viewer) or owners"
on "public"."published_course_enrollments"
as permissive
for select
to authenticated
using (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = published_course_enrollments.published_course_id) AND (is_course_admin(c.id, auth.uid()) OR is_course_editor(c.id, auth.uid()) OR is_course_viewer(c.id, auth.uid()) OR (c.created_by = auth.uid())))))));


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


create policy "Allow auth admin to read user roles"
on "public"."user_roles"
as permissive
for select
to supabase_auth_admin
using (true);


CREATE TRIGGER trg_set_chapter_position BEFORE INSERT ON public.chapters FOR EACH ROW EXECUTE FUNCTION set_chapter_position();

CREATE TRIGGER trg_touch_course_on_chapter_update AFTER INSERT OR DELETE OR UPDATE ON public.chapters FOR EACH ROW EXECUTE FUNCTION trg_touch_course_updated_at();

CREATE TRIGGER trg_course_categories_set_updated_at BEFORE UPDATE ON public.course_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_course_collaborators_set_updated_at BEFORE UPDATE ON public.course_collaborators FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_ensure_active_tier BEFORE DELETE OR UPDATE ON public.course_pricing_tiers FOR EACH ROW EXECUTE FUNCTION trg_ensure_active_tier_exists();

CREATE TRIGGER trg_handle_free_tier AFTER INSERT OR UPDATE ON public.course_pricing_tiers FOR EACH ROW EXECUTE FUNCTION trg_delete_other_tiers_if_free();

CREATE TRIGGER trg_prevent_deactivating_last_free_tier BEFORE UPDATE ON public.course_pricing_tiers FOR EACH ROW WHEN (((old.is_active = true) AND (new.is_active = false))) EXECUTE FUNCTION trg_prevent_deactivating_last_free_tier();

CREATE TRIGGER trg_prevent_deleting_last_free_tier BEFORE DELETE ON public.course_pricing_tiers FOR EACH ROW EXECUTE FUNCTION trg_prevent_deleting_last_free_tier();

CREATE TRIGGER trg_prevent_last_paid_tier_deletion BEFORE DELETE ON public.course_pricing_tiers FOR EACH ROW EXECUTE FUNCTION trg_prevent_deleting_last_paid_tier();

CREATE TRIGGER trg_set_course_pricing_tier_position BEFORE INSERT ON public.course_pricing_tiers FOR EACH ROW EXECUTE FUNCTION set_course_pricing_tier_position();

CREATE TRIGGER trg_touch_course_on_course_pricing_tiers_update AFTER INSERT OR DELETE OR UPDATE ON public.course_pricing_tiers FOR EACH ROW EXECUTE FUNCTION trg_touch_course_updated_at();

CREATE TRIGGER trg_course_sub_categories_set_updated_at BEFORE UPDATE ON public.course_sub_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_add_default_free_pricing_tier AFTER INSERT ON public.courses FOR EACH ROW EXECUTE FUNCTION add_default_free_pricing_tier();

CREATE TRIGGER trg_courses_set_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at_timestamp();

CREATE TRIGGER trg_validate_subcategory BEFORE INSERT OR UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION validate_subcategory_belongs_to_category();

CREATE TRIGGER set_file_type_before_insert_update BEFORE INSERT OR UPDATE ON public.file_library FOR EACH ROW EXECUTE FUNCTION set_file_type_from_extension();

CREATE TRIGGER set_updated_at_on_file_library BEFORE UPDATE ON public.file_library FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_set_lesson_block_position BEFORE INSERT ON public.lesson_blocks FOR EACH ROW EXECUTE FUNCTION set_lesson_block_position();

CREATE TRIGGER trg_touch_course_on_lesson_block_update AFTER INSERT OR DELETE OR UPDATE ON public.lesson_blocks FOR EACH ROW EXECUTE FUNCTION trg_touch_course_updated_at();

CREATE TRIGGER trg_lesson_types_set_updated_at BEFORE UPDATE ON public.lesson_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_set_lesson_position BEFORE INSERT ON public.lessons FOR EACH ROW EXECUTE FUNCTION set_lesson_position();

CREATE TRIGGER trg_touch_course_on_lesson_update AFTER INSERT OR DELETE OR UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION trg_touch_course_updated_at();

CREATE TRIGGER trg_pathways_set_updated_at BEFORE UPDATE ON public.pathways FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_set_expiry BEFORE INSERT ON public.published_course_enrollments FOR EACH ROW EXECUTE FUNCTION set_course_enrollment_expiry();


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();


create policy "Allow public access to avatar images"
on "storage"."objects"
as permissive
for select
to public
using ((bucket_id = 'avatars'::text));


create policy "Allow uploading avatar images"
on "storage"."objects"
as permissive
for insert
to public
with check ((bucket_id = 'avatars'::text));


create policy "Allow user to delete own avatar"
on "storage"."objects"
as permissive
for delete
to public
using (((( SELECT auth.uid() AS uid) = owner) AND (bucket_id = 'avatars'::text)));


create policy "Allow user to update own avatar"
on "storage"."objects"
as permissive
for update
to public
using ((( SELECT auth.uid() AS uid) = owner))
with check ((bucket_id = 'avatars'::text));


create policy "Delete: owner can delete course thumbnails"
on "storage"."objects"
as permissive
for delete
to public
using (((bucket_id = 'courses'::text) AND (owner = ( SELECT auth.uid() AS uid))));


create policy "Insert: allow only admin/editor to upload to courses bucket"
on "storage"."objects"
as permissive
for insert
to public
with check (((bucket_id = 'courses'::text) AND (is_course_admin(((metadata ->> 'id'::text))::uuid, ( SELECT auth.uid() AS uid)) OR is_course_editor(((metadata ->> 'id'::text))::uuid, ( SELECT auth.uid() AS uid)) OR (owner = ( SELECT auth.uid() AS uid)))));


create policy "Select: allow public read access to course thumbnails"
on "storage"."objects"
as permissive
for select
to public
using ((bucket_id = 'courses'::text));


create policy "Update: admin/editor/owner can update course thumbnails"
on "storage"."objects"
as permissive
for update
to public
using (((bucket_id = 'courses'::text) AND (is_course_admin(((metadata ->> 'id'::text))::uuid, ( SELECT auth.uid() AS uid)) OR is_course_editor(((metadata ->> 'id'::text))::uuid, ( SELECT auth.uid() AS uid)) OR (owner = ( SELECT auth.uid() AS uid)))))
with check ((bucket_id = 'courses'::text));


create policy "allow files bucket delete access"
on "storage"."objects"
as permissive
for delete
to public
using (((( SELECT auth.uid() AS uid) = (owner_id)::uuid) AND (bucket_id = 'files'::text)));


create policy "allow files bucket insert access"
on "storage"."objects"
as permissive
for insert
to public
with check (((( SELECT auth.uid() AS uid) = (owner_id)::uuid) AND (bucket_id = 'files'::text)));


create policy "allow files bucket select access"
on "storage"."objects"
as permissive
for select
to public
using (((auth.role() = 'authenticated'::text) AND (bucket_id = 'files'::text)));


create policy "allow files bucket update access"
on "storage"."objects"
as permissive
for update
to public
using ((( SELECT auth.uid() AS uid) = (owner_id)::uuid))
with check ((bucket_id = 'files'::text));


create policy "pathways_bucket_delete_own_object"
on "storage"."objects"
as permissive
for delete
to public
using (((( SELECT auth.uid() AS uid) = owner) AND (bucket_id = 'pathways'::text)));


create policy "pathways_bucket_insert"
on "storage"."objects"
as permissive
for insert
to public
with check ((bucket_id = 'pathways'::text));


create policy "pathways_bucket_read"
on "storage"."objects"
as permissive
for select
to public
using ((bucket_id = 'pathways'::text));


create policy "pathways_bucket_update_own_object"
on "storage"."objects"
as permissive
for update
to public
using ((( SELECT auth.uid() AS uid) = owner))
with check ((bucket_id = 'pathways'::text));



