-- ========================================
-- function: trg_set_updated_at_timestamp
-- purpose: sets the updated_at timestamp on the courses table before update
-- note: avoids recursion by only modifying the NEW row
-- ========================================
create or replace function public.trg_set_updated_at_timestamp()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

-- ========================================
-- function: trg_touch_course_updated_at
-- purpose: updates the parent course's updated_at field when a chapter,
--          lesson, or lesson_block is inserted, updated, or deleted
-- ========================================
create or replace function public.trg_touch_course_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target_course_id uuid;
begin
  -- determine course_id based on operation type
  if tg_op = 'delete' then
    target_course_id := old.course_id;
  else
    target_course_id := new.course_id;
  end if;

  -- update the parent course if course_id is present
  if target_course_id is not null then
    update public.courses
    set updated_at = timezone('utc', now())
    where id = target_course_id;
  end if;

  -- return appropriate row based on trigger operation
  if tg_op = 'delete' then
    return old;
  else
    return new;
  end if;
end;
$$;

-- ========================================
-- triggers: attach the triggers to relevant tables
-- ========================================

-- update updated_at timestamp on courses table before any update
create trigger trg_courses_set_updated_at
before update on public.courses
for each row
execute function public.trg_set_updated_at_timestamp();

-- update parent course's updated_at when chapters change
create trigger trg_touch_course_on_chapter_update
after insert or update or delete on public.chapters
for each row
execute function public.trg_touch_course_updated_at();

-- update parent course's updated_at when lessons change
create trigger trg_touch_course_on_lesson_update
after insert or update or delete on public.lessons
for each row
execute function public.trg_touch_course_updated_at();

-- update parent course's updated_at when lesson_blocks change
create trigger trg_touch_course_on_lesson_block_update
after insert or update or delete on public.lesson_blocks
for each row
execute function public.trg_touch_course_updated_at();
