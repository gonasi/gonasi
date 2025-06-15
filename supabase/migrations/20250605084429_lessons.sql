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
  course_id uuid not null,                                        -- Foreign key: associated course
  chapter_id uuid not null,                                       -- Foreign key: associated chapter
  lesson_type_id uuid not null,                                    -- Foreign key: lesson type
  name text not null,                                             -- Lesson title
  position integer default 0,                                     -- Position/order within the chapter
  created_at timestamptz not null default timezone('utc', now()),-- Timestamp when lesson was created (UTC)
  updated_at timestamptz not null default timezone('utc', now()),-- Timestamp of last update (UTC)
  created_by uuid not null,                                       -- Foreign key: user who created the lesson
  updated_by uuid not null,                                       -- Foreign key: user who last updated the lesson
  settings jsonb default '{}'::jsonb not null,                   -- JSONB field for lesson-specific settings

  -- Foreign key constraints enforcing relational integrity
  foreign key (course_id) references public.courses(id) on delete cascade,
  foreign key (chapter_id) references public.chapters(id) on delete cascade,
  foreign key (lesson_type_id) references public.lesson_types(id) on delete set null,
  foreign key (created_by) references public.profiles(id) on delete restrict,
  foreign key (updated_by) references public.profiles(id) on delete restrict
);

-- ====================================================================================
-- Indexes
-- ====================================================================================
-- Unique constraint to ensure no duplicate lesson positions within the same chapter
create unique index unique_lesson_position_per_chapter
  on public.lessons (chapter_id, position);

-- Additional indexes to optimize common query filters
create index idx_lessons_course_id       on public.lessons(course_id);
create index idx_lessons_chapter_id      on public.lessons(chapter_id);
create index idx_lessons_lesson_type_id  on public.lessons(lesson_type_id);
create index idx_lessons_created_by      on public.lessons(created_by);
create index idx_lessons_updated_by      on public.lessons(updated_by);
create index idx_lessons_position        on public.lessons(position);

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
-- Row-Level Security (RLS)
-- ====================================================================================
alter table public.lessons enable row level security;

-- ====================================================================================
-- RLS Policies for public.lessons
-- ====================================================================================
-- Define access controls based on user roles within the related course.
-- Roles considered: admin, editor, viewer
-- Owners of the course also have relevant permissions.

-- SELECT: Allow viewing lessons for users with any course role or course owner
create policy "select: users with course roles or owners can view lessons"
on public.lessons
for select
to authenticated
using (
  exists (
    select 1 from public.courses c
    where c.id = lessons.course_id
      and (
        is_course_admin(c.id, (select auth.uid())) or
        is_course_editor(c.id, (select auth.uid())) or
        is_course_viewer(c.id, (select auth.uid())) or
        c.created_by = (select auth.uid())
      )
  )
);

-- INSERT: Allow adding lessons for admins, editors, or course owners
create policy "insert: admins, editors, or owners can add lessons"
on public.lessons
for insert
to authenticated
with check (
  exists (
    select 1 from public.courses c
    where c.id = lessons.course_id
      and (
        is_course_admin(c.id, (select auth.uid())) or
        is_course_editor(c.id, (select auth.uid())) or
        c.created_by = (select auth.uid())
      )
  )
);

-- UPDATE: Allow modifying lessons for admins, editors, or owners
create policy "update: admins, editors, or owners can modify lessons"
on public.lessons
for update
to authenticated
using (
  exists (
    select 1 from public.courses c
    where c.id = lessons.course_id
      and (
        is_course_admin(c.id, (select auth.uid())) or
        is_course_editor(c.id, (select auth.uid())) or
        c.created_by = (select auth.uid())
      )
  )
)
with check (
  exists (
    select 1 from public.courses c
    where c.id = lessons.course_id
      and (
        is_course_admin(c.id, (select auth.uid())) or
        is_course_editor(c.id, (select auth.uid())) or
        c.created_by = (select auth.uid())
      )
  )
);

-- DELETE: Allow removal of lessons by admins, editors, or owners
create policy "delete: admins, editors, or owners can remove lessons"
on public.lessons
for delete
to authenticated
using (
  exists (
    select 1 from public.courses c
    where c.id = lessons.course_id
      and (
        is_course_admin(c.id, (select auth.uid())) or
        is_course_editor(c.id, (select auth.uid())) or
        c.created_by = (select auth.uid())
      )
  )
);
