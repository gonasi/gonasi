revoke delete on table "public"."user_roles" from "anon";

revoke insert on table "public"."user_roles" from "anon";

revoke references on table "public"."user_roles" from "anon";

revoke select on table "public"."user_roles" from "anon";

revoke trigger on table "public"."user_roles" from "anon";

revoke truncate on table "public"."user_roles" from "anon";

revoke update on table "public"."user_roles" from "anon";

revoke delete on table "public"."user_roles" from "authenticated";

revoke insert on table "public"."user_roles" from "authenticated";

revoke references on table "public"."user_roles" from "authenticated";

revoke select on table "public"."user_roles" from "authenticated";

revoke trigger on table "public"."user_roles" from "authenticated";

revoke truncate on table "public"."user_roles" from "authenticated";

revoke update on table "public"."user_roles" from "authenticated";

create table "public"."published_courses" (
    "id" uuid not null default gen_random_uuid(),
    "course_id" uuid not null,
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
    "course_chapters" jsonb,
    "lessons_with_blocks" jsonb,
    "created_by" uuid not null,
    "updated_by" uuid not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


CREATE INDEX idx_published_courses_category_id ON public.published_courses USING btree (course_category_id);

CREATE INDEX idx_published_courses_course_id ON public.published_courses USING btree (course_id);

CREATE INDEX idx_published_courses_pathway_id ON public.published_courses USING btree (pathway_id);

CREATE INDEX idx_published_courses_published_at ON public.published_courses USING btree (published_at);

CREATE INDEX idx_published_courses_sub_category_id ON public.published_courses USING btree (course_sub_category_id);

CREATE UNIQUE INDEX published_courses_pkey ON public.published_courses USING btree (id);

alter table "public"."published_courses" add constraint "published_courses_pkey" PRIMARY KEY using index "published_courses_pkey";

alter table "public"."published_courses" add constraint "published_courses_course_category_id_fkey" FOREIGN KEY (course_category_id) REFERENCES course_categories(id) ON DELETE RESTRICT not valid;

alter table "public"."published_courses" validate constraint "published_courses_course_category_id_fkey";

alter table "public"."published_courses" add constraint "published_courses_course_id_fkey" FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE not valid;

alter table "public"."published_courses" validate constraint "published_courses_course_id_fkey";

alter table "public"."published_courses" add constraint "published_courses_course_sub_category_id_fkey" FOREIGN KEY (course_sub_category_id) REFERENCES course_categories(id) ON DELETE RESTRICT not valid;

alter table "public"."published_courses" validate constraint "published_courses_course_sub_category_id_fkey";

alter table "public"."published_courses" add constraint "published_courses_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT not valid;

alter table "public"."published_courses" validate constraint "published_courses_created_by_fkey";

alter table "public"."published_courses" add constraint "published_courses_pathway_id_fkey" FOREIGN KEY (pathway_id) REFERENCES pathways(id) ON DELETE RESTRICT not valid;

alter table "public"."published_courses" validate constraint "published_courses_pathway_id_fkey";

alter table "public"."published_courses" add constraint "published_courses_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE RESTRICT not valid;

alter table "public"."published_courses" validate constraint "published_courses_updated_by_fkey";

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


