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
-- Function to check storage limits (updated to handle file updates)
-- =======================================
create or replace function public.check_storage_limit(
  p_organization_id uuid,
  p_new_file_size bigint,
  p_exclude_file_path text default null -- For updates, exclude the current file
) returns boolean
language plpgsql
security definer
as $$
declare
  v_current_usage bigint;
  v_storage_limit_mb integer;
  v_storage_limit_bytes bigint;
begin
  -- Get current storage usage for the organization (excluding the file being updated)
  select coalesce(sum(size), 0)
  into v_current_usage
  from public.file_library
  where organization_id = p_organization_id
    and (p_exclude_file_path is null or path != p_exclude_file_path);
  
  -- Get storage limit for the organization's tier
  select tl.storage_limit_mb_per_org
  into v_storage_limit_mb
  from public.organizations o
  join public.tier_limits tl on tl.tier = o.tier
  where o.id = p_organization_id;
  
  -- If no tier found, deny upload
  if v_storage_limit_mb is null then
    return false;
  end if;
  
  -- Convert MB to bytes
  v_storage_limit_bytes := v_storage_limit_mb * 1024 * 1024;
  
  -- Check if adding the new file would exceed the limit
  return (v_current_usage + p_new_file_size) <= v_storage_limit_bytes;
end;
$$;
