-- ====================================================================================
-- function: update_progress_cascade_on_block_change (FIXED weight calculations)
-- description: handles cascading updates when block progress changes
--              updates lesson_progress, course_progress with weight-based calculations
--              FIXES: Uses authoritative structure weights, prevents over 100% progress
-- ====================================================================================
create or replace function public.update_progress_cascade_on_block_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  course_structure jsonb;
  
  -- lesson progress calculations
  lesson_total_blocks integer;
  lesson_completed_blocks integer;
  lesson_total_weight numeric;
  lesson_completed_weight numeric;
  lesson_is_completed boolean;
  
  -- course progress calculations
  course_total_blocks integer;
  course_completed_blocks integer;
  course_total_lessons integer;
  course_completed_lessons integer;
  course_total_chapters integer;
  course_completed_chapters integer;
  course_total_weight numeric;
  course_completed_weight numeric;
  course_total_lesson_weight numeric;
  course_completed_lesson_weight numeric;
  course_is_completed boolean;
  
begin
  -- only process if this is an insert or completion status changed
  if tg_op = 'INSERT' or 
    (tg_op = 'UPDATE' and old.is_completed is distinct from new.is_completed) then
    
    -- get the published course structure
    select course_structure_content 
    into course_structure
    from public.published_course_structure_content 
    where id = new.published_course_id;
    
    if course_structure is null then
      raise exception 'Course structure not found for published_course_id: %', new.published_course_id;
    end if;
    
    -- =================================================================================
    -- 1. update lesson progress with CORRECTED weight calculations
    -- =================================================================================
    
    -- FIXED: Use structure weights as source of truth, map to completed blocks
    with lesson_structure_blocks as (
      -- get all blocks in this lesson with their structure weights
      select 
        (block_obj->>'id')::uuid as block_id,
        coalesce((block_obj->>'weight')::numeric, 1.0) as structure_weight
      from jsonb_path_query(
        course_structure,
        '$.chapters[*].lessons[*] ? (@.id == $lesson_id)',
        jsonb_build_object('lesson_id', new.lesson_id::text)
      ) as lesson_obj,
      jsonb_array_elements(lesson_obj->'blocks') as block_obj
    ),
    lesson_totals as (
      select 
        count(*) as total_blocks,
        sum(structure_weight) as total_weight
      from lesson_structure_blocks
    ),
    lesson_completed as (
      -- FIXED: Use structure weights, not stored weights from block_progress
      select 
        count(*) as completed_count,
        coalesce(sum(lsb.structure_weight), 0) as completed_weight
      from lesson_structure_blocks lsb
      inner join public.block_progress bp on (
        bp.block_id = lsb.block_id
        and bp.user_id = new.user_id 
        and bp.published_course_id = new.published_course_id
        and bp.lesson_id = new.lesson_id
        and bp.is_completed = true
      )
    )
    select 
      lt.total_blocks,
      lc.completed_count,
      lt.total_weight,
      -- FIXED: Ensure completed weight never exceeds total weight
      least(lc.completed_weight, lt.total_weight) as completed_weight
    into 
      lesson_total_blocks, 
      lesson_completed_blocks,
      lesson_total_weight,
      lesson_completed_weight
    from lesson_totals lt
    cross join lesson_completed lc;
    
    -- lesson is completed when all weight is achieved (with tolerance for floating point)
    lesson_is_completed := (
      lesson_total_weight > 0 and 
      lesson_completed_weight >= lesson_total_weight - 0.0001
    );
    
    -- upsert lesson progress
    insert into public.lesson_progress (
      user_id, 
      published_course_id, 
      lesson_id,
      total_blocks,
      completed_blocks,
      total_weight,
      completed_weight,
      completed_at
    )
    values (
      new.user_id,
      new.published_course_id,
      new.lesson_id,
      lesson_total_blocks,
      lesson_completed_blocks,
      lesson_total_weight,
      lesson_completed_weight,
      case when lesson_is_completed then timezone('utc', now()) else null end
    )
    on conflict (user_id, published_course_id, lesson_id)
    do update set
      completed_blocks = excluded.completed_blocks,
      completed_weight = excluded.completed_weight,
      completed_at = case 
        when excluded.completed_weight >= lesson_progress.total_weight - 0.0001
          and lesson_progress.total_weight > 0
          and lesson_progress.completed_at is null 
        then timezone('utc', now())
        when excluded.completed_weight < lesson_progress.total_weight - 0.0001
        then null
        else lesson_progress.completed_at
      end,
      updated_at = timezone('utc', now());
    
    -- =================================================================================
    -- 2. update course progress with CORRECTED weight calculations
    -- =================================================================================
    
    -- FIXED: Calculate course-wide progress using structure weights consistently
    with all_structure_blocks as (
      -- get all blocks in course with their structure weights
      select 
        (chapter_obj->>'id')::uuid as chapter_id,
        (lesson_obj->>'id')::uuid as lesson_id,
        (block_obj->>'id')::uuid as block_id,
        coalesce((block_obj->>'weight')::numeric, 1.0) as structure_weight
      from jsonb_array_elements(course_structure->'chapters') as chapter_obj,
           jsonb_array_elements(chapter_obj->'lessons') as lesson_obj,
           jsonb_array_elements(lesson_obj->'blocks') as block_obj
    ),
    course_structure_stats as (
      select 
        count(*) as total_blocks_in_structure,
        count(distinct lesson_id) as total_lessons_in_structure,
        count(distinct chapter_id) as total_chapters_in_structure,
        sum(structure_weight) as total_weight_in_structure,
        -- lesson weight = sum of block weights per lesson
        sum(lesson_weight) as total_lesson_weight_in_structure
      from (
        select 
          chapter_id,
          lesson_id,
          block_id,
          structure_weight,
          sum(structure_weight) over (partition by lesson_id) as lesson_weight
        from all_structure_blocks
      ) t
    ),
    user_progress_stats as (
      -- FIXED: Use structure weights for completed blocks
      select 
        count(*) filter (where bp.is_completed = true) as completed_blocks_by_user,
        coalesce(
          sum(asb.structure_weight) filter (where bp.is_completed = true), 
          0
        ) as completed_weight_by_user
      from all_structure_blocks asb
      left join public.block_progress bp on (
        bp.block_id = asb.block_id
        and bp.user_id = new.user_id 
        and bp.published_course_id = new.published_course_id
        and bp.is_completed = true
      )
    ),
    lesson_completion_stats as (
      select 
        count(*) as completed_lessons_by_user,
        -- FIXED: completed lesson weight = sum of structure weights from completed lessons
        coalesce(
          sum(case when lp.completed_at is not null then lesson_total_weight else 0 end),
          0
        ) as completed_lesson_weight_by_user
      from (
        select 
          lesson_id,
          sum(structure_weight) as lesson_total_weight
        from all_structure_blocks
        group by lesson_id
      ) lesson_weights
      left join public.lesson_progress lp on (
        lp.user_id = new.user_id
        and lp.published_course_id = new.published_course_id
        and lp.lesson_id = lesson_weights.lesson_id
      )
    ),
    chapter_completion_stats as (
      -- count completed chapters by checking if all lessons in each chapter are completed
      select count(*) as completed_chapters_by_user
      from (
        select 
          (chapter_obj->>'id')::uuid as chapter_id,
          jsonb_array_length(chapter_obj->'lessons') as total_lessons_in_chapter,
          count(lp.id) filter (where lp.completed_at is not null) as completed_lessons_in_chapter
        from jsonb_array_elements(course_structure->'chapters') as chapter_obj
        cross join jsonb_array_elements(chapter_obj->'lessons') as lesson_obj
        left join public.lesson_progress lp on (
          lp.user_id = new.user_id
          and lp.published_course_id = new.published_course_id
          and lp.lesson_id = (lesson_obj->>'id')::uuid
          and lp.completed_at is not null
        )
        group by chapter_obj, (chapter_obj->>'id')::uuid
        having count(lp.id) filter (where lp.completed_at is not null) = jsonb_array_length(chapter_obj->'lessons')
      ) completed_chapters
    )
    select 
      css.total_blocks_in_structure,
      ups.completed_blocks_by_user,
      css.total_lessons_in_structure,
      lcs.completed_lessons_by_user,
      css.total_chapters_in_structure,
      ccs.completed_chapters_by_user,
      css.total_weight_in_structure,
      -- FIXED: Ensure completed weight never exceeds total
      least(ups.completed_weight_by_user, css.total_weight_in_structure) as completed_weight_by_user,
      css.total_lesson_weight_in_structure,
      -- FIXED: Ensure completed lesson weight never exceeds total
      least(lcs.completed_lesson_weight_by_user, css.total_lesson_weight_in_structure) as completed_lesson_weight_by_user
    into 
      course_total_blocks,
      course_completed_blocks,
      course_total_lessons,
      course_completed_lessons,
      course_total_chapters,
      course_completed_chapters,
      course_total_weight,
      course_completed_weight,
      course_total_lesson_weight,
      course_completed_lesson_weight
    from course_structure_stats css
    cross join user_progress_stats ups
    cross join lesson_completion_stats lcs
    cross join chapter_completion_stats ccs;
    
    -- course is completed when all requirements are met
    course_is_completed := (
      course_total_weight > 0 and 
      course_completed_weight >= course_total_weight - 0.0001 and
      course_completed_lessons >= course_total_lessons and
      course_completed_chapters >= course_total_chapters and
      course_total_lessons > 0 and
      course_total_chapters > 0
    );
    
    -- upsert course progress
    insert into public.course_progress (
      user_id,
      published_course_id,
      total_blocks,
      completed_blocks,
      total_lessons,
      completed_lessons,
      total_chapters,
      completed_chapters,
      total_weight,
      completed_weight,
      total_lesson_weight,
      completed_lesson_weight,
      completed_at
    )
    values (
      new.user_id,
      new.published_course_id,
      course_total_blocks,
      course_completed_blocks,
      course_total_lessons,
      course_completed_lessons,
      course_total_chapters,
      course_completed_chapters,
      course_total_weight,
      course_completed_weight,
      course_total_lesson_weight,
      course_completed_lesson_weight,
      case when course_is_completed then timezone('utc', now()) else null end
    )
    on conflict (user_id, published_course_id)
    do update set
      completed_blocks = excluded.completed_blocks,
      completed_lessons = excluded.completed_lessons,
      completed_chapters = excluded.completed_chapters,
      completed_weight = excluded.completed_weight,
      completed_lesson_weight = excluded.completed_lesson_weight,
      completed_at = case 
        when excluded.completed_weight >= course_progress.total_weight - 0.0001
          and course_progress.total_weight > 0
          and excluded.completed_lessons >= course_progress.total_lessons
          and excluded.completed_chapters >= course_progress.total_chapters
          and course_progress.completed_at is null
        then timezone('utc', now())
        when not (
          excluded.completed_weight >= course_progress.total_weight - 0.0001
          and excluded.completed_lessons >= course_progress.total_lessons
          and excluded.completed_chapters >= course_progress.total_chapters
        )
        then null
        else course_progress.completed_at
      end,
      updated_at = timezone('utc', now());
  
  end if;
  
  return coalesce(new, old);
end;
$$;