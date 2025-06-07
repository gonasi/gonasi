-- ====================================================================================
-- table: lessons
-- ====================================================================================
-- stores lesson entries linked to chapters within courses.
-- each lesson has a type, position, metadata, and audit information.
create table public.lessons (
  id uuid primary key default uuid_generate_v4(),              -- unique lesson id
  course_id uuid not null,                                      -- fk: related course
  chapter_id uuid not null,                                     -- fk: related chapter
  lesson_type_id uuid not null,                                 -- fk: lesson type
  name text not null,                                           -- lesson title
  position integer default 0,                                   -- position within chapter
  created_at timestamptz not null default timezone('utc', now()), -- creation timestamp
  updated_at timestamptz not null default timezone('utc', now()), -- last update timestamp
  created_by uuid not null,                                     -- fk: creator user id
  updated_by uuid not null,                                     -- fk: last updater user id
  settings jsonb default '{}'::jsonb not null,                  -- lesson-specific settings

  -- foreign key constraints
  foreign key (course_id) references public.courses(id) on delete cascade,
  foreign key (chapter_id) references public.chapters(id) on delete cascade,
  foreign key (lesson_type_id) references public.lesson_types(id) on delete set null,
  foreign key (created_by) references public.profiles(id) on delete restrict,
  foreign key (updated_by) references public.profiles(id) on delete restrict
);

-- ====================================================================================
-- indexes
-- ====================================================================================
-- ensure unique lesson positions per chapter
create unique index unique_lesson_position_per_chapter
  on public.lessons (chapter_id, position);

-- supporting indexes for performance optimization
create index idx_lessons_course_id       on public.lessons(course_id);
create index idx_lessons_chapter_id      on public.lessons(chapter_id);
create index idx_lessons_lesson_type_id  on public.lessons(lesson_type_id);
create index idx_lessons_created_by      on public.lessons(created_by);
create index idx_lessons_updated_by      on public.lessons(updated_by);
create index idx_lessons_position        on public.lessons(position);

-- ====================================================================================
-- comments
-- ====================================================================================
comment on table public.lessons is 'stores all lessons for chapters within a course';

-- ====================================================================================
-- row-level security (rls)
-- ====================================================================================
alter table public.lessons enable row level security;

-- ====================================================================================
-- rls policies for public.lessons
-- ====================================================================================
-- permissions based on course roles and ownership
-- roles: admin, editor, viewer

-- select: allow users with course roles or owners to view lessons
create policy "select: users with course roles (admin/editor/viewer) or owners can view lessons"
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

-- insert: allow users with admin/editor roles or owners to add lessons
create policy "insert: users with course roles (admin/editor/viewer) or owners can add lessons"
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

-- update: allow users with admin/editor roles or owners to modify lessons
create policy "update: users with admin/editor roles or owners can modify lessons"
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

-- delete: allow admins, editors, and owners to remove lessons
create policy "delete: course admins, editors, and owners can remove lessons"
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

-- ====================================================================================
-- function: reorder_lessons
-- ====================================================================================
-- reorders lessons within a chapter based on a provided jsonb array.
-- first offsets positions to avoid unique constraint conflicts,
-- then updates positions according to the new order.
create or replace function public.reorder_lessons(lessons jsonb)
returns void
language plpgsql
security definer
set search_path = ''  -- prevent search_path based privilege escalation
as $$
declare
  target_chapter_id uuid;
begin
  -- extract chapter_id from the first element in the jsonb array
  target_chapter_id := (lessons->0->>'chapter_id')::uuid;

  -- temporarily offset existing positions to avoid unique constraint violations
  update public.lessons
  set position = position + 1000000
  where chapter_id = target_chapter_id;

  -- update lesson positions based on provided array
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
