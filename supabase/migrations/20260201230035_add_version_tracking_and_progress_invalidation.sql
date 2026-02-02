alter table "public"."block_progress" add column "block_content_version" integer;

alter table "public"."block_progress" add column "block_published_at" timestamp with time zone;

alter table "public"."chapter_progress" add column "chapter_content_version" integer;

alter table "public"."chapter_progress" add column "last_recalculated_at" timestamp with time zone;

alter table "public"."chapters" add column "content_version" integer not null default 1;

alter table "public"."course_pricing_tiers" add column "pricing_version" integer not null default 1;

alter table "public"."course_progress" add column "last_recalculated_at" timestamp with time zone;

alter table "public"."courses" add column "content_version" integer not null default 1;

alter table "public"."courses" add column "last_update_types" public.course_update_type[];

alter table "public"."courses" add column "overview_version" integer not null default 1;

alter table "public"."courses" add column "pricing_version" integer not null default 1;

alter table "public"."lesson_blocks" add column "content_version" integer not null default 1;

alter table "public"."lesson_progress" add column "last_recalculated_at" timestamp with time zone;

alter table "public"."lesson_progress" add column "lesson_content_version" integer;

alter table "public"."lessons" add column "content_version" integer not null default 1;

alter table "public"."published_courses" add column "content_changed_at" timestamp with time zone;

alter table "public"."published_courses" add column "content_version" integer not null default 1;

alter table "public"."published_courses" add column "last_update_types" public.course_update_type[];

alter table "public"."published_courses" add column "overview_changed_at" timestamp with time zone;

alter table "public"."published_courses" add column "overview_version" integer not null default 1;

alter table "public"."published_courses" add column "pricing_changed_at" timestamp with time zone;

alter table "public"."published_courses" add column "pricing_version" integer not null default 1;

CREATE INDEX idx_block_progress_version_mismatch ON public.block_progress USING btree (published_course_id, block_id, block_content_version);

CREATE INDEX idx_chapters_content_version ON public.chapters USING btree (content_version);

CREATE INDEX idx_course_pricing_tiers_pricing_version ON public.course_pricing_tiers USING btree (pricing_version);

CREATE INDEX idx_courses_content_version ON public.courses USING btree (content_version);

CREATE INDEX idx_courses_last_update_types ON public.courses USING gin (last_update_types);

CREATE INDEX idx_lesson_blocks_content_version ON public.lesson_blocks USING btree (content_version);

CREATE INDEX idx_lessons_content_version ON public.lessons USING btree (content_version);

CREATE INDEX idx_published_courses_content_version ON public.published_courses USING btree (content_version);

CREATE INDEX idx_published_courses_last_update_types ON public.published_courses USING gin (last_update_types);

CREATE INDEX idx_published_courses_overview_version ON public.published_courses USING btree (overview_version);

CREATE INDEX idx_published_courses_pricing_version ON public.published_courses USING btree (pricing_version);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.detect_changed_blocks(p_course_id uuid, p_published_course_id uuid)
 RETURNS TABLE(block_id uuid, lesson_id uuid, chapter_id uuid, change_type text, old_version integer, new_version integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  published_structure jsonb;
begin
  -- Fetch the published course structure
  select course_structure_content
  into published_structure
  from public.published_course_structure_content
  where id = p_published_course_id;

  -- If no published version exists, all blocks are new
  if published_structure is null then
    return query
    select
      lb.id as block_id,
      lb.lesson_id,
      lb.chapter_id,
      'new'::text as change_type,
      0 as old_version,
      lb.content_version as new_version
    from public.lesson_blocks lb
    where lb.course_id = p_course_id;
    return;
  end if;

  -- Find modified blocks (where draft version > published version)
  return query
  with published_blocks as (
    select
      (block->>'id')::uuid as block_id,
      (block->>'lesson_id')::uuid as lesson_id,
      (block->>'chapter_id')::uuid as chapter_id,
      coalesce((block->>'content_version')::integer, 1) as content_version
    from public.published_course_structure_content,
      jsonb_path_query(
        course_structure_content,
        '$.chapters[*].lessons[*].blocks[*]'
      ) as block
    where id = p_published_course_id
  ),
  draft_blocks as (
    select
      lb.id as block_id,
      lb.lesson_id,
      lb.chapter_id,
      lb.content_version
    from public.lesson_blocks lb
    where lb.course_id = p_course_id
  )
  -- Modified blocks: version increased
  select
    d.block_id,
    d.lesson_id,
    d.chapter_id,
    'modified'::text as change_type,
    coalesce(p.content_version, 0) as old_version,
    d.content_version as new_version
  from draft_blocks d
  left join published_blocks p on d.block_id = p.block_id
  where d.content_version > coalesce(p.content_version, 0)

  union all

  -- New blocks: exist in draft but not in published
  select
    d.block_id,
    d.lesson_id,
    d.chapter_id,
    'new'::text as change_type,
    0 as old_version,
    d.content_version as new_version
  from draft_blocks d
  left join published_blocks p on d.block_id = p.block_id
  where p.block_id is null

  union all

  -- Deleted blocks: exist in published but not in draft
  select
    p.block_id,
    p.lesson_id,
    p.chapter_id,
    'deleted'::text as change_type,
    p.content_version as old_version,
    0 as new_version
  from published_blocks p
  left join draft_blocks d on p.block_id = d.block_id
  where d.block_id is null;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_chapter_version()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  -- On INSERT, always start with version 1 (default already set)
  if TG_OP = 'INSERT' then
    return NEW;
  end if;

  -- On UPDATE, only increment version if name/description changed
  if TG_OP = 'UPDATE' and (
    NEW.name is distinct from OLD.name or
    NEW.description is distinct from OLD.description
  ) then
    NEW.content_version := OLD.content_version + 1;
  end if;

  return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_lesson_block_version()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  -- On INSERT, always start with version 1 (default already set)
  if TG_OP = 'INSERT' then
    return NEW;
  end if;

  -- On UPDATE, only increment version if content/settings/plugin_type changed
  if TG_OP = 'UPDATE' and (
    NEW.content is distinct from OLD.content or
    NEW.settings is distinct from OLD.settings or
    NEW.plugin_type is distinct from OLD.plugin_type
  ) then
    NEW.content_version := OLD.content_version + 1;
  end if;

  return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_lesson_version()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  -- On INSERT, always start with version 1 (default already set)
  if TG_OP = 'INSERT' then
    return NEW;
  end if;

  -- On UPDATE, only increment version if settings changed
  if TG_OP = 'UPDATE' and (
    NEW.settings is distinct from OLD.settings or
    NEW.name is distinct from OLD.name
  ) then
    NEW.content_version := OLD.content_version + 1;
  end if;

  return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_pricing_tier_version()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  -- On INSERT, always start with version 1 (default already set)
  if TG_OP = 'INSERT' then
    return NEW;
  end if;

  -- On UPDATE, only increment version if pricing-related fields changed
  if TG_OP = 'UPDATE' and (
    NEW.price is distinct from OLD.price or
    NEW.payment_frequency is distinct from OLD.payment_frequency or
    NEW.is_free is distinct from OLD.is_free or
    NEW.promotional_price is distinct from OLD.promotional_price or
    NEW.promotion_start_date is distinct from OLD.promotion_start_date or
    NEW.promotion_end_date is distinct from OLD.promotion_end_date or
    NEW.is_active is distinct from OLD.is_active
  ) then
    NEW.pricing_version := OLD.pricing_version + 1;
  end if;

  return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.invalidate_stale_block_progress(p_published_course_id uuid, p_changed_blocks jsonb)
 RETURNS TABLE(invalidated_count integer, affected_users uuid[], affected_lessons uuid[], recalculated_lessons integer, recalculated_chapters integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_invalidated_count integer := 0;
  v_affected_users uuid[];
  v_affected_lessons uuid[];
  v_recalculated_lessons integer := 0;
  v_recalculated_chapters integer := 0;
  v_user_id uuid;
  v_lesson_id uuid;
  v_chapter_id uuid;
begin
  -- ============================================================================
  -- STEP 1: Collect affected users and lessons before deletion
  -- ============================================================================
  select
    array_agg(distinct bp.user_id),
    array_agg(distinct bp.lesson_id)
  into v_affected_users, v_affected_lessons
  from public.block_progress bp
  where bp.published_course_id = p_published_course_id
    and bp.block_id in (
      select (block->>'block_id')::uuid
      from jsonb_array_elements(p_changed_blocks) as block
    );

  -- If no progress to invalidate, return early
  if v_affected_users is null then
    return query select 0, '{}'::uuid[], '{}'::uuid[], 0, 0;
    return;
  end if;

  -- ============================================================================
  -- STEP 2: Delete block_progress for changed blocks
  -- ============================================================================
  with deleted_rows as (
    delete from public.block_progress
    where published_course_id = p_published_course_id
      and block_id in (
        select (block->>'block_id')::uuid
        from jsonb_array_elements(p_changed_blocks) as block
      )
    returning *
  )
  select count(*)::integer
  into v_invalidated_count
  from deleted_rows;

  -- ============================================================================
  -- STEP 3: Recalculate lesson progress for all affected user-lesson combinations
  -- ============================================================================
  -- For each unique combination of user and lesson that had progress deleted,
  -- recalculate the lesson progress
  for v_user_id, v_lesson_id in
    select distinct unnest(v_affected_users), unnest(v_affected_lessons)
  loop
    -- Call the existing lesson progress update function
    perform public.update_lesson_progress_for_user(
      v_user_id,
      p_published_course_id,
      v_lesson_id
    );

    v_recalculated_lessons := v_recalculated_lessons + 1;
  end loop;

  -- ============================================================================
  -- STEP 4: Recalculate chapter progress for affected chapters
  -- ============================================================================
  -- Get unique chapters from the affected lessons
  with affected_chapters as (
    select distinct
      (block->>'chapter_id')::uuid as chapter_id
    from jsonb_array_elements(p_changed_blocks) as block
    where (block->>'chapter_id')::uuid is not null
  )
  select count(distinct chapter_id)::integer
  into v_recalculated_chapters
  from affected_chapters;

  -- Recalculate chapter progress for each affected user-chapter combination
  for v_user_id, v_chapter_id in
    select distinct
      u.user_id,
      (block->>'chapter_id')::uuid as chapter_id
    from jsonb_array_elements(p_changed_blocks) as block
    cross join unnest(v_affected_users) as u(user_id)
    where (block->>'chapter_id')::uuid is not null
  loop
    -- Call the existing chapter progress update function
    perform public.update_chapter_progress_for_user(
      v_user_id,
      p_published_course_id,
      v_chapter_id
    );
  end loop;

  -- ============================================================================
  -- STEP 5: Recalculate course progress for all affected users
  -- ============================================================================
  -- The chapter progress update should trigger course progress update,
  -- but we can call it explicitly to ensure consistency
  for v_user_id in
    select distinct unnest(v_affected_users)
  loop
    perform public.update_course_progress_for_user(
      v_user_id,
      p_published_course_id
    );
  end loop;

  -- ============================================================================
  -- STEP 6: Return summary statistics
  -- ============================================================================
  return query select
    v_invalidated_count,
    coalesce(v_affected_users, '{}'::uuid[]),
    coalesce(v_affected_lessons, '{}'::uuid[]),
    v_recalculated_lessons,
    v_recalculated_chapters;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.track_course_update_type()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  -- On INSERT, default to content
  if TG_OP = 'INSERT' then
    NEW.last_update_types := ARRAY['content']::public.course_update_type[];
    return NEW;
  end if;

  -- Check overview changes (metadata)
  if (NEW.name is distinct from OLD.name or
      NEW.description is distinct from OLD.description or
      NEW.image_url is distinct from OLD.image_url or
      NEW.blur_hash is distinct from OLD.blur_hash or
      NEW.category_id is distinct from OLD.category_id or
      NEW.subcategory_id is distinct from OLD.subcategory_id or
      NEW.visibility is distinct from OLD.visibility) then

    -- Increment overview version
    NEW.overview_version := OLD.overview_version + 1;

    -- Append 'overview' to last_update_types if not already present
    if NEW.last_update_types is null then
      NEW.last_update_types := ARRAY['overview']::public.course_update_type[];
    elsif not ('overview'::public.course_update_type = any(NEW.last_update_types)) then
      NEW.last_update_types := array_append(NEW.last_update_types, 'overview'::public.course_update_type);
    end if;
  end if;

  -- Content and pricing version increments are handled by child table triggers
  -- via trg_touch_course_updated_at

  return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.trg_set_updated_at_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.trg_touch_course_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  target_course_id uuid;
  update_type public.course_update_type;
begin
  -- determine course_id based on operation type
  if tg_op = 'delete' then
    target_course_id := old.course_id;
  else
    target_course_id := new.course_id;
  end if;

  -- determine the update type
  if tg_table_name = 'course_pricing_tiers' then
    update_type := 'pricing';
  else
    update_type := 'content';
  end if;

  -- update the parent course if course_id is present
  if target_course_id is not null then
    update public.courses
    set
      updated_at = timezone('utc', now()),
      content_version = case
        when tg_table_name = 'course_pricing_tiers' then content_version
        else content_version + 1
      end,
      pricing_version = case
        when tg_table_name = 'course_pricing_tiers' then pricing_version + 1
        else pricing_version
      end,
      -- append to array if not already present
      last_update_types = case
        when last_update_types is null then ARRAY[update_type]
        when update_type = any(last_update_types) then last_update_types
        else array_append(last_update_types, update_type)
      end
    where id = target_course_id;
  end if;

  -- return appropriate row based on trigger operation
  if tg_op = 'delete' then
    return old;
  else
    return new;
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.complete_block(p_published_course_id uuid, p_chapter_id uuid, p_lesson_id uuid, p_block_id uuid, p_earned_score numeric DEFAULT NULL::numeric, p_time_spent_seconds integer DEFAULT 0, p_interaction_data jsonb DEFAULT NULL::jsonb, p_last_response jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  current_user_id uuid;
  v_organization_id uuid;
  course_structure jsonb;
  block_weight numeric;
  block_content_version integer;
  block_published_at timestamptz;
  course_total_blocks integer := 0;
  course_total_lessons integer := 0;
  course_total_chapters integer := 0;
  course_total_weight numeric := 0;
  course_total_lesson_weight numeric := 0;
  chapter_total_blocks integer := 0;
  chapter_total_lessons integer := 0;
  chapter_total_weight numeric := 0;
  chapter_total_lesson_weight numeric := 0;
  lesson_total_blocks integer := 0;
  lesson_total_weight numeric := 0;
  v_course_progress_id uuid;
  v_chapter_progress_id uuid;
  v_lesson_progress_id uuid;
  v_block_progress_id uuid;
  was_already_completed boolean := false;
  existing_completed_at timestamptz;
  navigation_data jsonb;
  result jsonb;
begin
  current_user_id := auth.uid();
  if current_user_id is null then
    raise exception 'User not authenticated';
  end if;

  select 
    pcsc.course_structure_content,
    pc.organization_id
  into 
    course_structure,
    v_organization_id
  from public.published_course_structure_content pcsc
  inner join public.published_courses pc on pc.id = pcsc.id
  where pcsc.id = p_published_course_id;

  if course_structure is null then
    raise exception 'Course structure not found for published_course_id: %', p_published_course_id;
  end if;

  select
    coalesce((block_obj->>'weight')::numeric, 1.0),
    coalesce((block_obj->>'content_version')::integer, 1),
    coalesce((block_obj->>'published_at')::timestamptz, timezone('utc', now()))
  into
    block_weight,
    block_content_version,
    block_published_at
  from jsonb_path_query(
    course_structure,
    '$.chapters[*].lessons[*].blocks[*] ? (@.id == $block_id)',
    jsonb_build_object('block_id', p_block_id::text)
  ) as block_obj
  limit 1;

  if block_weight is null then
    raise exception 'Block weight not found in structure for block_id: %', p_block_id;
  end if;

  with course_blocks as (
    select 
      (chapter_obj->>'id')::uuid as chapter_id,
      (lesson_obj->>'id')::uuid as lesson_id,
      (block_obj->>'id')::uuid as block_id,
      coalesce((block_obj->>'weight')::numeric, 1.0) as weight
    from jsonb_array_elements(course_structure->'chapters') as chapter_obj,
         jsonb_array_elements(chapter_obj->'lessons') as lesson_obj,
         jsonb_array_elements(lesson_obj->'blocks') as block_obj
  ),
  lesson_weights as (
    select lesson_id, sum(weight) as lesson_weight
    from course_blocks
    group by lesson_id
  )
  select 
    count(distinct cb.block_id),
    count(distinct cb.lesson_id),
    count(distinct cb.chapter_id),
    sum(cb.weight),
    sum(lw.lesson_weight)
  into 
    course_total_blocks,
    course_total_lessons,
    course_total_chapters,
    course_total_weight,
    course_total_lesson_weight
  from course_blocks cb
  inner join lesson_weights lw on lw.lesson_id = cb.lesson_id;

  with chapter_blocks as (
    select 
      (lesson_obj->>'id')::uuid as lesson_id,
      (block_obj->>'id')::uuid as block_id,
      coalesce((block_obj->>'weight')::numeric, 1.0) as weight
    from jsonb_path_query(
      course_structure,
      '$.chapters[*] ? (@.id == $chapter_id)',
      jsonb_build_object('chapter_id', p_chapter_id::text)
    ) as chapter_obj,
    jsonb_array_elements(chapter_obj->'lessons') as lesson_obj,
    jsonb_array_elements(lesson_obj->'blocks') as block_obj
  ),
  chapter_lesson_weights as (
    select lesson_id, sum(weight) as lesson_weight
    from chapter_blocks
    group by lesson_id
  )
  select 
    count(distinct cb.block_id),
    count(distinct cb.lesson_id),
    sum(cb.weight),
    sum(clw.lesson_weight)
  into 
    chapter_total_blocks,
    chapter_total_lessons,
    chapter_total_weight,
    chapter_total_lesson_weight
  from chapter_blocks cb
  inner join chapter_lesson_weights clw on clw.lesson_id = cb.lesson_id;

  select 
    count(*),
    sum(coalesce((block_obj->>'weight')::numeric, 1.0))
  into 
    lesson_total_blocks,
    lesson_total_weight
  from jsonb_path_query(
    course_structure,
    '$.chapters[*].lessons[*] ? (@.id == $lesson_id)',
    jsonb_build_object('lesson_id', p_lesson_id::text)
  ) as lesson_obj,
  jsonb_array_elements(lesson_obj->'blocks') as block_obj;

  insert into public.course_progress (
    user_id,
    published_course_id,
    total_blocks,
    total_lessons,
    total_chapters,
    total_weight,
    total_lesson_weight
  ) 
  values (
    current_user_id,
    p_published_course_id,
    course_total_blocks,
    course_total_lessons,
    course_total_chapters,
    course_total_weight,
    course_total_lesson_weight
  )
  on conflict (user_id, published_course_id)
  do update set
    total_blocks = excluded.total_blocks,
    total_lessons = excluded.total_lessons,
    total_chapters = excluded.total_chapters,
    total_weight = excluded.total_weight,
    total_lesson_weight = excluded.total_lesson_weight,
    updated_at = timezone('utc', now())
  returning id into v_course_progress_id;

  insert into public.chapter_progress (
    course_progress_id,
    user_id,
    published_course_id,
    chapter_id,
    total_blocks,
    total_lessons,
    total_weight,
    total_lesson_weight
  )
  values (
    v_course_progress_id,
    current_user_id,
    p_published_course_id,
    p_chapter_id,
    chapter_total_blocks,
    chapter_total_lessons,
    chapter_total_weight,
    chapter_total_lesson_weight
  )
  on conflict (user_id, published_course_id, chapter_id)
  do update set
    course_progress_id = excluded.course_progress_id,
    total_blocks = excluded.total_blocks,
    total_lessons = excluded.total_lessons,
    total_weight = excluded.total_weight,
    total_lesson_weight = excluded.total_lesson_weight,
    updated_at = timezone('utc', now())
  returning id into v_chapter_progress_id;

  insert into public.lesson_progress (
    chapter_progress_id,
    user_id,
    published_course_id,
    lesson_id,
    total_blocks,
    total_weight
  )
  values (
    v_chapter_progress_id,
    current_user_id,
    p_published_course_id,
    p_lesson_id,
    lesson_total_blocks,
    lesson_total_weight
  )
  on conflict (user_id, published_course_id, lesson_id)
  do update set
    chapter_progress_id = excluded.chapter_progress_id,
    total_blocks = excluded.total_blocks,
    total_weight = excluded.total_weight,
    updated_at = timezone('utc', now())
  returning id into v_lesson_progress_id;

  select is_completed, completed_at
  into was_already_completed, existing_completed_at
  from public.block_progress
  where user_id = current_user_id
    and published_course_id = p_published_course_id
    and block_id = p_block_id;

  if was_already_completed is null then
    was_already_completed := false;
  end if;

  insert into public.block_progress (
    lesson_progress_id,
    organization_id,
    published_course_id,
    chapter_id,
    lesson_id,
    block_id,
    block_weight,
    is_completed,
    completed_at,
    time_spent_seconds,
    earned_score,
    attempt_count,
    interaction_data,
    last_response,
    block_content_version,
    block_published_at,
    user_id
  )
  values (
    v_lesson_progress_id,
    v_organization_id,
    p_published_course_id,
    p_chapter_id,
    p_lesson_id,
    p_block_id,
    block_weight,
    true,
    timezone('utc', now()),
    p_time_spent_seconds,
    p_earned_score,
    1,
    p_interaction_data,
    p_last_response,
    block_content_version,
    block_published_at,
    current_user_id
  )
  on conflict (user_id, published_course_id, block_id)
  do update set
    lesson_progress_id = excluded.lesson_progress_id,
    block_weight = excluded.block_weight,
    block_content_version = excluded.block_content_version,
    block_published_at = excluded.block_published_at,
    is_completed = true,
    completed_at = coalesce(block_progress.completed_at, timezone('utc', now())),
    time_spent_seconds = block_progress.time_spent_seconds + excluded.time_spent_seconds,
    earned_score = coalesce(excluded.earned_score, block_progress.earned_score),
    attempt_count = coalesce(block_progress.attempt_count, 0) + 1,
    interaction_data = coalesce(excluded.interaction_data, block_progress.interaction_data),
    last_response = coalesce(excluded.last_response, block_progress.last_response),
    updated_at = timezone('utc', now())
  returning id into v_block_progress_id;

  if not was_already_completed then
    perform public.update_lesson_progress_for_user(current_user_id, p_published_course_id, p_lesson_id);
    perform public.update_chapter_progress_for_user(current_user_id, p_published_course_id, p_chapter_id, v_course_progress_id);
    perform public.update_course_progress_for_user(current_user_id, p_published_course_id);
  end if;

  begin
    select public.get_unified_navigation(
      current_user_id,
      p_published_course_id,
      p_block_id,
      p_lesson_id,
      p_chapter_id
    ) into navigation_data;
  exception
    when others then
      navigation_data := jsonb_build_object('error', 'Navigation data unavailable');
  end;

  result := jsonb_build_object(
    'success', true,
    'user_id', current_user_id,
    'published_course_id', p_published_course_id,
    'chapter_id', p_chapter_id,
    'lesson_id', p_lesson_id,
    'block_id', p_block_id,
    'course_progress_id', v_course_progress_id,
    'chapter_progress_id', v_chapter_progress_id,
    'lesson_progress_id', v_lesson_progress_id,
    'block_progress_id', v_block_progress_id,
    'was_already_completed', was_already_completed,
    'block_weight', block_weight,
    'earned_score', p_earned_score,
    'time_spent_seconds', p_time_spent_seconds,
    'completed_at', date_trunc('second', timezone('utc', coalesce(existing_completed_at, now())))::timestamptz,
    'navigation', navigation_data
  );

  return result;

exception
  when others then
    return jsonb_build_object(
      'success', false,
      'error', sqlerrm,
      'error_detail', sqlstate
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
  -- STEP 10: Reset last_update_types on draft course after publishing
  -------------------------------------------------------------------
  update public.courses
  set last_update_types = null
  where id = course_uuid;

  -------------------------------------------------------------------
  -- STEP 11: Return success with detailed storage information
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
$function$
;

CREATE TRIGGER trg_increment_chapter_version BEFORE UPDATE ON public.chapters FOR EACH ROW EXECUTE FUNCTION public.increment_chapter_version();

CREATE TRIGGER trg_touch_course_on_chapter_update AFTER INSERT OR DELETE OR UPDATE ON public.chapters FOR EACH ROW EXECUTE FUNCTION public.trg_touch_course_updated_at();

CREATE TRIGGER trg_increment_pricing_tier_version BEFORE UPDATE ON public.course_pricing_tiers FOR EACH ROW EXECUTE FUNCTION public.increment_pricing_tier_version();

CREATE TRIGGER trg_touch_course_on_course_pricing_tiers_update AFTER INSERT OR DELETE OR UPDATE ON public.course_pricing_tiers FOR EACH ROW EXECUTE FUNCTION public.trg_touch_course_updated_at();

CREATE TRIGGER trg_courses_set_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.trg_set_updated_at_timestamp();

CREATE TRIGGER trg_track_course_update_type BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.track_course_update_type();

CREATE TRIGGER trg_increment_lesson_block_version BEFORE UPDATE ON public.lesson_blocks FOR EACH ROW EXECUTE FUNCTION public.increment_lesson_block_version();

CREATE TRIGGER trg_touch_course_on_lesson_block_update AFTER INSERT OR DELETE OR UPDATE ON public.lesson_blocks FOR EACH ROW EXECUTE FUNCTION public.trg_touch_course_updated_at();

CREATE TRIGGER trg_increment_lesson_version BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.increment_lesson_version();

CREATE TRIGGER trg_touch_course_on_lesson_update AFTER INSERT OR DELETE OR UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.trg_touch_course_updated_at();


