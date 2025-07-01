create type "public"."analytics_level" as enum ('basic', 'intermediate', 'advanced', 'enterprise');

create type "public"."app_permission" as enum ('course_categories.insert', 'course_categories.update', 'course_categories.delete', 'course_sub_categories.insert', 'course_sub_categories.update', 'course_sub_categories.delete', 'featured_courses_pricing.insert', 'featured_courses_pricing.update', 'featured_courses_pricing.delete', 'lesson_types.insert', 'lesson_types.update', 'lesson_types.delete', 'pricing_tier.crud');

create type "public"."app_role" as enum ('go_su', 'go_admin', 'go_staff', 'user');

create type "public"."org_role" as enum ('owner', 'admin', 'editor', 'instructor', 'analyst', 'support', 'collaborator', 'ai_collaborator');

create type "public"."profile_mode" as enum ('personal', 'organization');

create type "public"."subscription_status" as enum ('active', 'canceled', 'past_due', 'trialing', 'incomplete');

create type "public"."subscription_tier" as enum ('launch', 'scale', 'impact', 'enterprise');

create type "public"."support_level" as enum ('community', 'email', 'priority', 'dedicated');

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

create table "public"."organization_members" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "user_id" uuid not null,
    "role" org_role not null,
    "invited_by" uuid,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


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

create table "public"."role_permissions" (
    "id" uuid not null default uuid_generate_v4(),
    "role" app_role not null,
    "permission" app_permission not null
);


alter table "public"."role_permissions" enable row level security;

create table "public"."tier_limits" (
    "tier" subscription_tier not null,
    "max_departments_per_org" integer not null,
    "storage_limit_mb_per_org" integer not null,
    "max_admins_per_org" integer not null,
    "max_collaborators_per_course" integer not null,
    "max_free_courses_per_org" integer not null,
    "max_students_per_course" integer not null,
    "ai_tools_enabled" boolean not null default false,
    "ai_usage_limit_monthly" integer,
    "custom_domains_enabled" boolean not null default false,
    "max_custom_domains" integer,
    "analytics_level" analytics_level not null,
    "support_level" support_level not null,
    "platform_fee_percentage" numeric(5,2) not null default 15.00,
    "white_label_enabled" boolean not null default false
);


alter table "public"."tier_limits" enable row level security;

create table "public"."user_roles" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "role" app_role not null
);


alter table "public"."user_roles" enable row level security;

CREATE UNIQUE INDEX course_categories_pkey ON public.course_categories USING btree (id);

CREATE UNIQUE INDEX course_sub_categories_pkey ON public.course_sub_categories USING btree (id);

CREATE INDEX idx_course_categories_created_by ON public.course_categories USING btree (created_by);

CREATE INDEX idx_course_categories_updated_by ON public.course_categories USING btree (updated_by);

CREATE INDEX idx_course_sub_categories_category_id ON public.course_sub_categories USING btree (category_id);

CREATE INDEX idx_course_sub_categories_created_by ON public.course_sub_categories USING btree (created_by);

CREATE INDEX idx_course_sub_categories_updated_by ON public.course_sub_categories USING btree (updated_by);

CREATE INDEX idx_lesson_types_created_by ON public.lesson_types USING btree (created_by);

CREATE INDEX idx_lesson_types_updated_by ON public.lesson_types USING btree (updated_by);

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

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);

CREATE UNIQUE INDEX lesson_types_bg_color_key ON public.lesson_types USING btree (bg_color);

CREATE UNIQUE INDEX lesson_types_name_key ON public.lesson_types USING btree (name);

CREATE UNIQUE INDEX lesson_types_pkey ON public.lesson_types USING btree (id);

CREATE UNIQUE INDEX one_owner_per_organization ON public.organization_members USING btree (organization_id) WHERE (role = 'owner'::org_role);

CREATE INDEX organization_members_invited_by_idx ON public.organization_members USING btree (invited_by);

CREATE INDEX organization_members_organization_id_idx ON public.organization_members USING btree (organization_id);

CREATE UNIQUE INDEX organization_members_organization_id_user_id_key ON public.organization_members USING btree (organization_id, user_id);

CREATE UNIQUE INDEX organization_members_pkey ON public.organization_members USING btree (id);

CREATE INDEX organization_members_user_id_idx ON public.organization_members USING btree (user_id);

CREATE UNIQUE INDEX organizations_handle_key ON public.organizations USING btree (handle);

CREATE UNIQUE INDEX organizations_pkey ON public.organizations USING btree (id);

CREATE UNIQUE INDEX profiles_email_key ON public.profiles USING btree (email);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX profiles_username_key ON public.profiles USING btree (username);

CREATE UNIQUE INDEX role_permissions_pkey ON public.role_permissions USING btree (id);

CREATE UNIQUE INDEX role_permissions_role_permission_key ON public.role_permissions USING btree (role, permission);

CREATE UNIQUE INDEX tier_limits_pkey ON public.tier_limits USING btree (tier);

CREATE UNIQUE INDEX uniq_course_sub_categories_name_per_category ON public.course_sub_categories USING btree (category_id, name);

CREATE UNIQUE INDEX user_roles_pkey ON public.user_roles USING btree (id);

CREATE UNIQUE INDEX user_roles_user_id_role_key ON public.user_roles USING btree (user_id, role);

alter table "public"."course_categories" add constraint "course_categories_pkey" PRIMARY KEY using index "course_categories_pkey";

alter table "public"."course_sub_categories" add constraint "course_sub_categories_pkey" PRIMARY KEY using index "course_sub_categories_pkey";

alter table "public"."lesson_types" add constraint "lesson_types_pkey" PRIMARY KEY using index "lesson_types_pkey";

alter table "public"."organization_members" add constraint "organization_members_pkey" PRIMARY KEY using index "organization_members_pkey";

alter table "public"."organizations" add constraint "organizations_pkey" PRIMARY KEY using index "organizations_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."role_permissions" add constraint "role_permissions_pkey" PRIMARY KEY using index "role_permissions_pkey";

alter table "public"."tier_limits" add constraint "tier_limits_pkey" PRIMARY KEY using index "tier_limits_pkey";

alter table "public"."user_roles" add constraint "user_roles_pkey" PRIMARY KEY using index "user_roles_pkey";

alter table "public"."course_categories" add constraint "course_categories_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."course_categories" validate constraint "course_categories_created_by_fkey";

alter table "public"."course_categories" add constraint "course_categories_description_check" CHECK ((char_length(description) > 0)) not valid;

alter table "public"."course_categories" validate constraint "course_categories_description_check";

alter table "public"."course_categories" add constraint "course_categories_name_check" CHECK ((char_length(name) > 0)) not valid;

alter table "public"."course_categories" validate constraint "course_categories_name_check";

alter table "public"."course_categories" add constraint "course_categories_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."course_categories" validate constraint "course_categories_updated_by_fkey";

alter table "public"."course_sub_categories" add constraint "course_sub_categories_category_id_fkey" FOREIGN KEY (category_id) REFERENCES course_categories(id) ON DELETE CASCADE not valid;

alter table "public"."course_sub_categories" validate constraint "course_sub_categories_category_id_fkey";

alter table "public"."course_sub_categories" add constraint "course_sub_categories_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."course_sub_categories" validate constraint "course_sub_categories_created_by_fkey";

alter table "public"."course_sub_categories" add constraint "course_sub_categories_name_check" CHECK ((char_length(name) > 0)) not valid;

alter table "public"."course_sub_categories" validate constraint "course_sub_categories_name_check";

alter table "public"."course_sub_categories" add constraint "course_sub_categories_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."course_sub_categories" validate constraint "course_sub_categories_updated_by_fkey";

alter table "public"."lesson_types" add constraint "lesson_types_bg_color_key" UNIQUE using index "lesson_types_bg_color_key";

alter table "public"."lesson_types" add constraint "lesson_types_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."lesson_types" validate constraint "lesson_types_created_by_fkey";

alter table "public"."lesson_types" add constraint "lesson_types_name_key" UNIQUE using index "lesson_types_name_key";

alter table "public"."lesson_types" add constraint "lesson_types_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."lesson_types" validate constraint "lesson_types_updated_by_fkey";

alter table "public"."organization_members" add constraint "organization_members_invited_by_fkey" FOREIGN KEY (invited_by) REFERENCES auth.users(id) not valid;

alter table "public"."organization_members" validate constraint "organization_members_invited_by_fkey";

alter table "public"."organization_members" add constraint "organization_members_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE not valid;

alter table "public"."organization_members" validate constraint "organization_members_organization_id_fkey";

alter table "public"."organization_members" add constraint "organization_members_organization_id_user_id_key" UNIQUE using index "organization_members_organization_id_user_id_key";

alter table "public"."organization_members" add constraint "organization_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."organization_members" validate constraint "organization_members_user_id_fkey";

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

alter table "public"."role_permissions" add constraint "role_permissions_role_permission_key" UNIQUE using index "role_permissions_role_permission_key";

alter table "public"."user_roles" add constraint "user_roles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."user_roles" validate constraint "user_roles_user_id_fkey";

alter table "public"."user_roles" add constraint "user_roles_user_id_role_key" UNIQUE using index "user_roles_user_id_role_key";

set check_function_bodies = off;

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

CREATE OR REPLACE FUNCTION public.can_create_org_under_limit()
 RETURNS boolean
 LANGUAGE sql
 SET search_path TO ''
AS $function$
  select count(*) < 2
  from public.organizations
  where owned_by = (select auth.uid())
    and tier = 'launch';
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


create policy "delete: owner only"
on "public"."organizations"
as permissive
for delete
to authenticated
using ((owned_by = ( SELECT auth.uid() AS uid)));


create policy "insert: auth user as owner within tier limit"
on "public"."organizations"
as permissive
for insert
to authenticated
with check (((owned_by = ( SELECT auth.uid() AS uid)) AND ((tier <> 'launch'::subscription_tier) OR can_create_org_under_limit())));


create policy "select: public, owner, member, or student"
on "public"."organizations"
as permissive
for select
to public
using ((is_public OR (owned_by = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM organization_members m
  WHERE ((m.organization_id = organizations.id) AND (m.user_id = ( SELECT auth.uid() AS uid)))))));


create policy "update: owner or admin, transfer to admin only"
on "public"."organizations"
as permissive
for update
to authenticated
using (((owned_by = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM organization_members m
  WHERE ((m.organization_id = organizations.id) AND (m.user_id = ( SELECT auth.uid() AS uid)) AND (m.role = 'admin'::org_role))))))
with check (((owned_by = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM organization_members m
  WHERE ((m.organization_id = organizations.id) AND (m.user_id = organizations.owned_by) AND (m.role = 'admin'::org_role))))));


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
with check ((( SELECT auth.uid() AS uid) = id));


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


CREATE TRIGGER trg_course_categories_set_updated_at BEFORE UPDATE ON public.course_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_course_sub_categories_set_updated_at BEFORE UPDATE ON public.course_sub_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_lesson_types_set_updated_at BEFORE UPDATE ON public.lesson_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_insert_owner_into_organization_members AFTER INSERT ON public.organizations FOR EACH ROW EXECUTE FUNCTION add_or_update_owner_in_organization_members();

CREATE TRIGGER trg_organizations_set_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_owner_into_organization_members AFTER UPDATE ON public.organizations FOR EACH ROW WHEN ((old.owned_by IS DISTINCT FROM new.owned_by)) EXECUTE FUNCTION add_or_update_owner_in_organization_members();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


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



