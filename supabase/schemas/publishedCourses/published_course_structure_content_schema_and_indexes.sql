-- ====================================================================================
-- TABLE: published_course_structure_content
-- Purpose:
--   Separates heavy structure JSONB from the published_courses table for easier RLS,
--   better I/O performance, and cleaner privilege management.
-- ====================================================================================
create table public.published_course_structure_content (
  -- Primary key and 1:1 relation to published_courses
  id uuid primary key references public.published_courses(id) on delete cascade,

  -- Full nested structure content
  course_structure_content jsonb not null,

  -- Audit timestamps
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Index for efficient jsonb querying
create index idx_course_structure_content_gin
  on public.published_course_structure_content
  using gin (course_structure_content jsonb_path_ops);

-- Trigger to update `updated_at` on changes
create trigger trg_course_structure_content_updated_at
  before update on public.published_course_structure_content
  for each row
  execute function public.update_updated_at_column();
