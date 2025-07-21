-- ====================================================================================
-- function: update_progress_cascade_on_block_change (updated with weight support)
-- description: handles cascading updates when block progress changes
--              updates lesson_progress, course_progress with weight-based calculations
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
    -- 1. update lesson progress with weight calculations
    -- =================================================================================
    
    -- get lesson totals from structure and calculate completed weights from progress
    with lesson_structure_info as (
      select 
        jsonb_array_length(lesson_obj->'blocks') as total_blocks,
        coalesce(
          (select sum(coalesce((block_obj->>'weight')::numeric, 1.0))
           from jsonb_array_elements(lesson_obj->'blocks') as block_obj),
          0
        ) as total_weight
      from jsonb_path_query(
        course_structure,
        '$.chapters[*].lessons[*] ? (@.id == $lesson_id)',
        jsonb_build_object('lesson_id', new.lesson_id::text)
      ) as lesson_obj
      limit 1
    ),
    lesson_completed_info as (
      select 
        count(*) as completed_count,
        coalesce(sum(bp.block_weight), 0) as completed_weight
      from public.block_progress bp
      where bp.user_id = new.user_id 
        and bp.published_course_id = new.published_course_id
        and bp.lesson_id = new.lesson_id
        and bp.is_completed = true
    )
    select 
      lsi.total_blocks,
      lci.completed_count,
      lsi.total_weight,
      lci.completed_weight
    into 
      lesson_total_blocks, 
      lesson_completed_blocks,
      lesson_total_weight,
      lesson_completed_weight
    from lesson_structure_info lsi
    cross join lesson_completed_info lci;
    
    -- lesson is completed when all weight is achieved (with small tolerance for floating point)
    lesson_is_completed := (
      lesson_total_weight > 0 and 
      abs(lesson_completed_weight - lesson_total_weight) < 0.0001
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
        when abs(excluded.completed_weight - lesson_progress.total_weight) < 0.0001
          and lesson_progress.total_weight > 0
          and lesson_progress.completed_at is null 
        then timezone('utc', now())
        when abs(excluded.completed_weight - lesson_progress.total_weight) >= 0.0001
        then null
        else lesson_progress.completed_at
      end,
      updated_at = timezone('utc', now());
    
    -- =================================================================================
    -- 2. update course progress with weight calculations
    -- =================================================================================
    
    -- calculate course-wide progress from structure and actual progress data
    with course_structure_stats as (
      -- get totals from the course structure
      select 
        coalesce(
          (select sum(jsonb_array_length(lesson_obj->'blocks'))
            from jsonb_path_query(course_structure, '$.chapters[*].lessons[*]') as lesson_obj), 
          0
        ) as total_blocks_in_structure,
        coalesce(
          (select count(*)
            from jsonb_path_query(course_structure, '$.chapters[*].lessons[*]') as lesson_obj), 
          0
        ) as total_lessons_in_structure,
        coalesce(jsonb_array_length(course_structure->'chapters'), 0) as total_chapters_in_structure,
        -- calculate total weight across all blocks
        coalesce(
          (select sum(coalesce((block_obj->>'weight')::numeric, 1.0))
            from jsonb_path_query(course_structure, '$.chapters[*].lessons[*].blocks[*]') as block_obj),
          0
        ) as total_weight_in_structure,
        -- calculate total lesson weights (sum of each lesson's total weight)
        coalesce(
          (select sum(
            coalesce(
              (select sum(coalesce((block_obj->>'weight')::numeric, 1.0))
               from jsonb_array_elements(lesson_obj->'blocks') as block_obj),
              0
            )
          )
           from jsonb_path_query(course_structure, '$.chapters[*].lessons[*]') as lesson_obj),
          0
        ) as total_lesson_weight_in_structure
    ),
    user_progress_stats as (
      -- get actual completion counts and weights from progress tables
      select 
        count(*) filter (where bp.is_completed = true) as completed_blocks_by_user,
        coalesce(sum(bp.block_weight) filter (where bp.is_completed = true), 0) as completed_weight_by_user,
        count(distinct lp.lesson_id) filter (where lp.completed_at is not null) as completed_lessons_by_user,
        coalesce(sum(lp.total_weight) filter (where lp.completed_at is not null), 0) as completed_lesson_weight_by_user
      from public.block_progress bp
      left join public.lesson_progress lp on (
        lp.user_id = bp.user_id 
        and lp.published_course_id = bp.published_course_id 
        and lp.lesson_id = bp.lesson_id
        and lp.completed_at is not null
      )
      where bp.user_id = new.user_id 
        and bp.published_course_id = new.published_course_id
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
      ups.completed_lessons_by_user,
      css.total_chapters_in_structure,
      ccs.completed_chapters_by_user,
      css.total_weight_in_structure,
      ups.completed_weight_by_user,
      css.total_lesson_weight_in_structure,
      ups.completed_lesson_weight_by_user
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
    cross join chapter_completion_stats ccs;
    
    -- course is completed when all weights are achieved
    course_is_completed := (
      course_total_weight > 0 and 
      abs(course_completed_weight - course_total_weight) < 0.0001 and
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
        when abs(excluded.completed_weight - course_progress.total_weight) < 0.0001
          and course_progress.total_weight > 0
          and excluded.completed_lessons >= course_progress.total_lessons
          and excluded.completed_chapters >= course_progress.total_chapters
          and course_progress.completed_at is null
        then timezone('utc', now())
        when not (
          abs(excluded.completed_weight - course_progress.total_weight) < 0.0001
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

-- =================================================================================
-- trigger: apply cascading updates on block progress changes
-- =================================================================================
drop trigger if exists trg_block_progress_cascade_update on public.block_progress;

create trigger trg_block_progress_cascade_update
  after insert or update on public.block_progress
  for each row
  execute function public.update_progress_cascade_on_block_change();