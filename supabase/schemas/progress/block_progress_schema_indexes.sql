-- ====================================================================================
-- TABLE: block_progress
-- DESCRIPTION: Tracks per-user progress for individual blocks in lessons of a course.
--              A block is considered completed if a row exists.
-- ====================================================================================
create table public.block_progress (
  id uuid primary key default uuid_generate_v4(),

  user_id uuid not null references public.profiles(id) on delete cascade,
  published_course_id uuid not null references public.published_courses(id) on delete cascade,
  lesson_id uuid not null, -- snapshot-based lesson reference
  block_id uuid not null,  -- snapshot-based block reference

  weight numeric(5,2) not null, -- denormalized for analytics/rollups

  is_completed boolean not null default true,
  completed_at timestamptz not null default timezone('utc', now()),

  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  unique (user_id, published_course_id, block_id)
);

-- Indexes for performance (deduplicated)
create index idx_block_progress_user
  on public.block_progress(user_id);

create index idx_block_progress_course
  on public.block_progress(published_course_id);

create index idx_block_progress_lesson
  on public.block_progress(lesson_id);

create index idx_block_progress_completed_at
  on public.block_progress(completed_at);

-- Automatically update updated_at timestamp
create trigger trg_block_progress_set_updated_at
before update on public.block_progress
for each row
execute function public.update_updated_at_column();
