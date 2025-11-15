-- ===========================================================
-- FUNCTION: public.get_org_storage_usage
-- -----------------------------------------------------------
-- Purpose:
--   Returns a structured summary of an organization's current
--   storage usage and limits.
--
-- Standardized Return Format:
--   {
--     "success": boolean,
--     "message": text,
--     "data": {
--       "current_usage_bytes": bigint,
--       "storage_limit_bytes": bigint,
--       "remaining_bytes": bigint,
--       "percent_used": numeric,
--       "exceeded": boolean
--     } | null
--   }
-- ===========================================================

create or replace function public.get_org_storage_usage(
  p_org_id uuid
)
returns json
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  v_limits json;
  v_storage_limit_mb integer;
  v_storage_limit_bytes bigint;

  v_file_usage bigint := 0;
  v_published_usage bigint := 0;
  v_total_usage bigint := 0;
  v_data json;
begin
  -------------------------------------------------------------------
  -- 1. Fetch tier limits via helper
  -------------------------------------------------------------------
  select public.get_tier_limits_for_org(p_org_id)
  into v_limits;

  if v_limits is null then
    return json_build_object(
      'success', false,
      'message', 'No active subscription found for organization',
      'data', null
    );
  end if;

  v_storage_limit_mb := (v_limits ->> 'storage_limit_mb_per_org')::int;
  v_storage_limit_bytes := v_storage_limit_mb * 1024 * 1024;

  -------------------------------------------------------------------
  -- 2. Usage from file_library
  -------------------------------------------------------------------
  select coalesce(sum(size), 0)
  into v_file_usage
  from public.file_library
  where organization_id = p_org_id;

  -------------------------------------------------------------------
  -- 3. Usage from published_file_library
  -------------------------------------------------------------------
  select coalesce(sum(size), 0)
  into v_published_usage
  from public.published_file_library
  where organization_id = p_org_id;

  -------------------------------------------------------------------
  -- 4. Total usage
  -------------------------------------------------------------------
  v_total_usage := v_file_usage + v_published_usage;

  -------------------------------------------------------------------
  -- 5. Data payload
  -------------------------------------------------------------------
  v_data := json_build_object(
    'current_usage_bytes', v_total_usage,
    'storage_limit_bytes', v_storage_limit_bytes,
    'remaining_bytes', greatest(v_storage_limit_bytes - v_total_usage, 0),
    'percent_used',
      case
        when v_storage_limit_bytes = 0 then 0
        else round((v_total_usage::numeric / v_storage_limit_bytes::numeric) * 100, 2)
      end,
    'exceeded', v_total_usage > v_storage_limit_bytes
  );

  -------------------------------------------------------------------
  -- 6. Success response
  -------------------------------------------------------------------
  return json_build_object(
    'success', true,
    'message', 'Storage usage fetched successfully',
    'data', v_data
  );

exception
  when others then
    return json_build_object(
      'success', false,
      'message', sqlerrm,
      'data', null
    );
end;
$$;
