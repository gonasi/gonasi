-- ====================================================================================
-- table: lesson_blocks
-- description: blocks within lessons supporting various plugin types, ordered by position
-- ====================================================================================
create table public.lesson_blocks (
  id uuid primary key default uuid_generate_v4(),                -- unique block identifier
  course_id uuid not null,                                        -- associated course
  lesson_id uuid not null,                                        -- associated lesson
  plugin_type text not null,                                      -- plugin type (e.g. rich_text, match, reveal)
  position integer not null default 0,                            -- order within the lesson
  content jsonb not null default '{}'::jsonb,                    -- plugin-specific configuration
  settings jsonb not null default '{}'::jsonb,                   -- additional plugin settings
  created_at timestamptz not null default timezone('utc', now()),-- creation timestamp (utc)
  updated_at timestamptz not null default timezone('utc', now()),-- last update timestamp (utc)
  created_by uuid not null,                                       -- user who created this block
  updated_by uuid not null,                                       -- user who last updated this block

  -- foreign key constraints
  foreign key (course_id) references public.courses(id) on delete cascade,
  foreign key (lesson_id) references public.lessons(id) on delete cascade,
  foreign key (created_by) references public.profiles(id) on delete restrict,
  foreign key (updated_by) references public.profiles(id) on delete restrict
);

-- ====================================================================================
-- indexes
-- ====================================================================================

-- index foreign keys for faster joins and lookups
create index idx_lesson_blocks_course_id on public.lesson_blocks(course_id);
create index idx_lesson_blocks_lesson_id on public.lesson_blocks(lesson_id);
create index idx_lesson_blocks_created_by on public.lesson_blocks(created_by);
create index idx_lesson_blocks_updated_by on public.lesson_blocks(updated_by);

-- index position column to optimize sorting by position
create index idx_lesson_blocks_position on public.lesson_blocks(position);

-- enforce unique position per lesson to prevent ordering conflicts
create unique index unique_lesson_block_position_per_lesson
  on public.lesson_blocks (lesson_id, position);

-- ====================================================================================
-- comments
-- ====================================================================================
comment on table public.lesson_blocks is
  'blocks within a lesson, ordered by position, supporting various plugin types';