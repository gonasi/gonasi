-- ====================================================================================
-- TABLE: block_progress
-- DESCRIPTION: Tracks per-user progress for individual blocks in lessons of a course.
--              A block is considered completed if a row exists.
-- ====================================================================================
create table public.block_progress (
  id uuid primary key default uuid_generate_v4(),

  -- Foreign keys and contextual metadata
  organization_id uuid not null references public.organizations(id) on delete cascade,
  published_course_id uuid not null references public.published_courses(id) on delete cascade,
  chapter_id uuid not null, -- snapshot-based chapter reference
  lesson_id uuid not null,  -- snapshot-based lesson reference
  block_id uuid not null,   -- snapshot-based block reference

  -- Interaction state
  is_completed boolean not null default false,
  started_at timestamptz,
  completed_at timestamptz,
  time_spent_seconds integer,

  score numeric,
  attempts integer default 0,
  state jsonb,
  last_response jsonb,
  feedback text,
  plugin_type text,

  -- Auditing
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  -- Uniqueness (1 record per user per published block)
  unique (user_id, published_course_id, block_id)
);

-- ------------------------------------------------------------------------------------
-- Indexes for performance (deduplicated)
-- ------------------------------------------------------------------------------------
create index idx_block_progress_user
  on public.block_progress(user_id);

create index idx_block_progress_course
  on public.block_progress(published_course_id);

create index idx_block_progress_lesson
  on public.block_progress(lesson_id);

create index idx_block_progress_completed_at
  on public.block_progress(completed_at);

-- New index to improve query performance on organization-related queries
create index idx_block_progress_organization_id
  on public.block_progress(organization_id);

-- ------------------------------------------------------------------------------------
-- Trigger to automatically update the updated_at timestamp on any row update
-- ------------------------------------------------------------------------------------
create trigger trg_block_progress_set_updated_at
before update on public.block_progress
for each row
execute function public.update_updated_at_column();
