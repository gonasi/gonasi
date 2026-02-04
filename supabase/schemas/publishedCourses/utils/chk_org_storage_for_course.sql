-- =============================================
-- READABLE FILE SIZE FUNCTION
-- =============================================

drop function if exists public.readable_size(bigint);

create function public.readable_size(bytes bigint)
returns text
language plpgsql
immutable
set search_path = ''
as $$
begin
  if bytes is null then
    return '0 B';
  elsif bytes >= 1024 * 1024 * 1024 then
    return round(bytes::numeric / (1024 * 1024 * 1024), 2) || ' GB';
  elsif bytes >= 1024 * 1024 then
    return round(bytes::numeric / (1024 * 1024), 2) || ' MB';
  elsif bytes >= 1024 then
    return round(bytes::numeric / 1024, 2) || ' KB';
  else
    return bytes || ' B';
  end if;
end;
$$;

drop function if exists public.chk_org_storage_for_course(uuid, bigint, uuid);
drop function if exists public.chk_org_storage_for_course(uuid, bigint);

create or replace function public.chk_org_storage_for_course(
  org_id uuid,
  net_storage_change_bytes bigint,
  course_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  storage_limit_mb integer;
  storage_limit_bytes bigint;
  builder_files bigint;
  published_files bigint;
  total_used bigint;
  available bigint;
  allowed boolean;
begin
  -- 1. Fetch org tier
  select coalesce(tl.storage_limit_mb_per_org, 0)
  into storage_limit_mb
  from public.organizations o
  join public.organization_subscriptions os on o.id = os.organization_id
  join public.tier_limits tl on os.tier = tl.tier
  where o.id = org_id;

  if storage_limit_mb is null then
    raise exception 'Organization % or subscription not found', org_id;
  end if;

  storage_limit_bytes := storage_limit_mb::bigint * 1024 * 1024;

  -- 2. Builder files
  select coalesce(sum(size), 0)
  into builder_files
  from public.file_library
  where organization_id = org_id;

  -- 3. Published files
  select coalesce(sum(size), 0)
  into published_files
  from public.published_file_library
  where organization_id = org_id;

  -- 4. Totals
  total_used := builder_files + published_files;
  available := storage_limit_bytes - total_used;

  -- 5. Allow?
  allowed := available >= net_storage_change_bytes;

  -- 6. Return JSON
  return jsonb_build_object(
    'storage_limit_mb', storage_limit_mb,
    'storage_limit_bytes', storage_limit_bytes,
    'storage_limit_readable', public.readable_size(storage_limit_bytes),

    'usage', jsonb_build_object(
      'builder_files_bytes', builder_files,
      'builder_files_readable', public.readable_size(builder_files),

      'published_files_bytes', published_files,
      'published_files_readable', public.readable_size(published_files),

      'total_used_bytes', total_used,
      'total_used_readable', public.readable_size(total_used),

      'available_bytes', available,
      'available_readable', public.readable_size(available),

      'usage_percentage',
        case when storage_limit_bytes > 0
          then round((total_used::numeric / storage_limit_bytes::numeric * 100)::numeric, 2)
          else 0 end
    ),

    'change', jsonb_build_object(
      'net_storage_change_bytes', net_storage_change_bytes,
      'net_storage_change_readable', public.readable_size(net_storage_change_bytes),

      'available_after_change_bytes', available - net_storage_change_bytes,
      'available_after_change_readable', public.readable_size(available - net_storage_change_bytes)
    ),

    'allowed', allowed,
    'reason', case
      when allowed then 'Enough storage available'
      else 'Not enough storage: requires ' || public.readable_size(net_storage_change_bytes)
            || ', but only ' || public.readable_size(available) || ' available.'
    end
  );
end;
$$;
