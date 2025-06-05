-- ====================================================================================
-- CHAPTERS TABLE
-- ====================================================================================
create table public.chapters (
  id uuid primary key default uuid_generate_v4(),                   -- Unique identifier for the chapter
  course_id uuid not null,                                          -- FK: references parent course
  name text not null,                                               -- Chapter name/title
  description text,                                                 -- Optional chapter description
  requires_payment boolean default false,                           -- True if payment is required to access
  position integer default 0,                                       -- Chapter order in course (drag-and-drop)
  created_at timestamptz not null default timezone('utc', now()),   -- Timestamp of creation
  updated_at timestamptz not null default timezone('utc', now()),   -- Timestamp of last update
  created_by uuid not null,                                         -- FK: User who created the chapter
  updated_by uuid not null,                                         -- FK: User who last updated the chapter

  -- Foreign key constraints
  foreign key (course_id) references public.courses(id) on delete cascade,
  foreign key (created_by) references public.profiles(id) on delete restrict,
  foreign key (updated_by) references public.profiles(id) on delete restrict,

  -- Unique constraint to avoid duplicate position per course
  constraint unique_chapter_position_per_course unique (course_id, position)
);

-- ====================================================================================
-- INDEXES
-- ====================================================================================
create index idx_chapters_course_id on public.chapters (course_id);
create index idx_chapters_created_by on public.chapters (created_by);
create index idx_chapters_updated_by on public.chapters (updated_by);
create index idx_chapters_position on public.chapters (course_id, position);


-- ====================================================================================
-- COMMENTS
-- ====================================================================================
comment on table public.chapters is 'Contains chapters associated with each course.';
comment on column public.chapters.id is 'Unique identifier for the chapter.';
comment on column public.chapters.course_id is 'ID of the parent course.';
comment on column public.chapters.name is 'Title of the chapter.';
comment on column public.chapters.description is 'Optional description of the chapter.';
comment on column public.chapters.requires_payment is 'Whether this chapter requires payment to access.';
comment on column public.chapters.position is 'Ordering position of the chapter within its course.';
comment on column public.chapters.created_at is 'Timestamp when the chapter was created.';
comment on column public.chapters.updated_at is 'Timestamp when the chapter was last updated.';
comment on column public.chapters.created_by is 'User ID of the chapter creator.';
comment on column public.chapters.updated_by is 'User ID of the last person who updated the chapter.';

-- ====================================================================================
-- TRIGGERS
-- ====================================================================================
create trigger trg_chapters_set_updated_at 
before update on public.chapters
for each row
execute function update_updated_at_column();

-- ====================================================================================
-- ROW LEVEL SECURITY
-- ====================================================================================
alter table public.chapters enable row level security;

-- SELECT: Course owners can view chapters in their courses
create policy "Select: owner can view chapters"
on public.chapters
for select
to authenticated
using (
  exists (
    select 1 from public.courses c
    where c.id = chapters.course_id and c.created_by = (select auth.uid())
  )
);

-- INSERT: Course owners can insert chapters into their courses
create policy "Insert: owner can create chapters"
on public.chapters
for insert
to authenticated
with check (
  exists (
    select 1 from public.courses c
    where c.id = chapters.course_id and c.created_by = (select auth.uid())
  )
);

-- UPDATE: Course owners can update chapters in their courses
create policy "Update: owner can update chapters"
on public.chapters
for update
to authenticated
using (
  exists (
    select 1 from public.courses c
    where c.id = chapters.course_id and c.created_by = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.courses c
    where c.id = chapters.course_id and c.created_by = (select auth.uid())
  )
);

-- DELETE: Course owners can delete chapters in their courses
create policy "Delete: owner can delete chapters"
on public.chapters
for delete
to authenticated
using (
  exists (
    select 1 from public.courses c
    where c.id = chapters.course_id and c.created_by = (select auth.uid())
  )
);

-- Function to reorder chapter positions within a course
create or replace function reorder_chapters(chapters jsonb)
returns void
language plpgsql
security definer
set search_path = '' -- prevent search_path injection
as $$
declare
  target_course_id uuid;
begin
  -- Step 1: Extract the course_id from the first chapter in the JSON array
  target_course_id := (chapters->0->>'course_id')::uuid;

  -- Step 2: Temporarily shift positions of all existing chapters in the course
  update public.chapters
  set position = position + 1000000
  where course_id = target_course_id;

  -- Step 3: Insert or update chapters with new positions from the provided JSON array
  insert into public.chapters (
    id, course_id, name, description, requires_payment, position, created_by, updated_by
  )
  select 
    (c->>'id')::uuid,
    (c->>'course_id')::uuid,
    c->>'name',
    c->>'description',
    (c->>'requires_payment')::boolean,
    (c->>'position')::int,
    (c->>'created_by')::uuid,
    (c->>'updated_by')::uuid
  from jsonb_array_elements(chapters) as c
  on conflict (id) do update
  set 
    position = excluded.position,
    updated_by = excluded.updated_by,
    updated_at = timezone('utc', now());
end;
$$;

