-- =======================================
-- enum types
-- =======================================

-- file type classification enum
create type public.file_type as enum (
  'image',
  'audio',
  'video',
  'model3d',
  'document',
  'other'
);


-- =======================================
-- file type determination function
-- =======================================

-- determines file type from extension
create or replace function public.determine_file_type(extension text)
returns public.file_type
language plpgsql
immutable
security definer
set search_path = ''
as $$
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
$$;


-- =======================================
-- file type + extension trigger function
-- =======================================

create or replace function public.set_file_type_from_extension()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
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
$$;


-- =======================================
-- table: public.file_library
-- =======================================

create table public.file_library (
  id uuid primary key default uuid_generate_v4(),  -- unique file id

  -- foreign key relationships
  course_id uuid not null references public.courses(id) on delete cascade,

  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete set null,

  -- file metadata
  name text not null,
  path text not null,
  size bigint not null,
  mime_type text not null,
  extension text not null,
  file_type public.file_type not null default 'other',
  blur_preview text null,

  -- audit timestamps
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  constraint unique_file_path_per_course unique (course_id, path),

  -- validate extension is compatible with file_type
  constraint valid_file_extension check (
    (file_type = 'image' and lower(extension) in ('jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tif', 'tiff', 'heic')) or
    (file_type = 'audio' and lower(extension) in ('mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'aiff', 'aif')) or
    (file_type = 'video' and lower(extension) in ('mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv')) or
    (file_type = 'model3d' and lower(extension) in ('gltf', 'glb', 'obj', 'fbx', 'stl', 'dae', '3ds', 'usdz')) or
    (file_type = 'document' and lower(extension) in ('pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt')) or
    (file_type = 'other')
  )
);


-- =======================================
-- indexes
-- =======================================

create index idx_file_library_course_id on public.file_library (course_id);
create index idx_file_library_created_by on public.file_library (created_by);
create index idx_file_library_updated_by on public.file_library (updated_by);
create index idx_file_library_created_at_desc on public.file_library (created_at desc);
create index idx_file_library_extension on public.file_library (extension);
create index idx_file_library_file_type on public.file_library (file_type);

-- =======================================
-- comments
-- =======================================

comment on table public.file_library is 'stores metadata of uploaded files associated with a lesson.';
comment on column public.file_library.id is 'unique identifier for the file record.';
comment on column public.file_library.created_by is 'user who uploaded the file.';
comment on column public.file_library.updated_by is 'user who last modified the file metadata.';
comment on column public.file_library.path is 'storage path to the actual file.';
comment on column public.file_library.size is 'file size in bytes.';
comment on column public.file_library.mime_type is 'mime type of the file.';
comment on column public.file_library.extension is 'file extension (without the dot).';
comment on column public.file_library.file_type is 'categorization of file (image, audio, video, model3d, document, other).';


-- =======================================
-- triggers
-- =======================================

-- auto-set file_type and extension before insert/update
create trigger set_file_type_before_insert_update
before insert or update on public.file_library
for each row
execute function public.set_file_type_from_extension();

-- update updated_at on change
create trigger set_updated_at_on_file_library
before update on public.file_library
for each row
execute function public.update_updated_at_column();


-- =======================================
-- rls: row-level security
-- =======================================

alter table public.file_library enable row level security;

-- only creator can insert
create policy file_library_insert_owner_only
  on public.file_library
  for insert
  with check ((select auth.uid()) = created_by);

-- only creator can update
create policy file_library_update_owner_only
  on public.file_library
  for update
  using ((select auth.uid()) = created_by);

-- allow all users (including anon) to read
create policy file_library_read_all
  on public.file_library
  for select
  to authenticated, anon
  using (true);

-- only creator can delete
create policy file_library_delete_owner_only
  on public.file_library
  for delete
  using ((select auth.uid()) = created_by);


-- =======================================
-- supabase storage bucket setup
-- =======================================

-- ensure bucket exists
insert into storage.buckets (id, name)
values ('files', 'files')
on conflict (id) do nothing;

-- bucket policies
create policy "allow files bucket update access"
  on storage.objects for update
  using ((select auth.uid()) = owner_id::uuid)
  with check (bucket_id = 'files');

create policy "allow files bucket insert access"
  on storage.objects for insert
  with check ((select auth.uid()) = owner_id::uuid and bucket_id = 'files');

create policy "allow files bucket select access"
  on storage.objects for select
  using (auth.role() = 'authenticated' and bucket_id = 'files');

create policy "allow files bucket delete access"
  on storage.objects for delete
  using ((select auth.uid()) = owner_id::uuid and bucket_id = 'files');