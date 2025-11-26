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
returns jsonb
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  v_limits jsonb;
  v_storage_limit_mb integer := 0;
  v_storage_limit_bytes bigint := 0;

  v_file_usage bigint := 0;
  v_published_usage bigint := 0;
  v_total_usage bigint := 0;
  v_data jsonb;
begin
  -------------------------------------------------------------------
  -- 1. Fetch tier limits and convert composite type to JSONB
  -------------------------------------------------------------------
  select to_jsonb(public.get_tier_limits(p_org_id))
  into v_limits;

  if v_limits is null then
    return jsonb_build_object(
      'success', false,
      'message', 'No active subscription found for organization',
      'data', null
    );
  end if;

  -- Safely extract storage limit (default to 0 if missing)
  v_storage_limit_mb := coalesce((v_limits ->> 'storage_limit_mb_per_org')::int, 0);
  v_storage_limit_bytes := v_storage_limit_mb::bigint * 1024 * 1024;

  -------------------------------------------------------------------
  -- 2. Usage from file_library
  -------------------------------------------------------------------
  select coalesce(sum(size),0)
  into v_file_usage
  from public.file_library
  where organization_id = p_org_id;

  -------------------------------------------------------------------
  -- 3. Usage from published_file_library
  -------------------------------------------------------------------
  select coalesce(sum(size),0)
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
  v_data := jsonb_build_object(
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
  return jsonb_build_object(
    'success', true,
    'message', 'Storage usage fetched successfully',
    'data', v_data
  );

exception
  when others then
    return jsonb_build_object(
      'success', false,
      'message', sqlerrm,
      'data', null
    );
end;
$$;
