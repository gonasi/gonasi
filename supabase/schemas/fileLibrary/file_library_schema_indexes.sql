-- =======================================
-- Table: public.file_library
-- Description: Stores uploaded files linked to a course within an organization.
-- =======================================

create table public.file_library (
  id uuid primary key default uuid_generate_v4(),  -- Unique file ID

  -- Foreign key relationships
  course_id uuid not null references public.courses(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid null references public.profiles(id) on delete set null,
  updated_by uuid null references public.profiles(id) on delete set null,

  -- File metadata
  name text not null,                              -- Display name
  path text not null,                              -- Path in storage (e.g., in S3 or Supabase Storage)
  size bigint not null,                            -- File size in bytes
  mime_type text not null,                         -- MIME type (e.g. "image/png")
  extension text not null,                         -- File extension (e.g. "png")
  file_type public.file_type not null default 'other', -- Enum for classification (image, audio, etc.)
  blur_preview text null,                          -- Optional blurred preview (base64-encoded)

  -- Audit timestamps
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  -- Constraints
  constraint unique_file_path_per_course unique (course_id, path),
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
-- Indexes (include organization_id for multitenancy)
-- =======================================

create index idx_file_library_org_course on public.file_library (organization_id, course_id);
create index idx_file_library_org_created_by on public.file_library (organization_id, created_by);
create index idx_file_library_org_updated_by on public.file_library (organization_id, updated_by);
create index idx_file_library_org_created_at_desc on public.file_library (organization_id, created_at desc);
create index idx_file_library_org_extension on public.file_library (organization_id, extension);
create index idx_file_library_org_file_type on public.file_library (organization_id, file_type);

-- =======================================
-- Triggers
-- =======================================

-- Automatically infer file_type and normalize extension before insert/update
create trigger trg_set_file_type
before insert or update on public.file_library
for each row
execute function public.set_file_type_from_extension();

-- Automatically update `updated_at` timestamp
create trigger trg_update_timestamp
before update on public.file_library
for each row
execute function public.update_updated_at_column();
