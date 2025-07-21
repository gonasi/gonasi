-- ====================================================================================
-- function: update_progress_cascade_on_block_change (fixed)
-- description: handles cascading updates when block progress changes
--              updates lesson_progress, course_progress, and determines next ids
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
  lesson_is_completed boolean;
  
  -- course progress calculations
  course_total_blocks integer;
  course_completed_blocks integer;
  course_total_lessons integer;
  course_completed_lessons integer;
  course_total_chapters integer;
  course_completed_chapters integer;
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
    -- 1. update lesson progress
    -- =================================================================================
    
    -- get lesson total blocks from structure and count completed blocks from progress
    with lesson_info as (
      select jsonb_array_length(lesson_obj->'blocks') as total_blocks
      from jsonb_path_query(
        course_structure,
        '$.chapters[*].lessons[*] ? (@.id == $lesson_id)',
        jsonb_build_object('lesson_id', new.lesson_id::text)
      ) as lesson_obj
      limit 1
    ),
    completed_info as (
      select count(*) as completed_count
      from public.block_progress bp
      where bp.user_id = new.user_id 
        and bp.published_course_id = new.published_course_id
        and bp.lesson_id = new.lesson_id
        and bp.is_completed = true
    )
    select 
      lesson_info.total_blocks,
      completed_info.completed_count
    into lesson_total_blocks, lesson_completed_blocks
    from lesson_info
    cross join completed_info;
    
    lesson_is_completed := (lesson_completed_blocks >= lesson_total_blocks);
    
    -- upsert lesson progress
    insert into public.lesson_progress (
      user_id, 
      published_course_id, 
      lesson_id,
      total_blocks,
      completed_blocks,
      completed_at
    )
    values (
      new.user_id,
      new.published_course_id,
      new.lesson_id,
      lesson_total_blocks,
      lesson_completed_blocks,
      case when lesson_is_completed then timezone('utc', now()) else null end
    )
    on conflict (user_id, published_course_id, lesson_id)
    do update set
      completed_blocks = excluded.completed_blocks,
      completed_at = case 
        when excluded.completed_blocks >= lesson_progress.total_blocks 
          and lesson_progress.completed_at is null 
        then timezone('utc', now())
        when excluded.completed_blocks < lesson_progress.total_blocks
        then null
        else lesson_progress.completed_at
      end,
      updated_at = timezone('utc', now());
    
    -- =================================================================================
    -- 2. update course progress
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
        coalesce(jsonb_array_length(course_structure->'chapters'), 0) as total_chapters_in_structure
    ),
    user_progress_stats as (
      -- get actual completion counts from progress tables
      select 
        count(*) filter (where bp.is_completed = true) as completed_blocks_by_user,
        count(distinct lp.lesson_id) filter (where lp.completed_at is not null) as completed_lessons_by_user
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
      ccs.completed_chapters_by_user
    into 
      course_total_blocks,
      course_completed_blocks,
      course_total_lessons,
      course_completed_lessons,
      course_total_chapters,
      course_completed_chapters
    from course_structure_stats css
    cross join user_progress_stats ups
    cross join chapter_completion_stats ccs;
    
    course_is_completed := (
      course_completed_blocks >= course_total_blocks and
      course_completed_lessons >= course_total_lessons and
      course_completed_chapters >= course_total_chapters and
      course_total_blocks > 0 and
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
      case when course_is_completed then timezone('utc', now()) else null end
    )
    on conflict (user_id, published_course_id)
    do update set
      completed_blocks = excluded.completed_blocks,
      completed_lessons = excluded.completed_lessons,
      completed_chapters = excluded.completed_chapters,
      completed_at = case 
        when excluded.completed_blocks >= course_progress.total_blocks 
          and excluded.completed_lessons >= course_progress.total_lessons
          and excluded.completed_chapters >= course_progress.total_chapters
          and course_progress.completed_at is null
          and excluded.completed_blocks > 0
        then timezone('utc', now())
        when not (excluded.completed_blocks >= course_progress.total_blocks 
          and excluded.completed_lessons >= course_progress.total_lessons
          and excluded.completed_chapters >= course_progress.total_chapters)
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