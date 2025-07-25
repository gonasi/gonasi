-- ====================================================================================
-- TABLE: lesson_reset_count
-- DESCRIPTION: Tracks how many times a user has reset a specific lesson in a 
--              published course. This supports analytics and behavior nudges.
--              References published (snapshotted) course content.
-- ====================================================================================
create table public.lesson_reset_count (
  id uuid primary key default uuid_generate_v4(),

  user_id uuid not null references public.profiles(id) on delete cascade,
  published_course_id uuid not null references public.published_courses(id) on delete cascade,
  lesson_id uuid not null, -- references snapshot lesson data, not the live lessons table

  reset_count integer not null default 0,

  updated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),

  -- Ensure one record per user-course-lesson combination
  unique (user_id, published_course_id, lesson_id)
);

-- Indexes for fast lookups by user, course, and lesson
create index idx_lesson_reset_user_id on public.lesson_reset_count(user_id);
create index idx_lesson_reset_course_id on public.lesson_reset_count(published_course_id);
create index idx_lesson_reset_lesson_id on public.lesson_reset_count(lesson_id);

-- ====================================================================================
-- TRIGGER: Automatically update `updated_at` timestamp on row changes
-- ====================================================================================
create trigger trg_lesson_reset_set_updated_at
before update on public.lesson_reset_count
for each row
execute function public.update_updated_at_column();


create trigger trg_increment_lesson_reset_count
after delete on public.lesson_progress
for each row
execute function public.increment_lesson_reset_count();