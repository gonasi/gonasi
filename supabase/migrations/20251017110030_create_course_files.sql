create type "public"."resource_type" as enum ('image', 'video', 'audio', 'document', 'model3d', 'raw');

revoke update on table "public"."profiles" from "authenticated";

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

create table "public"."course_files" (
    "id" uuid not null default uuid_generate_v4(),
    "course_id" uuid,
    "organization_id" uuid not null,
    "created_by" uuid,
    "updated_by" uuid,
    "name" text not null,
    "public_id" text not null,
    "format" text not null,
    "resource_type" resource_type not null default 'raw'::resource_type,
    "mime_type" text not null,
    "bytes" bigint not null,
    "file_type" file_type not null default 'other'::file_type,
    "url" text not null,
    "metadata" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."course_files" enable row level security;

CREATE UNIQUE INDEX course_files_pkey ON public.course_files USING btree (id);

CREATE INDEX idx_course_files_course ON public.course_files USING btree (course_id);

CREATE INDEX idx_course_files_created_by ON public.course_files USING btree (created_by);

CREATE INDEX idx_course_files_metadata_gin ON public.course_files USING gin (metadata jsonb_path_ops);

CREATE INDEX idx_course_files_org ON public.course_files USING btree (organization_id);

CREATE INDEX idx_course_files_org_course ON public.course_files USING btree (organization_id, course_id);

CREATE INDEX idx_course_files_org_created_at_desc ON public.course_files USING btree (organization_id, created_at DESC);

CREATE INDEX idx_course_files_org_created_by ON public.course_files USING btree (organization_id, created_by);

CREATE INDEX idx_course_files_org_file_type ON public.course_files USING btree (organization_id, file_type);

CREATE INDEX idx_course_files_org_format ON public.course_files USING btree (organization_id, format);

CREATE INDEX idx_course_files_org_resource_type ON public.course_files USING btree (organization_id, resource_type);

CREATE INDEX idx_course_files_org_updated_by ON public.course_files USING btree (organization_id, updated_by);

CREATE INDEX idx_course_files_updated_by ON public.course_files USING btree (updated_by);

CREATE UNIQUE INDEX unique_public_id_per_org ON public.course_files USING btree (organization_id, public_id);

alter table "public"."course_files" add constraint "course_files_pkey" PRIMARY KEY using index "course_files_pkey";

alter table "public"."course_files" add constraint "course_files_course_id_fkey" FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE not valid;

alter table "public"."course_files" validate constraint "course_files_course_id_fkey";

alter table "public"."course_files" add constraint "course_files_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."course_files" validate constraint "course_files_created_by_fkey";

alter table "public"."course_files" add constraint "course_files_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE not valid;

alter table "public"."course_files" validate constraint "course_files_organization_id_fkey";

alter table "public"."course_files" add constraint "course_files_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."course_files" validate constraint "course_files_updated_by_fkey";

alter table "public"."course_files" add constraint "unique_public_id_per_org" UNIQUE using index "unique_public_id_per_org";

alter table "public"."course_files" add constraint "valid_file_format" CHECK ((((file_type = 'image'::file_type) AND (lower(format) = ANY (ARRAY['jpg'::text, 'jpeg'::text, 'png'::text, 'gif'::text, 'webp'::text, 'bmp'::text, 'tif'::text, 'tiff'::text, 'heic'::text, 'heif'::text, 'raw'::text, 'arw'::text, 'cr2'::text, 'cr3'::text, 'nef'::text, 'orf'::text, 'rw2'::text, 'dng'::text, 'svg'::text, 'ico'::text, 'icns'::text, 'psd'::text, 'ai'::text, 'eps'::text]))) OR ((file_type = 'audio'::file_type) AND (lower(format) = ANY (ARRAY['mp3'::text, 'wav'::text, 'aac'::text, 'flac'::text, 'ogg'::text, 'm4a'::text, 'aiff'::text, 'aif'::text, 'opus'::text, 'alac'::text, 'wma'::text, 'amr'::text, 'mid'::text, 'midi'::text, 'caf'::text]))) OR ((file_type = 'video'::file_type) AND (lower(format) = ANY (ARRAY['mp4'::text, 'webm'::text, 'mov'::text, 'avi'::text, 'mkv'::text, 'flv'::text, 'wmv'::text, 'm4v'::text, '3gp'::text, '3g2'::text, 'mts'::text, 'm2ts'::text, 'ts'::text, 'f4v'::text, 'mxf'::text]))) OR ((file_type = 'model3d'::file_type) AND (lower(format) = ANY (ARRAY['gltf'::text, 'glb'::text, 'obj'::text, 'fbx'::text, 'stl'::text, 'dae'::text, '3ds'::text, 'usdz'::text, 'blend'::text, 'ply'::text, 'x3d'::text, 'wrl'::text, 'iges'::text, 'igs'::text, 'step'::text, 'stp'::text]))) OR ((file_type = 'document'::file_type) AND (lower(format) = ANY (ARRAY['pdf'::text, 'doc'::text, 'docx'::text, 'xls'::text, 'xlsx'::text, 'ppt'::text, 'pptx'::text, 'txt'::text, 'csv'::text, 'tsv'::text, 'md'::text, 'rtf'::text, 'json'::text, 'xml'::text, 'yaml'::text, 'yml'::text, 'epub'::text, 'mobi'::text, 'odt'::text, 'ods'::text, 'odp'::text, 'pages'::text, 'numbers'::text, 'key'::text]))) OR (file_type = 'other'::file_type))) not valid;

alter table "public"."course_files" validate constraint "valid_file_format";

grant delete on table "public"."course_files" to "anon";

grant insert on table "public"."course_files" to "anon";

grant references on table "public"."course_files" to "anon";

grant select on table "public"."course_files" to "anon";

grant trigger on table "public"."course_files" to "anon";

grant truncate on table "public"."course_files" to "anon";

grant update on table "public"."course_files" to "anon";

grant delete on table "public"."course_files" to "authenticated";

grant insert on table "public"."course_files" to "authenticated";

grant references on table "public"."course_files" to "authenticated";

grant select on table "public"."course_files" to "authenticated";

grant trigger on table "public"."course_files" to "authenticated";

grant truncate on table "public"."course_files" to "authenticated";

grant update on table "public"."course_files" to "authenticated";

grant delete on table "public"."course_files" to "service_role";

grant insert on table "public"."course_files" to "service_role";

grant references on table "public"."course_files" to "service_role";

grant select on table "public"."course_files" to "service_role";

grant trigger on table "public"."course_files" to "service_role";

grant truncate on table "public"."course_files" to "service_role";

grant update on table "public"."course_files" to "service_role";

create policy "delete_by_org_admin_or_course_editor"
on "public"."course_files"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = course_files.course_id) AND ((get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text])) OR ((get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = 'editor'::text) AND (c.created_by = ( SELECT auth.uid() AS uid))))))));


create policy "insert_by_org_admin_or_course_editor"
on "public"."course_files"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = course_files.course_id) AND ((get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text])) OR ((get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = 'editor'::text) AND (c.created_by = ( SELECT auth.uid() AS uid))))))));


create policy "select_org_members"
on "public"."course_files"
as permissive
for select
to authenticated
using ((get_user_org_role(organization_id, ( SELECT auth.uid() AS uid)) IS NOT NULL));


create policy "update_by_org_admin_or_course_editor"
on "public"."course_files"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = course_files.course_id) AND ((get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text])) OR ((get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = 'editor'::text) AND (c.created_by = ( SELECT auth.uid() AS uid))))))))
with check ((EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = course_files.course_id) AND ((get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = ANY (ARRAY['owner'::text, 'admin'::text])) OR ((get_user_org_role(c.organization_id, ( SELECT auth.uid() AS uid)) = 'editor'::text) AND (c.created_by = ( SELECT auth.uid() AS uid))))))));


CREATE TRIGGER trg_set_file_type BEFORE INSERT OR UPDATE ON public.course_files FOR EACH ROW EXECUTE FUNCTION set_file_type_from_extension();

CREATE TRIGGER trg_update_timestamp BEFORE UPDATE ON public.course_files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


