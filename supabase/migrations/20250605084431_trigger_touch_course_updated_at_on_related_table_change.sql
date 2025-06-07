-- ========================================
-- function: trg_set_updated_at_timestamp
-- sets the updated_at timestamp on the courses table (before update)
-- avoids recursion by only modifying the new row
-- ========================================
create or replace function public.trg_set_updated_at_timestamp()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ========================================
-- function: trg_touch_course_updated_at
-- updates the parent course's updated_at when chapters or lessons are inserted, updated, or deleted
-- ========================================
create or replace function public.trg_touch_course_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target_course_id uuid;
begin
  if tg_op = 'delete' then
    -- use old row to get course_id on delete
    target_course_id := old.course_id;
  else
    -- use new row to get course_id on insert/update
    target_course_id := new.course_id;
  end if;

  -- update parent course if course_id is available
  if target_course_id is not null then
    update public.courses
    set updated_at = timezone('utc', now())
    where id = target_course_id;
  end if;

  -- return appropriate row
  if tg_op = 'delete' then
    return old;
  else
    return new;
  end if;
end;
$$;

-- ========================================
-- triggers: apply triggers to relevant tables
-- ========================================

-- drop existing triggers if present
drop trigger if exists trg_touch_course_on_course_update on public.courses;
drop trigger if exists trg_courses_set_updated_at on public.courses;
drop trigger if exists trg_touch_course_on_chapter_update on public.chapters;
drop trigger if exists trg_touch_course_on_lesson_update on public.lessons;

-- trigger: set updated_at on course row before update
create trigger trg_courses_set_updated_at
before update on public.courses
for each row
execute function public.trg_set_updated_at_timestamp();

-- trigger: update parent course's updated_at on chapter change
create trigger trg_touch_course_on_chapter_update
after insert or update or delete on public.chapters
for each row
execute function public.trg_touch_course_updated_at();

-- trigger: update parent course's updated_at on lesson change
create trigger trg_touch_course_on_lesson_update
after insert or update or delete on public.lessons
for each row
execute function public.trg_touch_course_updated_at();
