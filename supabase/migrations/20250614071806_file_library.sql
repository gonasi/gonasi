-- =======================================
-- EXTENSIONS
-- =======================================

-- Enable pg_trgm extension for GIN trigram indexing (text search)
create extension if not exists pg_trgm;

-- Enable uuid-ossp extension for UUID generation
create extension if not exists "uuid-ossp";


-- =======================================
-- ENUM TYPES
-- =======================================

-- File type classification enum
create type public.file_type as enum (
  'image',
  'audio',
  'video',
  'model3d',
  'document',
  'other'
);


-- =======================================
-- FILE TYPE DETERMINATION FUNCTION
-- =======================================

-- Determines file type from extension
create or replace function public.determine_file_type(extension text)
returns public.file_type as $$
begin
  return case
    when extension in ('jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tif', 'tiff', 'heic') then 'image'
    when extension in ('mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'aiff', 'aif') then 'audio'
    when extension in ('mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv') then 'video'
    when extension in ('gltf', 'glb', 'obj', 'fbx', 'stl', 'dae', '3ds', 'usdz') then 'model3d'
    when extension in ('pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt') then 'document'
    else 'other'
  end;
end;
$$ language plpgsql immutable;


-- =======================================
-- TABLE: file_library
-- =======================================

create table public.file_library (
  id uuid primary key default uuid_generate_v4(),

  -- Foreign key: related lesson
  course_id uuid not null references public.courses(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,

  -- Audit fields
  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete set null,

  -- File metadata
  name text not null,               -- original file name
  path text not null,               -- storage path (e.g., S3 or local)
  size bigint not null,            -- size in bytes
  mime_type text not null,         -- e.g. image/png, application/pdf
  extension text not null,         -- file extension (without dot)
  file_type public.file_type not null default 'other',

  -- Timestamps
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  -- Constraints
  constraint unique_file_path_per_lesson unique (lesson_id, path)
);

-- Add extension validation check constraint
alter table public.file_library add constraint valid_file_extension check (
  (file_type = 'image' and lower(extension) in ('jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tif', 'tiff', 'heic')) or
  (file_type = 'audio' and lower(extension) in ('mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'aiff', 'aif')) or
  (file_type = 'video' and lower(extension) in ('mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv')) or
  (file_type = 'model3d' and lower(extension) in ('gltf', 'glb', 'obj', 'fbx', 'stl', 'dae', '3ds', 'usdz')) or
  (file_type = 'document' and lower(extension) in ('pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt')) or
  (file_type = 'other')
);

-- =======================================
-- COMMENTS
-- =======================================

comment on table public.file_library is 'Stores metadata of uploaded files associated with a lesson.';
comment on column public.file_library.id is 'Unique identifier for the file record.';
comment on column public.file_library.created_by is 'User who uploaded the file.';
comment on column public.file_library.updated_by is 'User who last modified the file metadata.';
comment on column public.file_library.path is 'Storage path to the actual file.';
comment on column public.file_library.size is 'File size in bytes.';
comment on column public.file_library.mime_type is 'MIME type of the file.';
comment on column public.file_library.extension is 'File extension (without the dot).';
comment on column public.file_library.file_type is 'Categorization of file (image, audio, video, model3d, document, other).';


-- =======================================
-- TRIGGER FUNCTION: auto set file_type and extension
-- =======================================

create or replace function public.set_file_type_from_extension()
returns trigger as $$
begin
  -- Attempt to extract extension from file name if not explicitly provided
  if new.extension is null or new.extension = '' then
    new.extension := lower(substring(new.name from '\.([^\.]+)$'));
    if new.extension is null then
      new.extension := '';
    end if;
  end if;

  -- Normalize extension to lowercase
  new.extension := lower(new.extension);

  -- Determine file type based on extension
  new.file_type := public.determine_file_type(new.extension);

  return new;
end;
$$ language plpgsql;


-- =======================================
-- TRIGGERS
-- =======================================

-- Automatically set file_type and extension before insert/update
create trigger set_file_type_before_insert_update
before insert or update on public.file_library
for each row
execute function public.set_file_type_from_extension();

-- Automatically update updated_at column
create trigger set_updated_at_on_file_library
before update on public.file_library
for each row
execute function public.update_updated_at_column();


-- =======================================
-- INDEXES
-- =======================================

-- Index for file creator
create index idx_file_library_created_by on public.file_library (created_by);

-- Index for creation time (descending for recent-first sorting)
create index idx_file_library_created_at on public.file_library (created_at desc);

-- Index for file extension
create index idx_file_library_extension on public.file_library (extension);

-- GIN index for fast text search on file name
create index idx_file_library_name_trgm on public.file_library using gin (name gin_trgm_ops);

-- Index for filtering by file_type
create index idx_file_library_file_type on public.file_library (file_type);


-- =======================================
-- RLS: Row-Level Security
-- =======================================

-- Enable row-level security on the file_library table
alter table public.file_library enable row level security;

-- define row-level security policies for files
-- =======================================
-- RLS POLICIES: file_library
-- =======================================

-- Allow insert if the user is the creator
create policy file_library_insert_owner_only
  on public.file_library
  for insert
  with check ((select auth.uid()) = created_by);

-- Allow update only by the creator
create policy file_library_update_owner_only
  on public.file_library
  for update
  using ((select auth.uid()) = created_by);

-- Allow read access to all authenticated and anonymous users
create policy file_library_read_all
  on public.file_library
  for select
  to authenticated, anon
  using (true);

-- Allow delete only by the creator
create policy file_library_delete_owner_only
  on public.file_library
  for delete
  using ((select auth.uid()) = created_by);


-- =======================================
-- STORAGE BUCKET SETUP (SUPABASE)
-- =======================================

-- Ensure a storage bucket exists
insert into storage.buckets (id, name) values ('files', 'files')
on conflict (id) do nothing;

-- RLS policies for bucket access
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
