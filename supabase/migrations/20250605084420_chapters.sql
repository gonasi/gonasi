-- ====================================================================================
-- chapters table
-- ====================================================================================

create table public.chapters (
  id uuid primary key default uuid_generate_v4(),                    -- unique identifier for the chapter
  course_id uuid not null,                                           -- fk: references parent course
  name text not null,                                                -- chapter name/title
  description text,                                                  -- optional chapter description
  position integer default 0,                                        -- chapter order in course
  created_at timestamptz not null default timezone('utc', now()),    -- timestamp of creation
  updated_at timestamptz not null default timezone('utc', now()),    -- timestamp of last update
  created_by uuid not null,                                          -- fk: user who created the chapter
  updated_by uuid not null,                                          -- fk: user who last updated the chapter

  -- foreign key constraints
  foreign key (course_id) references public.courses(id) on delete cascade,
  foreign key (created_by) references public.profiles(id) on delete restrict,
  foreign key (updated_by) references public.profiles(id) on delete restrict,

  -- unique constraint to prevent duplicate position within a course
  constraint unique_chapter_position_per_course unique (course_id, position)
);

-- ====================================================================================
-- indexes
-- ====================================================================================

create index idx_chapters_course_id on public.chapters (course_id);
create index idx_chapters_created_by on public.chapters (created_by); 
create index idx_chapters_updated_by on public.chapters (updated_by);
create index idx_chapters_position on public.chapters (course_id, position);

-- ====================================================================================
-- comments
-- ====================================================================================

comment on table public.chapters is 'contains chapters associated with each course';
comment on column public.chapters.id is 'unique identifier for the chapter';
comment on column public.chapters.course_id is 'id of the parent course';
comment on column public.chapters.name is 'title of the chapter';
comment on column public.chapters.description is 'optional description of the chapter';
comment on column public.chapters.position is 'position of the chapter in the course order';
comment on column public.chapters.created_at is 'timestamp when the chapter was created';
comment on column public.chapters.updated_at is 'timestamp when the chapter was last updated';
comment on column public.chapters.created_by is 'user id of the chapter creator';
comment on column public.chapters.updated_by is 'user id of the last person who updated the chapter';

-- ====================================================================================
-- triggers
-- ====================================================================================

create or replace function public.set_chapter_position()
returns trigger
as $$
begin
  if new.position is null or new.position = 0 then
    select coalesce(max(position), 0) + 1
    into new.position
    from public.chapters
    where course_id = new.course_id;
  end if;
  return new;
end;
$$
language plpgsql
set search_path = '';

create trigger trg_set_chapter_position
before insert on public.chapters
for each row
execute function set_chapter_position();


-- ====================================================================================
-- row-level security (rls)
-- ====================================================================================

alter table public.chapters enable row level security;

-- select: allow users with course roles or ownership to view chapters
create policy "select: users with course roles or owners can view chapters"
on public.chapters
for select
to authenticated
using (
  exists (
    select 1 from public.courses c
    where c.id = chapters.course_id
      and (
        is_course_admin(c.id, (select auth.uid())) or
        is_course_editor(c.id, (select auth.uid())) or
        is_course_viewer(c.id, (select auth.uid())) or
        c.created_by = (select auth.uid())
      )
  )
);

-- insert: allow admins, editors, or owners to add chapters
create policy "insert: users with course roles or owners can add chapters"
on public.chapters
for insert
to authenticated
with check (
  exists (
    select 1 from public.courses c
    where c.id = chapters.course_id
      and (
        is_course_admin(c.id, (select auth.uid())) or
        is_course_editor(c.id, (select auth.uid())) or
        c.created_by = (select auth.uid())
      )
  )
);

-- update: allow admins, editors, or owners to modify chapters
create policy "update: users with admin/editor roles or owners can modify chapters"
on public.chapters
for update
to authenticated
using (
  exists (
    select 1 from public.courses c
    where c.id = chapters.course_id
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
    where c.id = chapters.course_id
      and (
        is_course_admin(c.id, (select auth.uid())) or
        is_course_editor(c.id, (select auth.uid())) or
        c.created_by = (select auth.uid())
      )
  )
);

-- delete: allow admins, editors, or owners to remove chapters
create policy "delete: course admins, editors, and owners can remove chapters"
on public.chapters
for delete
to authenticated
using (
  exists (
    select 1 from public.courses c
    where c.id = chapters.course_id
      and (
        is_course_admin(c.id, (select auth.uid())) or
        is_course_editor(c.id, (select auth.uid())) or
        c.created_by = (select auth.uid())
      )
  )
);
