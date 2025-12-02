revoke delete on table "public"."user_roles" from "anon";

revoke insert on table "public"."user_roles" from "anon";

revoke references on table "public"."user_roles" from "anon";

revoke select on table "public"."user_roles" from "anon";

revoke trigger on table "public"."user_roles" from "anon";

revoke truncate on table "public"."user_roles" from "anon";

revoke update on table "public"."user_roles" from "anon";

revoke delete on table "public"."user_roles" from "authenticated";

revoke insert on table "public"."user_roles" from "authenticated";

revoke references on table "public"."user_roles" from "authenticated";

revoke select on table "public"."user_roles" from "authenticated";

revoke trigger on table "public"."user_roles" from "authenticated";

revoke truncate on table "public"."user_roles" from "authenticated";

revoke update on table "public"."user_roles" from "authenticated";

alter table "public"."tier_limits" drop constraint "tier_limits_ai_usage_limit_monthly_check";

drop function if exists "public"."get_org_storage_usage"(p_org_id uuid);

drop function if exists "public"."org_usage_counts"(p_org uuid);

drop function if exists public.chk_org_storage_for_course(uuid, bigint, uuid);

drop function if exists public.chk_org_storage_for_course(uuid, bigint);

drop function if exists public.upsert_published_course_with_content(jsonb, jsonb);


alter table "public"."tier_limits" alter column "ai_usage_limit_monthly" set default 0;

alter table "public"."tier_limits" alter column "ai_usage_limit_monthly" set not null;

alter table "public"."tier_limits" add constraint "tier_limits_ai_usage_limit_monthly_check" CHECK ((ai_usage_limit_monthly >= 0)) not valid;

alter table "public"."tier_limits" validate constraint "tier_limits_ai_usage_limit_monthly_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.chk_org_storage_for_course(org_id uuid, net_storage_change_bytes bigint, course_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  from organizations o
  join organization_subscriptions os on o.id = os.organization_id
  join tier_limits tl on os.tier = tl.tier
  where o.id = org_id;

  if storage_limit_mb is null then
    raise exception 'Organization % or subscription not found', org_id;
  end if;

  storage_limit_bytes := storage_limit_mb::bigint * 1024 * 1024;

  -- 2. Builder files
  select coalesce(sum(size), 0)
  into builder_files
  from file_library
  where organization_id = org_id;

  -- 3. Published files
  select coalesce(sum(size), 0)
  into published_files
  from published_file_library
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
    'storage_limit_readable', readable_size(storage_limit_bytes),

    'usage', jsonb_build_object(
      'builder_files_bytes', builder_files,
      'builder_files_readable', readable_size(builder_files),

      'published_files_bytes', published_files,
      'published_files_readable', readable_size(published_files),

      'total_used_bytes', total_used,
      'total_used_readable', readable_size(total_used),

      'available_bytes', available,
      'available_readable', readable_size(available),

      'usage_percentage',
        case when storage_limit_bytes > 0
          then round((total_used::numeric / storage_limit_bytes::numeric * 100)::numeric, 2)
          else 0 end
    ),

    'change', jsonb_build_object(
      'net_storage_change_bytes', net_storage_change_bytes,
      'net_storage_change_readable', readable_size(net_storage_change_bytes),

      'available_after_change_bytes', available - net_storage_change_bytes,
      'available_after_change_readable', readable_size(available - net_storage_change_bytes)
    ),

    'allowed', allowed,
    'reason', case
      when allowed then 'Enough storage available'
      else 'Not enough storage: requires ' || readable_size(net_storage_change_bytes)
            || ', but only ' || readable_size(available) || ' available.'
    end
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.readable_size(bytes bigint)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
begin
  if bytes is null then
    return '0 B';
  elsif bytes >= 1024 * 1024 * 1024 then
    return round((bytes::numeric / (1024*1024*1024))::numeric, 2) || ' GB';
  elsif bytes >= 1024 * 1024 then
    return round((bytes::numeric / (1024*1024))::numeric, 2) || ' MB';
  elsif bytes >= 1024 then
    return round((bytes::numeric / 1024)::numeric, 2) || ' KB';
  else
    return bytes || ' B';
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.check_storage_limit_for_org(p_org_id uuid, p_new_file_size bigint, p_exclude_file_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.upsert_published_course_with_content(course_data jsonb, structure_content jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  course_uuid uuid;
  org_id uuid;
  new_files_to_publish_size bigint := 0;
  old_published_files_size bigint := 0;
  net_storage_change bigint;
  storage_result jsonb;
begin
  -------------------------------------------------------------------
  -- STEP 1: Extract and validate required identifiers
  -------------------------------------------------------------------
  course_uuid := (course_data->>'id')::uuid;
  if course_uuid is null then
    raise exception 'course_data must contain a valid id field';
  end if;

  org_id := (course_data->>'organization_id')::uuid;
  if org_id is null then
    raise exception 'course_data must contain a valid organization_id field';
  end if;

  -------------------------------------------------------------------
  -- STEP 2: Check user permissions before proceeding
  -------------------------------------------------------------------
  if not public.can_publish_course(course_uuid, org_id, auth.uid()) then
    return jsonb_build_object(
      'success', false,
      'message', 'You do not have permission to publish this course'
    );
  end if;

  -------------------------------------------------------------------
  -- STEP 3: Calculate size of files that will be copied to published
  -------------------------------------------------------------------
  -- These files will be COPIED from file_library to published_file_library
  -- The originals stay in file_library (draft storage)
  select coalesce(sum(fl.size), 0)
  into new_files_to_publish_size
  from public.file_library fl
  where fl.course_id = course_uuid and fl.organization_id = org_id;

  -------------------------------------------------------------------
  -- STEP 4: Get size of EXISTING published files for this course
  -------------------------------------------------------------------
  -- These will be DELETED and replaced with the new files
  -- This frees up space in published_file_library
  select coalesce(sum(pfl.size), 0)
  into old_published_files_size
  from public.published_file_library pfl
  where pfl.course_id = course_uuid and pfl.organization_id = org_id;

  -------------------------------------------------------------------
  -- STEP 5: Calculate net storage change and validate quota
  -------------------------------------------------------------------
  -- Net change in published_file_library storage:
  -- We're removing old_published_files_size and adding new_files_to_publish_size
  -- file_library stays unchanged (files are copied, not moved)
  net_storage_change := new_files_to_publish_size - old_published_files_size;
  
  -- Only check quota if we're increasing storage
  if net_storage_change > 0 then
    storage_result := public.chk_org_storage_for_course(
      org_id, 
      net_storage_change, 
      course_uuid
    );
    
    if not (storage_result->>'allowed')::boolean then
      return jsonb_build_object(
        'success', false,
        'message', storage_result->>'reason',
        'data', jsonb_build_object(
          'course_id', course_uuid,
          'new_files_to_publish_size_bytes', new_files_to_publish_size,
          'old_published_files_size_bytes', old_published_files_size,
          'net_storage_change_bytes', net_storage_change,
          'storage_check', storage_result
        )
      );
    end if;
  else
    -- Shrinking or same size - always allowed
    storage_result := jsonb_build_object(
      'allowed', true,
      'message', 'Storage check passed (shrinking or no change)'
    );
  end if;

  -------------------------------------------------------------------
  -- STEP 6: Upsert course metadata into published_courses table
  -------------------------------------------------------------------
  insert into public.published_courses (
    id, organization_id, category_id, subcategory_id, is_active,
    name, description, image_url, blur_hash, visibility,
    course_structure_overview, total_chapters, total_lessons, total_blocks,
    pricing_tiers, has_free_tier, min_price, total_enrollments,
    active_enrollments, completion_rate, average_rating, total_reviews,
    published_by, published_at
  )
  values (
    course_uuid, org_id,
    (course_data->>'category_id')::uuid,
    (course_data->>'subcategory_id')::uuid,
    (course_data->>'is_active')::boolean,
    course_data->>'name', course_data->>'description',
    course_data->>'image_url', course_data->>'blur_hash',
    (course_data->>'visibility')::public.course_access,
    course_data->'course_structure_overview',
    (course_data->>'total_chapters')::integer,
    (course_data->>'total_lessons')::integer,
    (course_data->>'total_blocks')::integer,
    course_data->'pricing_tiers',
    (course_data->>'has_free_tier')::boolean,
    (course_data->>'min_price')::numeric,
    (course_data->>'total_enrollments')::integer,
    (course_data->>'active_enrollments')::integer,
    (course_data->>'completion_rate')::numeric,
    (course_data->>'average_rating')::numeric,
    (course_data->>'total_reviews')::integer,
    (course_data->>'published_by')::uuid,
    (course_data->>'published_at')::timestamptz
  )
  on conflict (id) do update set
    organization_id = excluded.organization_id,
    category_id = excluded.category_id,
    subcategory_id = excluded.subcategory_id,
    is_active = excluded.is_active,
    name = excluded.name,
    description = excluded.description,
    image_url = excluded.image_url,
    blur_hash = excluded.blur_hash,
    visibility = excluded.visibility,
    course_structure_overview = excluded.course_structure_overview,
    total_chapters = excluded.total_chapters,
    total_lessons = excluded.total_lessons,
    total_blocks = excluded.total_blocks,
    pricing_tiers = excluded.pricing_tiers,
    has_free_tier = excluded.has_free_tier,
    min_price = excluded.min_price,
    total_enrollments = excluded.total_enrollments,
    active_enrollments = excluded.active_enrollments,
    completion_rate = excluded.completion_rate,
    average_rating = excluded.average_rating,
    total_reviews = excluded.total_reviews,
    published_by = excluded.published_by,
    published_at = excluded.published_at,
    updated_at = timezone('utc', now());

  -------------------------------------------------------------------
  -- STEP 7: Delete old published files for this course
  -------------------------------------------------------------------
  -- Clear out the old published files before adding the new ones
  delete from public.published_file_library
  where course_id = course_uuid and organization_id = org_id;

  -------------------------------------------------------------------
  -- STEP 8: Copy files from file_library to published_file_library
  -------------------------------------------------------------------
  -- COPY (not move) files from builder to published
  -- Files remain in file_library for future edits

  insert into public.published_file_library (
    organization_id,
    course_id,
    created_by,
    updated_by,
    name,
    path,
    size,
    mime_type,
    extension,
    file_type,
    blur_preview,
    created_at,
    updated_at
  )
  select
    fl.organization_id,
    fl.course_id,
    fl.created_by,
    fl.updated_by,
    fl.name,
    fl.path,
    fl.size,
    fl.mime_type,
    fl.extension,
    fl.file_type,
    fl.blur_preview,
    fl.created_at,
    fl.updated_at
  from public.file_library fl
  where fl.course_id = course_uuid
    and fl.organization_id = org_id;


  -------------------------------------------------------------------
  -- STEP 9: Upsert course structure content into separate table
  -------------------------------------------------------------------
  insert into public.published_course_structure_content (
    id, course_structure_content
  )
  values (
    course_uuid, structure_content
  )
  on conflict (id) do update set
    course_structure_content = excluded.course_structure_content,
    updated_at = timezone('utc', now());

  -------------------------------------------------------------------
  -- STEP 10: Queue background job to reset user progress
  -------------------------------------------------------------------
  perform public.enqueue_delete_course_progress(course_uuid);

  -------------------------------------------------------------------
  -- STEP 11: Return success with detailed storage information
  -------------------------------------------------------------------
  return jsonb_build_object(
    'success', true,
    'message', 'Course published successfully',
    'data', jsonb_build_object(
      'course_id', course_uuid,
      'new_files_to_publish_size_bytes', new_files_to_publish_size,
      'old_published_files_size_bytes', old_published_files_size,
      'net_storage_change_bytes', net_storage_change,
      'note', 'Files copied from file_library (draft) to published_file_library (published). Draft files remain unchanged.',
      'storage_info', storage_result
    )
  );

exception
  when others then
    return jsonb_build_object(
      'success', false,
      'message', 'Error publishing course: ' || sqlerrm,
      'data', jsonb_build_object(
        'course_id', course_uuid,
        'error_detail', sqlstate
      )
    );
end;
$function$
;


