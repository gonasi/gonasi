-- ===========================================================
-- FUNCTION: public.check_storage_limit_for_org
-- -----------------------------------------------------------
-- Purpose:
--   Determines whether an organization can upload a file of a 
--   specified size without exceeding its storage quota. 
--   Returns a structured JSON object with:
--     - success (boolean): whether the upload is allowed
--     - message (string): human-readable explanation
--     - data (jsonb): additional details including file size and remaining quota
--
-- Behavior:
--   - Calculates total storage usage from:
--       1. file_library
--       2. published_file_library
--   - Supports excluding an existing file (when updating an existing file)
--   - Fetches storage limit based on the organization's active subscription tier
--   - Ensures invalid input (null or non-positive file sizes) is rejected
-- ===========================================================
create or replace function public.check_storage_limit_for_org(
  p_org_id uuid,               -- UUID of the organization
  p_new_file_size bigint,      -- Size of the file to be uploaded, in bytes
  p_exclude_file_id uuid default null  -- Optional: ID of an existing file to exclude from usage calculation (for updates)
)
returns jsonb
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  v_current_usage bigint;      -- Current total storage usage in bytes
  v_storage_limit_mb integer;  -- Storage limit in megabytes
  v_storage_limit_bytes bigint;-- Storage limit converted to bytes
  v_limits json;               -- Tier limits JSON object
  v_remaining_bytes bigint;    -- Remaining storage in bytes
begin
  -------------------------------------------------------------------
  -- 0. Validate file size
  -------------------------------------------------------------------
  if p_new_file_size is null or p_new_file_size <= 0 then
    return jsonb_build_object(
      'success', false,
      'message', 'Invalid file size provided.',
      'data', jsonb_build_object(
        'file_size', p_new_file_size,
        'remaining_bytes', null
      )
    );
  end if;

  -------------------------------------------------------------------
  -- 1. Fetch organization's tier limits
  -------------------------------------------------------------------
  select public.get_tier_limits_for_org(p_org_id)
  into v_limits;

  if v_limits is null then
    return jsonb_build_object(
      'success', false,
      'message', 'Organization tier limits not found.',
      'data', jsonb_build_object(
        'file_size', p_new_file_size,
        'remaining_bytes', null
      )
    );
  end if;

  v_storage_limit_mb := (v_limits ->> 'storage_limit_mb_per_org')::int;

  if v_storage_limit_mb is null then
    return jsonb_build_object(
      'success', false,
      'message', 'Organization has no storage limit defined.',
      'data', jsonb_build_object(
        'file_size', p_new_file_size,
        'remaining_bytes', null
      )
    );
  end if;

  v_storage_limit_bytes := v_storage_limit_mb * 1024 * 1024;

  -------------------------------------------------------------------
  -- 2. Calculate current storage usage
  -------------------------------------------------------------------
  select
    coalesce((
      select sum(size) from public.file_library
      where organization_id = p_org_id
        and (p_exclude_file_id is null or id != p_exclude_file_id)
    ), 0)
    +
    coalesce((
      select sum(size) from public.published_file_library
      where organization_id = p_org_id
    ), 0)
  into v_current_usage;

  v_remaining_bytes := v_storage_limit_bytes - v_current_usage;

  -------------------------------------------------------------------
  -- 3. Determine if the new file can be uploaded
  -------------------------------------------------------------------
  if (v_current_usage + p_new_file_size) <= v_storage_limit_bytes then
    return jsonb_build_object(
      'success', true,
      'message', 'File can be uploaded.',
      'data', jsonb_build_object(
        'file_size', p_new_file_size,
        'remaining_bytes', v_remaining_bytes - p_new_file_size
      )
    );
  else
    return jsonb_build_object(
      'success', false,
      'message', 'Uploading this file would exceed the storage limit.',
      'data', jsonb_build_object(
        'file_size', p_new_file_size,
        'remaining_bytes', v_remaining_bytes
      )
    );
  end if;
end;
$$;
