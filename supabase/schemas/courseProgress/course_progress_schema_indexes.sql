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

-- Ensure fast lookups for a user's progress in a course
create unique index idx_course_progress_user_course
  on public.course_progress(user_id, published_course_id);

-- Fast lookup by course (e.g. analytics per course)
create index idx_course_progress_course
  on public.course_progress(published_course_id);

-- Fast lookup by user (e.g. dashboard, filtering by user)
create index idx_course_progress_user
  on public.course_progress(user_id);

-- Queries that filter by completion status (optional, only if you filter on it)
create index idx_course_progress_completed_at
  on public.course_progress(completed_at);