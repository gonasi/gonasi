alter table "public"."course_files" add column "access_mode" text not null default 'public'::text;

alter table "public"."course_files" alter column "url" drop not null;

alter table "public"."course_files" add constraint "course_files_access_mode_check" CHECK ((access_mode = ANY (ARRAY['public'::text, 'authenticated'::text]))) not valid;

alter table "public"."course_files" validate constraint "course_files_access_mode_check";


