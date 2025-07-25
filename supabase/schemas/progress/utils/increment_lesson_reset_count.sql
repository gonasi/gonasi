-- ====================================================================================
-- TRIGGER FUNCTION: Update lesson reset count when lesson progress is deleted
-- DESCRIPTION: Automatically increments the reset count when a lesson_progress 
--              record is deleted (indicating a lesson reset)
-- ====================================================================================
create or replace function public.increment_lesson_reset_count()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Insert or update the reset count for this user-course-lesson combination
  insert into public.lesson_reset_count (
    user_id,
    published_course_id,
    lesson_id,
    reset_count
  )
  values (
    OLD.user_id,
    OLD.published_course_id,
    OLD.lesson_id,
    1
  )
  on conflict (user_id, published_course_id, lesson_id)
  do update set
    reset_count = lesson_reset_count.reset_count + 1,
    updated_at = timezone('utc', now());

  return OLD;
end;
$$;
