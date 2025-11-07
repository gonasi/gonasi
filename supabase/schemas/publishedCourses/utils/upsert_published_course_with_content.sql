-- ====================================================================================
-- FUNCTION: upsert_published_course_with_content (Updated)  
-- PURPOSE: Atomically upserts published course data and resets all user progress
-- SECURITY: Runs as definer with restricted search_path
-- ====================================================================================
create or replace function public.upsert_published_course_with_content(
  course_data jsonb,
  structure_content jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  course_uuid uuid;
  org_id uuid;
begin
  -- Extract IDs
  course_uuid := (course_data->>'id')::uuid;
  if course_uuid is null then
    raise exception 'course_data must contain a valid id field';
  end if;

  org_id := (course_data->>'organization_id')::uuid;

  -- Permission check using helper function
  if not public.can_publish_course(course_uuid, org_id, auth.uid()) then
    raise exception 'You do not have permission to publish this course';
  end if;

  -- Upsert into published_courses
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

  -- Upsert into published_course_structure_content
  insert into public.published_course_structure_content (
    id, course_structure_content
  )
  values (
    course_uuid, structure_content
  )
  on conflict (id) do update set
    course_structure_content = excluded.course_structure_content,
    updated_at = timezone('utc', now());

  -- Enqueue progress deletion
  perform public.enqueue_delete_course_progress(course_uuid);

  raise notice 'Course % published and progress reset queued', course_uuid;
end;
$$;
