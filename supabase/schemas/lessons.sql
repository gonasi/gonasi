-- ====================================================================================
-- TABLE: lessons
-- ====================================================================================
-- Stores lesson entries linked to a chapter within a course. Each lesson has a type,
-- position, metadata, and audit trail (created/updated by).
create table public.lessons (
  id uuid primary key default uuid_generate_v4(),              -- Unique lesson ID
  course_id uuid not null,                                     -- FK: Related course
  chapter_id uuid not null,                                    -- FK: Related chapter
  lesson_type_id uuid not null,                                -- FK: Type of lesson
  name text not null,                                          -- Lesson title
  position integer default 0,                                  -- Position in chapter
  created_at timestamptz not null default current_timestamp,   -- Creation timestamp
  updated_at timestamptz not null default current_timestamp,   -- Last updated timestamp
  created_by uuid not null,                                    -- FK: Creator user ID
  updated_by uuid not null,                                    -- FK: Last updater user ID
  metadata jsonb default '{}'::jsonb not null,                 -- Arbitrary metadata
  settings jsonb default '{}'::jsonb not null,                 -- Lesson-specific settings

  -- Foreign key constraints
  foreign key (course_id) references public.courses(id) on delete cascade,
  foreign key (chapter_id) references public.chapters(id) on delete cascade,
  foreign key (lesson_type_id) references public.lesson_types(id) on delete set null,
  foreign key (created_by) references public.profiles(id) on delete restrict,
  foreign key (updated_by) references public.profiles(id) on delete restrict
);

-- ====================================================================================
-- INDEXES
-- ====================================================================================
-- Ensures that lesson positions are unique within each chapter
create unique index unique_lesson_position_per_chapter
  on public.lessons (chapter_id, position);

-- Supporting indexes for fast lookups
create index idx_lessons_course_id       on public.lessons(course_id);
create index idx_lessons_chapter_id      on public.lessons(chapter_id);
create index idx_lessons_lesson_type_id  on public.lessons(lesson_type_id);
create index idx_lessons_created_by      on public.lessons(created_by);
create index idx_lessons_updated_by      on public.lessons(updated_by);
create index idx_lessons_position        on public.lessons(position);

-- ====================================================================================
-- COMMENTS
-- ====================================================================================
comment on table public.lessons is 'Stores all lessons for chapters within a course';

-- ====================================================================================
-- TRIGGERS
-- ====================================================================================
-- Automatically update `updated_at` on any modification
create trigger trg_lessons_set_updated_at 
before update on public.lessons
for each row
execute function update_updated_at_column();

-- ====================================================================================
-- ROW-LEVEL SECURITY (RLS)
-- ====================================================================================
alter table public.lessons enable row level security;

-- Insert: Only allow if the user is the creator
create policy lesson_insert_by_creator on public.lessons
  for insert
  with check ((select auth.uid()) = created_by);

-- Update: Only allow if the user is the creator
create policy lesson_update_by_creator on public.lessons
  for update 
  using ((select auth.uid()) = created_by)
  with check ((select auth.uid()) = created_by);

-- Delete: Only allow if the user is the creator
create policy lesson_delete_by_creator on public.lessons
  for delete
  using ((select auth.uid()) = created_by);

-- Select: Only allow if the user is the creator
create policy lesson_select_by_creator on public.lessons
  for select
  using ((select auth.uid()) = created_by);

-- ====================================================================================
-- FUNCTION: reorder_lessons
-- ====================================================================================
-- Reorders lessons in a chapter using a provided JSONB array.
-- Temporarily offsets all positions to prevent unique constraint violations,
-- then reassigns new positions.
create or replace function public.reorder_lessons(lessons jsonb)
returns void
language plpgsql
security definer
set search_path = ''  -- prevent search_path-based privilege escalation
as $$
declare
  target_chapter_id uuid;
begin
  -- Extract chapter_id from the first item in the array
  target_chapter_id := (lessons->0->>'chapter_id')::uuid;

  -- Temporarily offset existing lesson positions to avoid unique constraint conflicts
  update public.lessons
  set position = position + 1000000
  where chapter_id = target_chapter_id;

  -- Update positions based on the input array
  update public.lessons as l
  set 
    position = new_data.position,
    updated_by = new_data.updated_by,
    updated_at = timezone('utc', now())
  from (
    select 
      (elem->>'id')::uuid as id,
      (elem->>'position')::int as position,
      (elem->>'updated_by')::uuid as updated_by
    from jsonb_array_elements(lessons) as elem
  ) as new_data
  where l.id = new_data.id;
end;
$$;
