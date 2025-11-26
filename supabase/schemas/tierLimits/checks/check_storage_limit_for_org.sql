-- ===========================================================
-- FUNCTION: public.check_storage_limit_for_org
-- -----------------------------------------------------------
-- Purpose:
--   Determines whether an organization can upload a file of a 
--   specified size without exceeding its storage quota.
--
-- Inputs:
--   - p_org_id uuid
--       The UUID of the organization whose storage quota will be checked.
--   - p_new_file_size bigint
--       Size of the file to be uploaded, in bytes.
--   - p_exclude_file_id uuid (optional, default null)
--       ID of an existing file to exclude from the calculation (useful when updating a file).
--
-- Behavior:
--   1. Validates that p_new_file_size is positive.
--   2. Fetches the organization's active subscription tier limits
--      using public.get_tier_limits().
--      - Converts the composite type to JSONB to access storage_limit_mb_per_org.
--   3. Calculates current storage usage:
--        - Sum of file_library sizes (excluding p_exclude_file_id if provided)
--        - Sum of published_file_library sizes
--   4. Determines whether adding p_new_file_size exceeds the storage limit.
--   5. Returns a structured JSONB object with success status, message, 
--      and details including file size and remaining bytes.
--
-- Output (JSONB):
--   {
--     "success": boolean,    -- true if the file can be uploaded, false otherwise
--     "message": string,     -- human-readable explanation
--     "data": {
--       "file_size": bigint,         -- size of the file attempted to upload
--       "remaining_bytes": bigint    -- remaining quota after upload (or current remaining if upload fails)
--     }
--   }
--
-- Notes:
--   - Returns a consistent JSONB structure suitable for Supabase RPC.
--   - Handles composite type conversion, invalid file sizes, and optional file exclusion.
-- ===========================================================

drop function if exists public.check_storage_limit_for_org(uuid, bigint, uuid);

create or replace function public.check_storage_limit_for_org(
  p_org_id uuid,               
  p_new_file_size bigint,      
  p_exclude_file_id uuid default null  
)
returns jsonb
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  v_current_usage bigint := 0;
  v_storage_limit_mb integer := 0;
  v_storage_limit_bytes bigint := 0;
  v_limits jsonb;
  v_remaining_bytes bigint := 0;
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
  -- 1. Fetch organization's tier limits and convert composite to jsonb
  -------------------------------------------------------------------
  select to_jsonb(public.get_tier_limits(p_org_id))
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

  v_storage_limit_mb := coalesce((v_limits ->> 'storage_limit_mb_per_org')::int, 0);
  v_storage_limit_bytes := v_storage_limit_mb::bigint * 1024 * 1024;

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
exception
  when others then
    return jsonb_build_object(
      'success', false,
      'message', sqlerrm,
      'data', jsonb_build_object(
        'file_size', p_new_file_size,
        'remaining_bytes', null
      )
    );
end;
$$;
