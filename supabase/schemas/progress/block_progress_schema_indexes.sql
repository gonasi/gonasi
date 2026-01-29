-- ====================================================================================
-- TABLE: block_progress (Updated with weight support and cascading relationships)
-- DESCRIPTION: Tracks per-user progress for individual blocks in lessons of a course.
--              A block is considered completed if a row exists. Now supports weighted progress.
-- ====================================================================================
create table public.block_progress (
  id uuid primary key default uuid_generate_v4(),

  -- Cascading relationship to lesson_progress
  lesson_progress_id uuid not null references public.lesson_progress(id) on delete cascade,

  -- foreign keys and contextual metadata
  organization_id uuid not null references public.organizations(id) on delete cascade,
  published_course_id uuid not null references public.published_courses(id) on delete cascade,
  chapter_id uuid not null, -- snapshot-based chapter reference
  lesson_id uuid not null,  -- snapshot-based lesson reference
  block_id uuid not null,   -- snapshot-based block reference

  -- weight information (stored from course structure at completion time)
  block_weight numeric not null default 1.0, -- weight of this block for progress calculation

  -- interaction state
  is_completed boolean not null default false,
  started_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz not null default timezone('utc', now()),
  time_spent_seconds integer not null default 0,

  -- progress percentage (binary: 0% or 100% based on completion)
  progress_percentage numeric generated always as (
    case 
      when is_completed = true then 100
      else 0
    end
  ) stored,

  -- only applicable to interactive/scorable blocks (e.g. quizzes, coding tasks)
  earned_score numeric, -- null for non-scorable blocks like rich text
  attempt_count integer, -- null for non-attemptable blocks
  interaction_data jsonb, -- stores user input: selected answers, steps taken, etc.
  last_response jsonb,    -- optional snapshot of last full submission

  -- version tracking (for detecting stale progress when block content changes)
  block_content_version integer, -- version of block when it was completed
  block_published_at timestamptz, -- when the block was published (for change detection)

  -- auditing
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  -- enforce uniqueness: only one record per user per published block
  unique (user_id, published_course_id, block_id),
  unique (lesson_progress_id, block_id)
);


-- ------------------------------------------------------------------------------------
-- Indexes for performance (deduplicated)
-- ------------------------------------------------------------------------------------
-- Quickly find all progress records by user (e.g. for dashboards, analytics)
create index idx_block_progress_user
  on public.block_progress(user_id);

-- For fetching progress in a specific course (e.g. course-level dashboards)
create index idx_block_progress_published_course
  on public.block_progress(published_course_id);

-- For querying lesson-specific progress (e.g. lesson completion)
create index idx_block_progress_lesson
  on public.block_progress(lesson_id);

-- For filtering/sorting progress by completion time (e.g. latest completions)
create index idx_block_progress_completed_at
  on public.block_progress(completed_at);

-- For multi-tenant access control or usage reporting by organization
create index idx_block_progress_organization
  on public.block_progress(organization_id);

-- Composite index to efficiently find which blocks a user has completed in a course
create index idx_block_progress_user_course_completed
  on public.block_progress(user_id, published_course_id)
  where is_completed = true;

-- Composite index to support fast visibility/progress checks per block
create index idx_block_progress_user_block
  on public.block_progress(user_id, block_id);

-- Index for detecting version mismatches (stale progress after block content changes)
create index idx_block_progress_version_mismatch
  on public.block_progress(published_course_id, block_id, block_content_version);

-- New index for weight-based calculations
create index idx_block_progress_lesson_weight
  on public.block_progress(lesson_id, block_weight);

-- Index for the new cascading relationship
create index idx_block_progress_lesson_progress
  on public.block_progress(lesson_progress_id);

-- ------------------------------------------------------------------------------------
-- Trigger to automatically update the updated_at timestamp on any row update
-- ------------------------------------------------------------------------------------
create trigger trg_block_progress_set_updated_at
before update on public.block_progress
for each row
execute function public.update_updated_at_column();