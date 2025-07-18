-- ====================================================================================
-- TABLE: course_progress
-- DESCRIPTION: Tracks per-user progress in published courses.
--              Includes completion counters and timestamps.
-- ====================================================================================
create table public.course_progress (
  id uuid primary key default uuid_generate_v4(),

  user_id uuid not null references public.profiles(id) on delete cascade,
  published_course_id uuid not null references public.published_courses(id) on delete cascade,

  total_blocks integer not null,
  completed_blocks integer not null default 0,

  total_lessons integer not null,
  completed_lessons integer not null default 0,

  total_chapters integer not null,
  completed_chapters integer not null default 0,

  completed_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),

  unique (user_id, published_course_id)
);

-- Indexes for performance

create index idx_course_progress_course
  on public.course_progress(published_course_id);

create index idx_course_progress_user
  on public.course_progress(user_id);

create index idx_course_progress_completed_at
  on public.course_progress(completed_at);

-- Automatically update `updated_at` timestamp
create trigger trg_course_progress_set_updated_at
before update on public.course_progress
for each row
execute function public.update_updated_at_column();
