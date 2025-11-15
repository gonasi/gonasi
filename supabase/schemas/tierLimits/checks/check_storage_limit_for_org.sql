-- ===========================================================
-- FUNCTION: public.check_storage_limit_for_org
-- -----------------------------------------------------------
-- Purpose:
--   Determines whether an organization can store an additional
--   file of a given size without exceeding its storage quota.
--
-- Behavior:
--   - Includes both "file_library" and "published_file_library"
--   - Supports excluding an existing file path when updating an
--     already-uploaded file.
--   - Fetches storage limit based on the organization's
--     active subscription tier.
-- ===========================================================
create or replace function public.check_storage_limit_for_org(
  p_org_id uuid,
  p_new_file_size bigint,
  p_exclude_file_id uuid default null  -- Changed from path to id
)
returns boolean
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  v_current_usage bigint;
  v_storage_limit_mb integer;
  v_storage_limit_bytes bigint;
  v_limits json;
begin
  -------------------------------------------------------------------
  -- 0. Reject invalid file size
  -------------------------------------------------------------------
  if p_new_file_size is null or p_new_file_size <= 0 then
    return false;
  end if;

  -------------------------------------------------------------------
  -- 1. Fetch tier limits
  -------------------------------------------------------------------
  select public.get_tier_limits_for_org(p_org_id)
  into v_limits;

  if v_limits is null then
    return false;
  end if;

  v_storage_limit_mb := (v_limits ->> 'storage_limit_mb_per_org')::int;

  if v_storage_limit_mb is null then
    return false;
  end if;

  v_storage_limit_bytes := v_storage_limit_mb * 1024 * 1024;

  -------------------------------------------------------------------
  -- 2. Calculate current usage from file_library only
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

  -------------------------------------------------------------------
  -- 3. Check if adding the new file exceeds limit
  -------------------------------------------------------------------
  return (v_current_usage + p_new_file_size) <= v_storage_limit_bytes;
end;
$$;