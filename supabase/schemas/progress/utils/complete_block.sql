-- ===================================================================================
-- FUNCTION: complete_block
-- DESCRIPTION:
--   Marks a course block as completed for the currently authenticated user.
--   Manages the entire progress tracking hierarchy (course -> chapter -> lesson -> block)
--   and ensures all progress records are properly created and updated.
--
-- PARAMETERS:
--   p_published_course_id  - UUID of the published course
--   p_chapter_id          - UUID of the chapter containing the block
--   p_lesson_id           - UUID of the lesson containing the block
--   p_block_id            - UUID of the block being completed
--   p_block_weight        - Optional fallback weight if not in structure
--   p_earned_score        - Optional score for interactive blocks
--   p_time_spent_seconds  - Time spent on the block (default 0)
--   p_interaction_data    - Optional interaction metadata
--   p_last_response       - Optional final user response
--
-- RETURNS:
--   JSONB with completion status, IDs, and navigation data
--
-- SECURITY:
--   Uses auth.uid() for current user, runs with invoker privileges
-- ===================================================================================
create or replace function public.complete_block(
  p_published_course_id uuid,
  p_chapter_id uuid,
  p_lesson_id uuid,
  p_block_id uuid,
  p_block_weight numeric default null,
  p_earned_score numeric default null, 
  p_time_spent_seconds integer default 0,
  p_interaction_data jsonb default null,
  p_last_response jsonb default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid;
  v_organization_id uuid;
  course_structure jsonb;
  block_weight numeric;
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

  select coalesce(
    (block_obj->>'weight')::numeric,
    p_block_weight,
    1.0
  )
  into block_weight
  from jsonb_path_query(
    course_structure,
    '$.chapters[*].lessons[*].blocks[*] ? (@.id == $block_id)',
    jsonb_build_object('block_id', p_block_id::text)
  ) as block_obj
  limit 1;

  if block_weight is null then
    block_weight := coalesce(p_block_weight, 1.0);
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
    select 
      lesson_id,
      sum(weight) as lesson_weight
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
    select 
      lesson_id,
      sum(weight) as lesson_weight
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

  -- Upsert course_progress
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

  -- Upsert chapter_progress
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

  -- Upsert lesson_progress
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

  -- Fetch block progress
  select 
    is_completed,
    completed_at
  into 
    was_already_completed,
    existing_completed_at
  from public.block_progress
  where user_id = current_user_id
    and published_course_id = p_published_course_id
    and block_id = p_block_id;

  if was_already_completed is null then
    was_already_completed := false;
  end if;

  -- Upsert block_progress
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
    current_user_id
  )
  on conflict (user_id, published_course_id, block_id)
  do update set
    lesson_progress_id = excluded.lesson_progress_id,
    block_weight = excluded.block_weight,
    is_completed = true,
    completed_at = coalesce(block_progress.completed_at, timezone('utc', now())),
    time_spent_seconds = block_progress.time_spent_seconds + excluded.time_spent_seconds,
    earned_score = coalesce(excluded.earned_score, block_progress.earned_score),
    attempt_count = coalesce(block_progress.attempt_count, 0) + 1,
    interaction_data = coalesce(excluded.interaction_data, block_progress.interaction_data),
    last_response = coalesce(excluded.last_response, block_progress.last_response),
    updated_at = timezone('utc', now())
  returning id into v_block_progress_id;

  -- Sync higher progress
  if not was_already_completed then
    perform public.update_lesson_progress_for_user(current_user_id, p_published_course_id, p_lesson_id);
    perform public.update_chapter_progress_for_user(
      current_user_id,
      p_published_course_id,
      p_chapter_id,
      v_course_progress_id -- ✅ pass it in
    );
    perform public.update_course_progress_for_user(current_user_id, p_published_course_id);
  end if;

  -- Navigation fallback
  begin
    select public.get_unified_navigation(
      current_user_id,
      p_published_course_id,
      p_chapter_id,
      p_lesson_id,
      p_block_id
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
      'error', SQLERRM,
      'error_detail', SQLSTATE
    );
end;
$$;
