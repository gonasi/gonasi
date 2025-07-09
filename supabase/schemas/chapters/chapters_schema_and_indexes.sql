-- ====================================================================================
-- chapters table
-- ====================================================================================

create table public.chapters (
  id uuid primary key default uuid_generate_v4(),                    -- unique identifier for the chapter
  organization_id uuid not null,                                     -- fk: references owning organization
  course_id uuid not null,                                           -- fk: references parent course
  name text not null,                                                -- chapter name/title
  description text,                                                  -- optional chapter description
  position integer default 0,                                        -- chapter order in course
  created_at timestamptz not null default timezone('utc', now()),    -- timestamp of creation
  updated_at timestamptz not null default timezone('utc', now()),    -- timestamp of last update
  created_by uuid not null,                                          -- fk: user who created the chapter
  updated_by uuid not null,                                          -- fk: user who last updated the chapter

  -- foreign key constraints
  foreign key (organization_id) references public.organizations(id) on delete cascade,
  foreign key (course_id) references public.courses(id) on delete cascade,
  foreign key (created_by) references public.profiles(id) on delete cascade,
  foreign key (updated_by) references public.profiles(id) on delete cascade,

  -- unique constraint to prevent duplicate position within a course
  constraint unique_chapter_position_per_course unique (course_id, position)
);

-- ====================================================================================
-- indexes
-- ====================================================================================

create index idx_chapters_organization_id on public.chapters (organization_id);
create index idx_chapters_course_id on public.chapters (course_id);
create index idx_chapters_created_by on public.chapters (created_by); 
create index idx_chapters_updated_by on public.chapters (updated_by);
create index idx_chapters_position on public.chapters (course_id, position);
