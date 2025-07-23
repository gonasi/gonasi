-- ====================================================================================
-- table: lesson_blocks
-- description: blocks within lessons supporting various plugin types, ordered by position
-- ====================================================================================
create table public.lesson_blocks (
  id uuid primary key default uuid_generate_v4(),                  -- Unique block identifier
  lesson_id uuid not null,                                        -- FK: associated lesson
  course_id uuid not null,                                        -- Redundant but useful for filtering
  chapter_id uuid not null,                                       -- Redundant but useful for filtering
  organization_id uuid not null,                                  -- Redundant but useful for RLS
  plugin_type text not null,                                      -- Plugin type (e.g. rich_text, match, reveal)
  position integer not null default 0,                            -- Order within the lesson
  content jsonb not null default '{}'::jsonb,                     -- Plugin-specific content config
  settings jsonb not null default '{}'::jsonb,                    -- Additional plugin settings
  created_at timestamptz not null default timezone('utc', now()), -- Creation timestamp (UTC)
  updated_at timestamptz not null default timezone('utc', now()), -- Last update timestamp (UTC)
  created_by uuid,                                                -- FK: user who created (nullable on delete)
  updated_by uuid,                                                -- FK: user who last updated (nullable on delete)

  -- Foreign key constraints
  foreign key (lesson_id) references public.lessons(id) on delete cascade,
  foreign key (course_id) references public.courses(id) on delete cascade,
  foreign key (chapter_id) references public.chapters(id) on delete cascade,
  foreign key (organization_id) references public.organizations(id) on delete cascade,
  foreign key (created_by) references public.profiles(id) on delete set null,
  foreign key (updated_by) references public.profiles(id) on delete set null
);

-- ====================================================================================
-- indexes
-- ====================================================================================

-- Foreign key indexes
create index idx_lesson_blocks_lesson_id on public.lesson_blocks(lesson_id);
create index idx_lesson_blocks_course_id on public.lesson_blocks(course_id);
create index idx_lesson_blocks_chapter_id on public.lesson_blocks(chapter_id);
create index idx_lesson_blocks_organization_id on public.lesson_blocks(organization_id);
create index idx_lesson_blocks_created_by on public.lesson_blocks(created_by);
create index idx_lesson_blocks_updated_by on public.lesson_blocks(updated_by);

-- Sorting / position index
create index idx_lesson_blocks_position on public.lesson_blocks(position);

-- Uniqueness constraint to prevent duplicate positions within a lesson
create unique index unique_lesson_block_position_per_lesson
  on public.lesson_blocks (lesson_id, position);
