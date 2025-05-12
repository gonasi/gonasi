-- =======================================
-- Extensions
-- =======================================
-- Enable the pg_trgm extension for text search capabilities
CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- Enable uuid-ossp for uuid generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =======================================
-- Types and Enums
-- =======================================
-- Create an enum for file types
CREATE TYPE public.file_type AS ENUM (
  'image',
  'audio',
  'video',
  'model3d',
  'document',
  'other'
);

-- =======================================
-- File Type Helper Function
-- =======================================
CREATE OR REPLACE FUNCTION public.determine_file_type(extension TEXT)
RETURNS public.file_type AS $$
BEGIN
  RETURN CASE
    WHEN extension IN ('jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tif', 'tiff', 'heic') THEN 'image'::public.file_type
    WHEN extension IN ('mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'aiff', 'aif') THEN 'audio'::public.file_type
    WHEN extension IN ('mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv') THEN 'video'::public.file_type
    WHEN extension IN ('gltf', 'glb', 'obj', 'fbx', 'stl', 'dae', '3ds', 'usdz') THEN 'model3d'::public.file_type
    WHEN extension IN ('pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt') THEN 'document'::public.file_type
    ELSE 'other'::public.file_type
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =======================================
-- Table: file_library
-- =======================================
CREATE TABLE public.file_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign keys
  company_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  updated_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,

  -- File metadata
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  extension TEXT NOT NULL,
  file_type public.file_type NOT NULL DEFAULT 'other',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Added constraint for unique path per company
  CONSTRAINT unique_file_path_per_company UNIQUE (company_id, path)
);

-- Add CHECK constraint for valid extensions (separate from table creation for clarity)
ALTER TABLE public.file_library ADD CONSTRAINT valid_file_extension CHECK (
  (file_type = 'image' AND LOWER(extension) IN ('jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tif', 'tiff', 'heic')) OR
  (file_type = 'audio' AND LOWER(extension) IN ('mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'aiff', 'aif')) OR
  (file_type = 'video' AND LOWER(extension) IN ('mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv')) OR
  (file_type = 'model3d' AND LOWER(extension) IN ('gltf', 'glb', 'obj', 'fbx', 'stl', 'dae', '3ds', 'usdz')) OR
  (file_type = 'document' AND LOWER(extension) IN ('pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt')) OR
  (file_type = 'other')
);

-- Add table and column comments
COMMENT ON TABLE public.file_library IS 'Stores metadata of uploaded files associated with a company.';
COMMENT ON COLUMN public.file_library.id IS 'Unique identifier for the file record';
COMMENT ON COLUMN public.file_library.company_id IS 'Reference to the company that owns this file';
COMMENT ON COLUMN public.file_library.created_by IS 'User who uploaded the file';
COMMENT ON COLUMN public.file_library.updated_by IS 'User who last modified the file metadata';
COMMENT ON COLUMN public.file_library.path IS 'Storage path to the actual file';
COMMENT ON COLUMN public.file_library.size IS 'File size in bytes';
COMMENT ON COLUMN public.file_library.mime_type IS 'MIME type of the file';
COMMENT ON COLUMN public.file_library.extension IS 'File extension (without the dot)';
COMMENT ON COLUMN public.file_library.file_type IS 'Categorization of file (image, audio, video, model3d, document, other)';

-- =======================================
-- Trigger for file_type
-- =======================================
CREATE OR REPLACE FUNCTION public.set_file_type_from_extension()
RETURNS TRIGGER AS $$
BEGIN
  -- Extract extension from filename if not provided
  IF NEW.extension IS NULL OR NEW.extension = '' THEN
    NEW.extension = LOWER(SUBSTRING(NEW.name FROM '\.([^\.]+)$'));
    -- If still NULL, set to empty string to avoid null constraint violation
    IF NEW.extension IS NULL THEN
      NEW.extension = '';
    END IF;
  END IF;
  
  -- Always ensure extension is lowercase
  NEW.extension = LOWER(NEW.extension);
  
  -- Set file type based on extension
  NEW.file_type = public.determine_file_type(NEW.extension);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to apply the file type function before insert or update
CREATE TRIGGER set_file_type_before_insert_update
BEFORE INSERT OR UPDATE ON public.file_library
FOR EACH ROW
EXECUTE FUNCTION public.set_file_type_from_extension();

-- =======================================
-- Trigger for updated_at
-- =======================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update the updated_at column on file_library
CREATE TRIGGER set_updated_at_on_file_library
BEFORE UPDATE ON public.file_library
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =======================================
-- Indexes
-- =======================================
CREATE INDEX idx_file_library_company_id ON public.file_library (company_id);
CREATE INDEX idx_file_library_created_by ON public.file_library (created_by);
CREATE INDEX idx_file_library_created_at ON public.file_library (created_at DESC);
CREATE INDEX idx_file_library_extension ON public.file_library (extension);
CREATE INDEX idx_file_library_name_trgm ON public.file_library USING gin (name gin_trgm_ops);
CREATE INDEX idx_file_library_file_type ON public.file_library (file_type);
CREATE INDEX idx_file_library_company_type ON public.file_library (company_id, file_type);

-- =======================================
-- RLS Policies
-- =======================================
-- Enable Row-Level Security
ALTER TABLE public.file_library ENABLE ROW LEVEL SECURITY;

-- =======================================
-- RLS Policies for file_library
-- =======================================
-- secure the table
alter table public.file_library enable row level security;

-- define row-level security policies for files
create policy "Allow file library insert access" on public.file_library 
  for insert with check ( auth.uid() = created_by );

create policy "Allow file library update access" on public.file_library 
  for update using ( auth.uid() = created_by );

create policy "Allow file library select access" on public.file_library 
  for select using ( auth.role() = 'authenticated' ); 

create policy "Allow file library delete access" on public.file_library 
  for delete using ( auth.uid() = created_by );

-- set up a storage bucket for files
insert into storage.buckets (id, name) values ('files', 'files');

-- define row-level security policies for files bucket
create policy "Allow files bucket update access" on storage.objects
  for update using ((select auth.uid()) = owner_id::uuid ) with check (bucket_id = 'files'); 

create policy "Allow files bucket insert access" on storage.objects
  for insert with check ((select auth.uid()) = owner_id::uuid and bucket_id = 'files');

create policy "Allow files bucket select access" on storage.objects
  for select using (auth.role() = 'authenticated'  and bucket_id = 'files');

create policy "Allow files bucket delete access" on storage.objects
  for delete using ((select auth.uid()) = owner_id::uuid  and bucket_id = 'files');