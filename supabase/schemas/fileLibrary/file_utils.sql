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


