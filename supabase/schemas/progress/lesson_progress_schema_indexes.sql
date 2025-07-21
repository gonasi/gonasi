-- ====================================================================================
-- TABLE: lesson_progress (Updated with weight support)
-- DESCRIPTION: Tracks per-user progress within lessons of a published course.
--              Progress is tied to the published course snapshot and now uses weighted calculations.
-- ====================================================================================
create table public.lesson_progress (
  id uuid primary key default uuid_generate_v4(),

  user_id uuid not null references public.profiles(id) on delete cascade,
  published_course_id uuid not null references public.published_courses(id) on delete cascade,
  lesson_id uuid not null, -- references snapshot data, not live lesson table

  -- Block counts (kept for backward compatibility and simple metrics)
  total_blocks integer not null,
  completed_blocks integer not null default 0,

  -- Weight-based progress tracking
  total_weight numeric not null default 0,
  completed_weight numeric not null default 0,
  progress_percentage numeric generated always as (
    case 
      when total_weight > 0 then (completed_weight / total_weight * 100)
      else 0
    end
  ) stored,

  completed_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),

  unique (user_id, published_course_id, lesson_id)
);

-- Indexes for performance
create index idx_lesson_progress_user on public.lesson_progress(user_id);
create index idx_lesson_progress_course on public.lesson_progress(published_course_id);
create index idx_lesson_progress_lesson on public.lesson_progress(lesson_id);
create index idx_lesson_progress_completed_at on public.lesson_progress(completed_at);
create index idx_lesson_progress_percentage on public.lesson_progress(progress_percentage);

-- Automatically update `updated_at` timestamp
create trigger trg_lesson_progress_set_updated_at
before update on public.lesson_progress
for each row
execute function public.update_updated_at_column();