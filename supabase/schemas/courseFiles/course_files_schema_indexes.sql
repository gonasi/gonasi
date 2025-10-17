-- =====================================================================
-- enum: public.file_type
-- ---------------------------------------------------------------------
-- purpose:
--   represents high-level, logical classifications for uploaded files.
--   used by the app to determine handling logic (e.g., rendering type).
-- =====================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'file_type') then
    create type public.file_type as enum (
      'image',       -- image files (photos, graphics, etc.)
      'video',       -- video files (mp4, mov, etc.)
      'audio',       -- audio files (mp3, wav, etc.)
      'document',    -- documents (pdf, docx, etc.)
      'model3d',     -- 3d models or assets (glb, obj, etc.)
      'other'        -- uncategorized or unsupported types
    );
  end if;
end
$$;


-- =====================================================================
-- enum: public.resource_type
-- ---------------------------------------------------------------------
-- purpose:
--   represents cloudinary-style resource types that map to how
--   the provider classifies assets internally.
-- =====================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'resource_type') then
    create type public.resource_type as enum (
      'image',       -- image resource (e.g., png, jpg)
      'video',       -- video resource (e.g., mp4, mov)
      'audio',       -- audio resource (e.g., mp3, wav)
      'document',    -- document resource (e.g., pdf, docx)
      'model3d',     -- 3d model resource (e.g., glb, fbx)
      'raw'          -- generic or untyped resource
    );
  end if;
end
$$;


-- =====================================================================
-- table: public.course_files
-- ---------------------------------------------------------------------
-- purpose:
--   centralized metadata store for all course-related files
--   (images, videos, audio, documents, 3d models, etc.) managed
--   via cloudinary or a compatible provider.
-- =====================================================================

create table if not exists public.course_files (
  id uuid primary key default uuid_generate_v4(),            -- unique file identifier

  -- -------------------------------------------------------------------
  -- relational references
  -- -------------------------------------------------------------------
  course_id uuid null references public.courses(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid null references public.profiles(id) on delete set null,
  updated_by uuid null references public.profiles(id) on delete set null,

  -- -------------------------------------------------------------------
  -- core file metadata
  -- -------------------------------------------------------------------
  name text not null,                                        -- human-friendly display name
  public_id text not null,                                   -- cloudinary public_id or storage key
  format text not null,                                      -- file extension (e.g., 'mp4', 'png')
  resource_type public.resource_type not null default 'raw', -- cloud provider resource type
  mime_type text not null,                                   -- mime type (e.g., 'image/png')
  bytes bigint not null,                                     -- file size in bytes
  file_type public.file_type not null default 'other',       -- logical file classification
  url text not null,                                         -- secure delivery url
  metadata jsonb not null default '{}'::jsonb,               -- structured metadata (dimensions, duration, etc.)

  -- -------------------------------------------------------------------
  -- audit fields
  -- -------------------------------------------------------------------
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  -- -------------------------------------------------------------------
  -- constraints
  -- -------------------------------------------------------------------
  constraint unique_public_id_per_org unique (organization_id, public_id),

  constraint valid_file_format check (
    (
      file_type = 'image' and lower(format) in (
        -- common raster formats
        'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tif', 'tiff', 'heic', 'heif',
        -- raw and professional formats
        'raw', 'arw', 'cr2', 'cr3', 'nef', 'orf', 'rw2', 'dng',
        -- vector and other specialized image formats
        'svg', 'ico', 'icns', 'psd', 'ai', 'eps'
      )
    ) or (
      file_type = 'audio' and lower(format) in (
        -- common consumer formats
        'mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'aiff', 'aif', 'opus',
        -- less common / lossless / professional formats
        'alac', 'wma', 'amr', 'mid', 'midi', 'caf'
      )
    ) or (
      file_type = 'video' and lower(format) in (
        -- common streaming formats
        'mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv',
        -- modern and broadcast formats
        'm4v', '3gp', '3g2', 'mts', 'm2ts', 'ts', 'f4v', 'mxf'
      )
    ) or (
      file_type = 'model3d' and lower(format) in (
        -- common interchange formats
        'gltf', 'glb', 'obj', 'fbx', 'stl', 'dae', '3ds', 'usdz',
        -- specialized and cad formats
        'blend', 'ply', 'x3d', 'wrl', 'iges', 'igs', 'step', 'stp'
      )
    ) or (
      file_type = 'document' and lower(format) in (
        -- office formats
        'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
        -- text and structured data
        'txt', 'csv', 'tsv', 'md', 'rtf', 'json', 'xml', 'yaml', 'yml',
        -- ebooks and archives
        'epub', 'mobi', 'odt', 'ods', 'odp', 'pages', 'numbers', 'key'
      )
    ) or (
      file_type = 'other'
    )
  )
);


-- =====================================================================
-- indexes
-- ---------------------------------------------------------------------
-- purpose:
--   improve query performance for foreign key lookups,
--   multitenant filtering, and metadata queries.
-- =====================================================================

-- core foreign key indexes
create index if not exists idx_course_files_org on public.course_files (organization_id);
create index if not exists idx_course_files_course on public.course_files (course_id);
create index if not exists idx_course_files_created_by on public.course_files (created_by);
create index if not exists idx_course_files_updated_by on public.course_files (updated_by);

-- multitenancy + audit indexes
create index if not exists idx_course_files_org_created_by on public.course_files (organization_id, created_by);
create index if not exists idx_course_files_org_updated_by on public.course_files (organization_id, updated_by);
create index if not exists idx_course_files_org_course on public.course_files (organization_id, course_id);
create index if not exists idx_course_files_org_created_at_desc on public.course_files (organization_id, created_at desc);

-- filtering / querying
create index if not exists idx_course_files_org_format on public.course_files (organization_id, format);
create index if not exists idx_course_files_org_file_type on public.course_files (organization_id, file_type);
create index if not exists idx_course_files_org_resource_type on public.course_files (organization_id, resource_type);
create index if not exists idx_course_files_metadata_gin on public.course_files using gin (metadata jsonb_path_ops);


-- =====================================================================
-- triggers
-- ---------------------------------------------------------------------
-- purpose:
--   enforce consistency and automate timestamp updates.
-- =====================================================================

-- normalize format + infer file_type before insert/update
create trigger trg_set_file_type
before insert or update on public.course_files
for each row
execute function public.set_file_type_from_extension();

-- automatically update updated_at on modification
create trigger trg_update_timestamp
before update on public.course_files
for each row
execute function public.update_updated_at_column();
