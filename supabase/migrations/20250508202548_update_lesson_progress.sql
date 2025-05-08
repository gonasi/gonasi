-- ===========================
-- Migration: Add course_id to lesson_progress
-- ===========================

-- 1. Add course_id column to lesson_progress
alter table public.lesson_progress 
add column course_id uuid;

-- 2. Update existing lesson_progress records with course_id values
update public.lesson_progress lp
set course_id = lessons.course_id
from public.lessons
where lp.lesson_id = lessons.id;

-- 3. Make course_id not null after populating data
alter table public.lesson_progress 
alter column course_id set not null;

-- 4. Add foreign key constraint
alter table public.lesson_progress
add constraint fk_lesson_progress_course
foreign key (course_id) references public.courses(id) on delete cascade;

-- 5. Add index on course_id
create index idx_lesson_progress_course on public.lesson_progress(course_id);

-- 6. Add index on user_id + course_id
create index idx_lesson_progress_user_course on public.lesson_progress(user_id, course_id);

-- 7. Update trigger function to use course_id directly from lesson_progress
create or replace function public.trigger_chapter_progress_on_lesson_update()
returns trigger as $$
declare
  v_chapter_id uuid;
begin
  -- Get the chapter ID for this lesson
  select chapter_id into v_chapter_id
  from public.lessons
  where id = coalesce(new.lesson_id, old.lesson_id);
  
  -- Update chapter progress
  perform public.update_chapter_progress(
    coalesce(new.user_id, old.user_id),
    v_chapter_id
  );
  
  return null;
end;
$$ language plpgsql;

-- 8. Modify update_chapter_progress to use direct course_id when available
create or replace function public.update_chapter_progress(p_user_id uuid, p_chapter_id uuid)
returns void as $$
declare
  v_course_id uuid;
  v_total_lessons integer;
  v_completed_lessons integer;
  v_progress_percentage numeric;
  v_weighted_score_sum numeric;
  v_score_weight_sum numeric;
  v_total_time_spent integer;
begin
  -- Get the course_id for this chapter
  select course_id into v_course_id
  from public.chapters
  where id = p_chapter_id;
  
  -- Count total lessons in the chapter
  select count(*) into v_total_lessons
  from public.lessons
  where chapter_id = p_chapter_id;
  
  -- Count completed lessons
  select count(*) into v_completed_lessons
  from public.lesson_progress
  where user_id = p_user_id
    and is_complete = true
    and lesson_id in (select id from public.lessons where chapter_id = p_chapter_id);
  
  -- Calculate progress percentage
  if v_total_lessons = 0 then
    v_progress_percentage := 0;
  else
    v_progress_percentage := (v_completed_lessons::numeric / v_total_lessons::numeric) * 100;
  end if;
  
  -- Calculate weighted average score
  select 
    sum(lp.weighted_average_score * lessons.position) filter (where lp.weighted_average_score is not null),
    sum(lessons.position) filter (where lp.weighted_average_score is not null)
  into v_weighted_score_sum, v_score_weight_sum
  from public.lesson_progress lp
  join public.lessons on lessons.id = lp.lesson_id
  where lp.user_id = p_user_id
    and lessons.chapter_id = p_chapter_id;
  
  -- Calculate total time spent
  select coalesce(sum(total_time_spent_seconds), 0) into v_total_time_spent
  from public.lesson_progress
  where user_id = p_user_id
    and lesson_id in (select id from public.lessons where chapter_id = p_chapter_id);
  
  -- Upsert chapter progress
  insert into public.chapter_progress (
    user_id,
    chapter_id,
    course_id,
    progress_percentage,
    weighted_average_score,
    total_time_spent_seconds,
    is_complete,
    completed_lessons_count,
    total_lessons_count
  ) values (
    p_user_id,
    p_chapter_id,
    v_course_id,
    v_progress_percentage,
    case when v_score_weight_sum > 0 then (v_weighted_score_sum / v_score_weight_sum) else null end,
    v_total_time_spent,
    v_progress_percentage = 100 and v_total_lessons > 0,
    v_completed_lessons,
    v_total_lessons
  )
  on conflict (user_id, chapter_id) do update set
    progress_percentage = excluded.progress_percentage,
    weighted_average_score = excluded.weighted_average_score,
    total_time_spent_seconds = excluded.total_time_spent_seconds,
    is_complete = excluded.is_complete,
    completed_lessons_count = excluded.completed_lessons_count,
    total_lessons_count = excluded.total_lessons_count,
    updated_at = current_timestamp;
    
  -- Update course progress
  perform public.update_course_progress(p_user_id, v_course_id);
end;
$$ language plpgsql security definer;

-- 9. Modify update_course_progress to use direct joins when possible
create or replace function public.update_course_progress(p_user_id uuid, p_course_id uuid)
returns void as $$
declare
  v_total_chapters integer;
  v_completed_chapters integer;
  v_total_lessons integer;
  v_completed_lessons integer;
  v_progress_percentage numeric;
  v_weighted_score_sum numeric;
  v_score_weight_sum numeric;
  v_total_time_spent integer;
begin
  -- Count total chapters in the course
  select count(*) into v_total_chapters
  from public.chapters
  where course_id = p_course_id;
  
  -- Count completed chapters
  select count(*) into v_completed_chapters
  from public.chapter_progress
  where user_id = p_user_id
    and course_id = p_course_id
    and is_complete = true;
  
  -- Count total lessons in the course
  select count(*) into v_total_lessons
  from public.lessons
  where course_id = p_course_id;
  
  -- Count completed lessons (now using course_id directly from lesson_progress)
  select count(*) into v_completed_lessons
  from public.lesson_progress
  where user_id = p_user_id
    and course_id = p_course_id
    and is_complete = true;
  
  -- Calculate progress percentage
  if v_total_lessons = 0 then
    v_progress_percentage := 0;
  else
    v_progress_percentage := (v_completed_lessons::numeric / v_total_lessons::numeric) * 100;
  end if;
  
  -- Calculate weighted average score
  select 
    sum(cp.weighted_average_score * ch.position) filter (where cp.weighted_average_score is not null),
    sum(ch.position) filter (where cp.weighted_average_score is not null)
  into v_weighted_score_sum, v_score_weight_sum
  from public.chapter_progress cp
  join public.chapters ch on ch.id = cp.chapter_id
  where cp.user_id = p_user_id
    and cp.course_id = p_course_id;
  
  -- Calculate total time spent (now using course_id directly)
  select coalesce(sum(total_time_spent_seconds), 0) into v_total_time_spent
  from public.lesson_progress
  where user_id = p_user_id
    and course_id = p_course_id;
  
  -- Upsert course progress
  insert into public.course_progress (
    user_id,
    course_id,
    progress_percentage,
    weighted_average_score,
    total_time_spent_seconds,
    is_complete,
    completed_chapters_count,
    total_chapters_count,
    completed_lessons_count,
    total_lessons_count
  ) values (
    p_user_id,
    p_course_id,
    v_progress_percentage,
    case when v_score_weight_sum > 0 then (v_weighted_score_sum / v_score_weight_sum) else null end,
    v_total_time_spent,
    v_progress_percentage = 100 and v_total_lessons > 0,
    v_completed_chapters,
    v_total_chapters,
    v_completed_lessons,
    v_total_lessons
  )
  on conflict (user_id, course_id) do update set
    progress_percentage = excluded.progress_percentage,
    weighted_average_score = excluded.weighted_average_score,
    total_time_spent_seconds = excluded.total_time_spent_seconds,
    is_complete = excluded.is_complete,
    completed_chapters_count = excluded.completed_chapters_count,
    total_chapters_count = excluded.total_chapters_count,
    completed_lessons_count = excluded.completed_lessons_count,
    total_lessons_count = excluded.total_lessons_count,
    updated_at = current_timestamp;
end;
$$ language plpgsql security definer;

-- 10. Create trigger to ensure course_id is always in sync with lesson's course_id
create or replace function public.ensure_lesson_progress_course_id()
returns trigger as $$
declare
  v_course_id uuid;
begin
  -- Only run this check if course_id isn't set or is being changed
  if (TG_OP = 'INSERT' AND NEW.course_id IS NULL) OR 
     (TG_OP = 'UPDATE' AND OLD.lesson_id != NEW.lesson_id) THEN
    -- Get the course_id for this lesson
    select course_id into v_course_id
    from public.lessons
    where id = NEW.lesson_id;
    
    -- Set the course_id
    NEW.course_id := v_course_id;
  end if;
  
  return NEW;
end;
$$ language plpgsql;

create trigger trg_ensure_lesson_progress_course_id
before insert or update on public.lesson_progress
for each row
execute function public.ensure_lesson_progress_course_id();

-- 11. Update get_course_completion_status to use more direct joins when possible
create or replace function public.get_course_completion_status(p_user_id uuid, p_course_id uuid)
returns jsonb as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'course_id', cp.course_id,
    'progress_percentage', cp.progress_percentage,
    'is_complete', cp.is_complete,
    'completed_chapters_count', cp.completed_chapters_count,
    'total_chapters_count', cp.total_chapters_count,
    'completed_lessons_count', cp.completed_lessons_count,
    'total_lessons_count', cp.total_lessons_count,
    'total_time_spent_seconds', cp.total_time_spent_seconds,
    'weighted_average_score', cp.weighted_average_score,
    'chapters', (
      select jsonb_agg(
        jsonb_build_object(
          'chapter_id', chp.chapter_id,
          'progress_percentage', chp.progress_percentage,
          'is_complete', chp.is_complete,
          'completed_lessons_count', chp.completed_lessons_count,
          'total_lessons_count', chp.total_lessons_count
        )
      )
      from public.chapter_progress chp
      where chp.user_id = p_user_id and chp.course_id = p_course_id
    )
  ) into result
  from public.course_progress cp
  where cp.user_id = p_user_id and cp.course_id = p_course_id;
  
  return coalesce(result, '{}'::jsonb);
end;
$$ language plpgsql;

-- 12. Update recalculate_all_course_progress to use more direct joins
create or replace function public.recalculate_all_course_progress(p_user_id uuid)
returns void as $$
declare
  chapter_row record;
  course_row record;
begin
  -- First update chapter progress for all chapters the user has interaction with
  for chapter_row in
    select distinct c.id as chapter_id
    from public.lessons l
    join public.lesson_progress lp on lp.lesson_id = l.id
    join public.chapters c on c.id = l.chapter_id
    where lp.user_id = p_user_id
  loop
    perform public.update_chapter_progress(p_user_id, chapter_row.chapter_id);
  end loop;
  
  -- Then update course progress for all courses the user has interaction with
  -- Now using direct course_id from lesson_progress
  for course_row in
    select distinct course_id
    from public.lesson_progress
    where user_id = p_user_id
  loop
    perform public.update_course_progress(p_user_id, course_row.course_id);
  end loop;
end;
$$ language plpgsql security definer;