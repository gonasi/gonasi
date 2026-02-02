-- ====================================================================================
-- Table: public.lessons
-- ====================================================================================
-- Stores lessons linked to chapters within courses.
-- Each lesson has:
--   - A unique ID
--   - Associations to course, chapter, and lesson type
--   - Metadata such as name and position within the chapter
--   - Audit fields for tracking creation and updates
--   - Lesson-specific settings stored as JSONB
create table public.lessons (
  id uuid primary key default uuid_generate_v4(),                -- Unique lesson identifier
  course_id uuid not null,                                       -- FK: associated course
  organization_id uuid not null,                                 -- FK: associated organization
  chapter_id uuid not null,                                      -- FK: associated chapter
  lesson_type_id uuid not null,                                  -- FK: lesson type
  name text not null,                                            -- Lesson title
  position integer default 0,                                    -- Position/order within the chapter
  settings jsonb default '{}'::jsonb not null,                   -- JSONB field for lesson-specific settings
  created_at timestamptz not null default timezone('utc', now()),-- Timestamp when lesson was created (UTC)
  updated_at timestamptz not null default timezone('utc', now()),-- Timestamp of last update (UTC)
  content_version integer not null default 1,                    -- Increments when lesson content/settings change
  created_by uuid,                                               -- FK: user who created (nullable on delete)
  updated_by uuid,                                               -- FK: user who last updated (nullable on delete)

  -- Foreign key constraints
  foreign key (organization_id) references public.organizations(id) on delete cascade,
  foreign key (course_id) references public.courses(id) on delete cascade,
  foreign key (chapter_id) references public.chapters(id) on delete cascade,
  foreign key (lesson_type_id) references public.lesson_types(id) on delete set null,
  foreign key (created_by) references public.profiles(id) on delete set null,
  foreign key (updated_by) references public.profiles(id) on delete set null
);


-- ====================================================================================
-- Indexes
-- ====================================================================================
-- Unique constraint to ensure no duplicate lesson positions within the same chapter
create unique index unique_lesson_position_per_chapter
  on public.lessons (chapter_id, position);

-- Additional indexes to optimize common query filters
create index idx_lessons_course_id        on public.lessons(course_id);
create index idx_lessons_chapter_id       on public.lessons(chapter_id);
create index idx_lessons_lesson_type_id   on public.lessons(lesson_type_id);
create index idx_lessons_created_by       on public.lessons(created_by);
create index idx_lessons_updated_by       on public.lessons(updated_by);
create index idx_lessons_position         on public.lessons(position);
create index idx_lessons_organization_id  on public.lessons(organization_id);
create index idx_lessons_content_version  on public.lessons(content_version);

-- ====================================================================================
-- Table Comment
-- ====================================================================================
comment on table public.lessons is 'Stores all lessons associated with chapters within a course';

-- ====================================================================================
-- Trigger: Auto-set Lesson Position
-- ====================================================================================
-- Before inserting a new lesson, if position is not provided or zero,
-- automatically assign the next available position within the CHAPTER (not course).
-- Fixed to align with unique constraint scope.
create or replace function public.set_lesson_position()
returns trigger
as $$
begin
  if new.position is null or new.position = 0 then
    select coalesce(max(position), 0) + 1
    into new.position
    from public.lessons
    where chapter_id = new.chapter_id;  -- Fixed: changed from course_id to chapter_id
  end if;
  return new;
end;
$$
language plpgsql
set search_path = '';

create trigger trg_set_lesson_position
before insert on public.lessons
for each row
execute function set_lesson_position();


-- ====================================================================================
-- Enable Row-Level Security on lessons table
-- ====================================================================================
alter table public.lessons enable row level security;

-- ====================================================================================
-- SELECT: Allow org members with any role in the course's org to view lessons
-- ====================================================================================
create policy "select: org members can view lessons"
on public.lessons
for select
to authenticated
using (
  public.can_user_edit_course(lessons.course_id)
);

-- ====================================================================================
-- INSERT: Allow owner/admin to insert into any course; editors only if they own it
-- ====================================================================================
create policy "insert: can_user_edit_course allows adding lessons"
on public.lessons
for insert
to authenticated
with check (
  public.can_user_edit_course(lessons.course_id)
);

-- ====================================================================================
-- UPDATE: Same rule as insert — use can_user_edit_course
-- ====================================================================================
create policy "update: can_user_edit_course allows updating lessons"
on public.lessons
for update
to authenticated
using (
  public.can_user_edit_course(lessons.course_id)
)
with check (
  public.can_user_edit_course(lessons.course_id)
);

-- ====================================================================================
-- DELETE: Same rule — use can_user_edit_course
-- ====================================================================================
create policy "delete: can_user_edit_course allows deleting lessons"
on public.lessons
for delete
to authenticated
using (
  public.can_user_edit_course(lessons.course_id)
);
