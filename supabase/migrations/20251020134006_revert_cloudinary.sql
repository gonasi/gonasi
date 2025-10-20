drop trigger if exists "trg_set_format_type" on "public"."course_files";

drop trigger if exists "trg_update_timestamp" on "public"."course_files";

drop policy "delete_by_org_admin_or_course_editor" on "public"."course_files";

drop policy "insert_by_org_admin_or_course_editor" on "public"."course_files";

drop policy "select_org_members" on "public"."course_files";

drop policy "update_by_org_admin_or_course_editor" on "public"."course_files";

revoke delete on table "public"."course_files" from "anon";

revoke insert on table "public"."course_files" from "anon";

revoke references on table "public"."course_files" from "anon";

revoke select on table "public"."course_files" from "anon";

revoke trigger on table "public"."course_files" from "anon";

revoke truncate on table "public"."course_files" from "anon";

revoke update on table "public"."course_files" from "anon";

revoke delete on table "public"."course_files" from "authenticated";

revoke insert on table "public"."course_files" from "authenticated";

revoke references on table "public"."course_files" from "authenticated";

revoke select on table "public"."course_files" from "authenticated";

revoke trigger on table "public"."course_files" from "authenticated";

revoke truncate on table "public"."course_files" from "authenticated";

revoke update on table "public"."course_files" from "authenticated";

revoke delete on table "public"."course_files" from "service_role";

revoke insert on table "public"."course_files" from "service_role";

revoke references on table "public"."course_files" from "service_role";

revoke select on table "public"."course_files" from "service_role";

revoke trigger on table "public"."course_files" from "service_role";

revoke truncate on table "public"."course_files" from "service_role";

revoke update on table "public"."course_files" from "service_role";

alter table "public"."course_files" drop constraint "course_files_access_mode_check";

alter table "public"."course_files" drop constraint "course_files_course_id_fkey";

alter table "public"."course_files" drop constraint "course_files_created_by_fkey";

alter table "public"."course_files" drop constraint "course_files_organization_id_fkey";

alter table "public"."course_files" drop constraint "course_files_updated_by_fkey";

alter table "public"."course_files" drop constraint "unique_public_id_per_org";

alter table "public"."course_files" drop constraint "valid_file_format";

drop function if exists "public"."set_format_type_from_extension"();

alter table "public"."course_files" drop constraint "course_files_pkey";

drop index if exists "public"."course_files_pkey";

drop index if exists "public"."idx_course_files_course";

drop index if exists "public"."idx_course_files_created_by";

drop index if exists "public"."idx_course_files_metadata_gin";

drop index if exists "public"."idx_course_files_org";

drop index if exists "public"."idx_course_files_org_course";

drop index if exists "public"."idx_course_files_org_created_at_desc";

drop index if exists "public"."idx_course_files_org_created_by";

drop index if exists "public"."idx_course_files_org_file_type";

drop index if exists "public"."idx_course_files_org_format";

drop index if exists "public"."idx_course_files_org_resource_type";

drop index if exists "public"."idx_course_files_org_updated_by";

drop index if exists "public"."idx_course_files_updated_by";

drop index if exists "public"."unique_public_id_per_org";

drop table "public"."course_files";

drop type "public"."resource_type";


