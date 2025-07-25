-- ====================================================================================
-- TABLE: chapter_progress (Updated with weight support and cascading relationships)
-- DESCRIPTION: Tracks per-user progress within chapters of a published course.
--              Progress is tied to the published course snapshot and now uses weighted calculations.
-- ====================================================================================
create table public.chapter_progress (
  id uuid primary key default uuid_generate_v4(),

  -- Cascading relationship to course_progress
  course_progress_id uuid not null references public.course_progress(id) on delete cascade,

  user_id uuid not null references public.profiles(id) on delete cascade,
  published_course_id uuid not null references public.published_courses(id) on delete cascade,
  chapter_id uuid not null, -- references snapshot data, not live chapter table

  -- Lesson counts (kept for backward compatibility and simple metrics)
  total_lessons integer not null,
  completed_lessons integer not null default 0,

  -- Block counts (kept for backward compatibility and simple metrics)
  total_blocks integer not null,
  completed_blocks integer not null default 0,

  is_completed boolean not null default false,
  
  -- Weight-based progress tracking
  total_weight numeric not null default 0,
  completed_weight numeric not null default 0,
  progress_percentage numeric generated always as (
    case 
      when total_weight > 0 then (completed_weight / total_weight * 100)
      else 0
    end
  ) stored,

  -- Lesson weight totals (for calculating lesson-based progress percentage within chapter)
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

  unique (user_id, published_course_id, chapter_id),
  unique (course_progress_id, chapter_id)
);

-- Indexes for performance
create index idx_chapter_progress_user on public.chapter_progress(user_id);
create index idx_chapter_progress_course on public.chapter_progress(published_course_id);
create index idx_chapter_progress_chapter on public.chapter_progress(chapter_id);
create index idx_chapter_progress_completed_at on public.chapter_progress(completed_at);
create index idx_chapter_progress_percentage on public.chapter_progress(progress_percentage);
create index idx_chapter_progress_lesson_percentage on public.chapter_progress(lesson_progress_percentage);
create index idx_chapter_progress_course_progress on public.chapter_progress(course_progress_id);

-- Automatically update `updated_at` timestamp
create trigger trg_chapter_progress_set_updated_at
before update on public.chapter_progress
for each row
execute function public.update_updated_at_column();