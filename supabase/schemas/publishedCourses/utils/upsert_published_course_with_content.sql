-- ====================================================================================
-- FUNCTION: public.upsert_published_course_with_content
-- ====================================================================================
drop function if exists public.upsert_published_course_with_content(jsonb, jsonb);

create or replace function public.upsert_published_course_with_content(
  course_data jsonb,
  structure_content jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
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
    content_version, pricing_version, overview_version, last_update_types,
    pricing_tiers, has_free_tier, min_price,
    average_rating, total_reviews,
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
    coalesce((course_data->>'content_version')::integer, 1),
    coalesce((course_data->>'pricing_version')::integer, 1),
    coalesce((course_data->>'overview_version')::integer, 1),
    (
      select array_agg(value::text::public.course_update_type)
      from jsonb_array_elements_text(course_data->'last_update_types')
    ),
    course_data->'pricing_tiers',
    (course_data->>'has_free_tier')::boolean,
    (course_data->>'min_price')::numeric,
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
    content_version = excluded.content_version,
    pricing_version = excluded.pricing_version,
    overview_version = excluded.overview_version,
    last_update_types = excluded.last_update_types,
    content_changed_at = case
      when excluded.content_version > public.published_courses.content_version then timezone('utc', now())
      else public.published_courses.content_changed_at
    end,
    pricing_changed_at = case
      when excluded.pricing_version > public.published_courses.pricing_version then timezone('utc', now())
      else public.published_courses.pricing_changed_at
    end,
    overview_changed_at = case
      when excluded.overview_version > public.published_courses.overview_version then timezone('utc', now())
      else public.published_courses.overview_changed_at
    end,
    pricing_tiers = excluded.pricing_tiers,
    has_free_tier = excluded.has_free_tier,
    min_price = excluded.min_price,
    -- Preserve existing enrollment stats (managed by triggers)
    -- total_enrollments and active_enrollments are NOT updated during republish
    -- Reset completion_rate since progress is cleared on republish
    completion_rate = 0.00,
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
  -- STEP 10: Return success with detailed storage information
  -------------------------------------------------------------------
  -- Note: Progress invalidation is now handled granularly by the
  -- detect_changed_blocks and invalidate_stale_block_progress functions
  -- in the TypeScript layer after successful publication
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
$$;