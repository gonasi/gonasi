alter table "public"."file_library" add column "settings" jsonb;

alter table "public"."published_file_library" add column "settings" jsonb;

CREATE INDEX idx_file_library_settings ON public.file_library USING gin (settings);

CREATE INDEX idx_published_file_library_settings ON public.published_file_library USING gin (settings);


