create type "public"."app_permission" as enum ('course_categories.insert', 'course_categories.update', 'course_categories.delete', 'course_sub_categories.insert', 'course_sub_categories.update', 'course_sub_categories.delete', 'featured_courses_pricing.insert', 'featured_courses_pricing.update', 'featured_courses_pricing.delete', 'lesson_types.insert', 'lesson_types.update', 'lesson_types.delete');

create type "public"."app_role" as enum ('go_su', 'go_admin', 'go_staff', 'user');

create type "public"."course_access" as enum ('public', 'private');

create type "public"."course_pricing" as enum ('free', 'paid');

create table "public"."course_categories" (
    "id" uuid not null default uuid_generate_v4(),
    "name" text not null,
    "description" text not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_by" uuid not null,
    "updated_by" uuid not null
);


alter table "public"."course_categories" enable row level security;

create table "public"."course_sub_categories" (
    "id" uuid not null default uuid_generate_v4(),
    "category_id" uuid not null,
    "name" text not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_by" uuid not null,
    "updated_by" uuid not null
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
    "pricing_model" course_pricing not null default 'free'::course_pricing,
    "monthly_subscription_price" numeric(19,4),
    "visibility" course_access not null default 'public'::course_access,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "last_published" timestamp with time zone,
    "created_by" uuid not null,
    "updated_by" uuid not null
);


alter table "public"."courses" enable row level security;

create table "public"."pathways" (
    "id" uuid not null default uuid_generate_v4(),
    "name" text not null,
    "description" text not null,
    "image_url" text not null,
    "blur_hash" text not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_by" uuid not null,
    "updated_by" uuid not null
);


alter table "public"."pathways" enable row level security;

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

CREATE UNIQUE INDEX course_categories_pkey ON public.course_categories USING btree (id);

CREATE UNIQUE INDEX course_sub_categories_pkey ON public.course_sub_categories USING btree (id);

CREATE UNIQUE INDEX courses_pkey ON public.courses USING btree (id);

CREATE INDEX idx_course_categories_created_by ON public.course_categories USING btree (created_by);

CREATE INDEX idx_course_categories_updated_by ON public.course_categories USING btree (updated_by);

CREATE INDEX idx_course_sub_categories_category_id ON public.course_sub_categories USING btree (category_id);

CREATE INDEX idx_course_sub_categories_created_by ON public.course_sub_categories USING btree (created_by);

CREATE INDEX idx_course_sub_categories_updated_by ON public.course_sub_categories USING btree (updated_by);

CREATE INDEX idx_courses_category_id ON public.courses USING btree (category_id);

CREATE INDEX idx_courses_created_by ON public.courses USING btree (created_by);

CREATE INDEX idx_courses_pathway_id ON public.courses USING btree (pathway_id);

CREATE INDEX idx_courses_subcategory_id ON public.courses USING btree (subcategory_id);

CREATE INDEX idx_courses_updated_by ON public.courses USING btree (updated_by);

CREATE INDEX idx_courses_visibility ON public.courses USING btree (visibility);

CREATE INDEX idx_pathways_created_by ON public.pathways USING btree (created_by);

CREATE INDEX idx_pathways_updated_by ON public.pathways USING btree (updated_by);

CREATE INDEX idx_profiles_country_code ON public.profiles USING btree (country_code);

CREATE INDEX idx_profiles_created_at ON public.profiles USING btree (created_at);

CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);

CREATE INDEX idx_profiles_onboarding_status ON public.profiles USING btree (is_onboarding_complete, account_verified);

CREATE INDEX idx_profiles_username ON public.profiles USING btree (username) WHERE (username IS NOT NULL);

CREATE INDEX idx_profiles_verified_users ON public.profiles USING btree (id) WHERE (account_verified = true);

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);

CREATE UNIQUE INDEX pathways_pkey ON public.pathways USING btree (id);

CREATE UNIQUE INDEX profiles_email_key ON public.profiles USING btree (email);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX profiles_username_key ON public.profiles USING btree (username);

CREATE UNIQUE INDEX role_permissions_pkey ON public.role_permissions USING btree (id);

CREATE UNIQUE INDEX role_permissions_role_permission_key ON public.role_permissions USING btree (role, permission);

CREATE UNIQUE INDEX user_roles_pkey ON public.user_roles USING btree (id);

CREATE UNIQUE INDEX user_roles_user_id_role_key ON public.user_roles USING btree (user_id, role);

alter table "public"."course_categories" add constraint "course_categories_pkey" PRIMARY KEY using index "course_categories_pkey";

alter table "public"."course_sub_categories" add constraint "course_sub_categories_pkey" PRIMARY KEY using index "course_sub_categories_pkey";

alter table "public"."courses" add constraint "courses_pkey" PRIMARY KEY using index "courses_pkey";

alter table "public"."pathways" add constraint "pathways_pkey" PRIMARY KEY using index "pathways_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."role_permissions" add constraint "role_permissions_pkey" PRIMARY KEY using index "role_permissions_pkey";

alter table "public"."user_roles" add constraint "user_roles_pkey" PRIMARY KEY using index "user_roles_pkey";

alter table "public"."course_categories" add constraint "course_categories_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) not valid;

alter table "public"."course_categories" validate constraint "course_categories_created_by_fkey";

alter table "public"."course_categories" add constraint "course_categories_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) not valid;

alter table "public"."course_categories" validate constraint "course_categories_updated_by_fkey";

alter table "public"."course_sub_categories" add constraint "course_sub_categories_category_id_fkey" FOREIGN KEY (category_id) REFERENCES course_categories(id) ON DELETE CASCADE not valid;

alter table "public"."course_sub_categories" validate constraint "course_sub_categories_category_id_fkey";

alter table "public"."course_sub_categories" add constraint "course_sub_categories_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) not valid;

alter table "public"."course_sub_categories" validate constraint "course_sub_categories_created_by_fkey";

alter table "public"."course_sub_categories" add constraint "course_sub_categories_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) not valid;

alter table "public"."course_sub_categories" validate constraint "course_sub_categories_updated_by_fkey";

alter table "public"."courses" add constraint "check_paid_courses_subscription_price" CHECK (((pricing_model = 'free'::course_pricing) OR ((pricing_model = 'paid'::course_pricing) AND (monthly_subscription_price IS NOT NULL) AND (monthly_subscription_price > (0)::numeric)))) not valid;

alter table "public"."courses" validate constraint "check_paid_courses_subscription_price";

alter table "public"."courses" add constraint "courses_category_id_fkey" FOREIGN KEY (category_id) REFERENCES course_categories(id) ON DELETE SET NULL not valid;

alter table "public"."courses" validate constraint "courses_category_id_fkey";

alter table "public"."courses" add constraint "courses_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT not valid;

alter table "public"."courses" validate constraint "courses_created_by_fkey";

alter table "public"."courses" add constraint "courses_pathway_id_fkey" FOREIGN KEY (pathway_id) REFERENCES pathways(id) ON DELETE SET NULL not valid;

alter table "public"."courses" validate constraint "courses_pathway_id_fkey";

alter table "public"."courses" add constraint "courses_subcategory_id_fkey" FOREIGN KEY (subcategory_id) REFERENCES course_sub_categories(id) ON DELETE SET NULL not valid;

alter table "public"."courses" validate constraint "courses_subcategory_id_fkey";

alter table "public"."courses" add constraint "courses_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE RESTRICT not valid;

alter table "public"."courses" validate constraint "courses_updated_by_fkey";

alter table "public"."pathways" add constraint "pathways_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."pathways" validate constraint "pathways_created_by_fkey";

alter table "public"."pathways" add constraint "pathways_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."pathways" validate constraint "pathways_updated_by_fkey";

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

alter table "public"."role_permissions" add constraint "role_permissions_role_permission_key" UNIQUE using index "role_permissions_role_permission_key";

alter table "public"."user_roles" add constraint "user_roles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."user_roles" validate constraint "user_roles_user_id_fkey";

alter table "public"."user_roles" add constraint "user_roles_user_id_role_key" UNIQUE using index "user_roles_user_id_role_key";

set check_function_bodies = off;

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
  -- Retrieve user's role from JWT custom claim
  select (auth.jwt() ->> 'user_role')::public.app_role into user_role;

  -- Count matching role-permission entries
  select count(*) into has_permission
  from public.role_permissions
  where role = user_role
    and permission = requested_permission;

  -- Return true if at least one match found
  return has_permission > 0;
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
  -- Look up the user's role from the database
  select role into user_role from public.user_roles
  where user_id = (event->>'user_id')::uuid;

  claims := event->'claims';

  -- Add the user_role claim (or null if no role is found)
  if user_role is not null then
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  else
    claims := jsonb_set(claims, '{user_role}', 'null');
  end if;

  -- Return updated JWT claims object
  event := jsonb_set(event, '{claims}', claims);
  return event;
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
  -- Insert into profiles table with proper error handling
  begin
    insert into public.profiles (
      id, 
      username, 
      email, 
      full_name, 
      avatar_url,
      email_verified
    ) 
    values (
      new.id,
      new.raw_user_meta_data->>'username',
      new.email,
      coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
      new.raw_user_meta_data->>'avatar_url',
      (new.email_confirmed_at is not null)
    );
  exception
    when others then
      raise notice 'Error inserting profile for user %: %', new.id, sqlerrm;
      raise;  -- re-raise error to abort
  end;

  -- Assign roles based on email
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
      raise notice 'Error inserting user role for user %: %', new.id, sqlerrm;
      raise;
  end;

  return null;  -- AFTER triggers return NULL
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


create policy "Delete: user can remove their own course"
on "public"."courses"
as permissive
for delete
to authenticated
using ((( SELECT auth.uid() AS uid) = id));


create policy "Insert: user can create a course under their ID"
on "public"."courses"
as permissive
for insert
to authenticated
with check ((( SELECT auth.uid() AS uid) = id));


create policy "Select: user can read their own course"
on "public"."courses"
as permissive
for select
to authenticated
using ((( SELECT auth.uid() AS uid) = id));


create policy "Update: user can modify their own course"
on "public"."courses"
as permissive
for update
to authenticated
using ((( SELECT auth.uid() AS uid) = id))
with check ((( SELECT auth.uid() AS uid) = id));


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


CREATE TRIGGER trg_course_categories_set_updated_at BEFORE UPDATE ON public.course_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_course_sub_categories_set_updated_at BEFORE UPDATE ON public.course_sub_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_courses_set_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_pathways_set_updated_at BEFORE UPDATE ON public.pathways FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


create or replace trigger on_auth_user_created_create_profile_trigger
  after insert on auth.users
  for each row
  execute function handle_new_user();

comment on trigger on_auth_user_created_create_profile_trigger on auth.users is 
  'Automatically creates profile and assigns role when a new user signs up via Supabase Auth';