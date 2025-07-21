-- ====================================================================================
-- TABLE: course_progress (Updated with weight support)
-- DESCRIPTION: Tracks per-user progress in published courses.
--              Includes completion counters, timestamps, and weight-based progress.
-- ====================================================================================
create table public.course_progress (
  id uuid primary key default uuid_generate_v4(),

  user_id uuid not null references public.profiles(id) on delete cascade,
  published_course_id uuid not null references public.published_courses(id) on delete cascade,

  -- Block counts (kept for backward compatibility and simple metrics)
  total_blocks integer not null,
  completed_blocks integer not null default 0,

  -- Lesson counts
  total_lessons integer not null,
  completed_lessons integer not null default 0,

  -- Chapter counts
  total_chapters integer not null,
  completed_chapters integer not null default 0,

  -- Weight-based progress tracking
  total_weight numeric not null default 0,
  completed_weight numeric not null default 0,
  progress_percentage numeric generated always as (
    case 
      when total_weight > 0 then (completed_weight / total_weight * 100)
      else 0
    end
  ) stored,

  -- Lesson weight totals (for calculating lesson-based progress percentage)
  total_lesson_weight numeric not null default 0,
  completed_lesson_weight numeric not null default 0,
  lesson_progress_percentage numeric generated always as (
    case 
      when total_lesson_weight > 0 then (completed_lesson_weight / total_lesson_weight * 100)
      else 0
    end
  ) stored,

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

create index idx_course_progress_percentage
  on public.course_progress(progress_percentage);

create index idx_course_progress_lesson_percentage
  on public.course_progress(lesson_progress_percentage);

-- Automatically update `updated_at` timestamp
create trigger trg_course_progress_set_updated_at
before update on public.course_progress
for each row
execute function public.update_updated_at_column();