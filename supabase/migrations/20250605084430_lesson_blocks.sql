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

-- triggers
-- ====================================================================================

create or replace function public.set_lesson_block_position()
returns trigger
as $$
begin
  if new.position is null or new.position = 0 then
    select coalesce(max(position), 0) + 1
    into new.position
    from public.lesson_blocks
    where lesson_id = new.lesson_id;
  end if;
  return new;
end;
$$
language plpgsql
set search_path = '';

create trigger trg_set_lesson_block_position
before insert on public.lesson_blocks
for each row
execute function set_lesson_block_position();

-- ====================================================================================
-- row-level security (rls)
-- ====================================================================================
alter table public.lesson_blocks enable row level security;

-- select policy: allow course admins, editors, viewers, or owners to view blocks
create policy "select: users with course roles (admin/editor/viewer) or owners can view lesson blocks"
on public.lesson_blocks
for select
to authenticated
using (
  exists (
    select 1 from public.courses c
    join public.lessons l on l.course_id = c.id
    where l.id = lesson_blocks.lesson_id
      and (
        is_course_admin(c.id, (select auth.uid())) or
        is_course_editor(c.id, (select auth.uid())) or
        is_course_viewer(c.id, (select auth.uid())) or
        c.created_by = (select auth.uid())
      )
  )
);

-- insert policy: allow course admins, editors, or owners to add blocks
create policy "insert: users with course roles (admin/editor) or owners can add lesson blocks"
on public.lesson_blocks
for insert
to authenticated
with check (
  exists (
    select 1 from public.courses c
    join public.lessons l on l.course_id = c.id
    where l.id = lesson_blocks.lesson_id
      and (
        is_course_admin(c.id, (select auth.uid())) or
        is_course_editor(c.id, (select auth.uid())) or
        c.created_by = (select auth.uid())
      )
  )
);

-- update policy: allow course admins, editors, or owners to update blocks
create policy "update: users with admin/editor roles or owners can modify lesson blocks"
on public.lesson_blocks
for update
to authenticated
using (
  exists (
    select 1 from public.courses c
    join public.lessons l on l.course_id = c.id
    where l.id = lesson_blocks.lesson_id
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
    join public.lessons l on l.course_id = c.id
    where l.id = lesson_blocks.lesson_id
      and (
        is_course_admin(c.id, (select auth.uid())) or
        is_course_editor(c.id, (select auth.uid())) or
        c.created_by = (select auth.uid())
      )
  )
);

-- delete policy: allow course admins, editors, or owners to delete blocks
create policy "delete: course admins, editors, and owners can remove lesson blocks"
on public.lesson_blocks
for delete
to authenticated
using (
  exists (
    select 1 from public.courses c
    join public.lessons l on l.course_id = c.id
    where l.id = lesson_blocks.lesson_id
      and (
        is_course_admin(c.id, (select auth.uid())) or
        is_course_editor(c.id, (select auth.uid())) or
        c.created_by = (select auth.uid())
      )
  )
);

-- ====================================================================================
-- function: reorder_lesson_blocks
-- purpose: update lesson block positions in bulk from a jsonb array of blocks
-- note: shifts existing positions temporarily to avoid conflicts, then upserts new positions
-- ====================================================================================
create or replace function reorder_lesson_blocks(blocks jsonb)
returns void
language plpgsql
security definer
set search_path = '' -- prevent search_path injection
as $$
declare
  target_course_id uuid;
  target_lesson_id uuid;
begin
  -- extract course_id and lesson_id from first block in the jsonb array
  target_course_id := (blocks->0->>'course_id')::uuid;
  target_lesson_id := (blocks->0->>'lesson_id')::uuid;

  -- temporarily shift all existing positions for this course and lesson to avoid conflicts
  update public.lesson_blocks
  set position = position + 1000000
  where course_id = target_course_id
    and lesson_id = target_lesson_id;

  -- upsert new block positions from provided jsonb array
  insert into public.lesson_blocks (
    id, course_id, lesson_id, plugin_type, position, content, settings, created_by, updated_by
  )
  select
    (b->>'id')::uuid,
    (b->>'course_id')::uuid,
    (b->>'lesson_id')::uuid,
    b->>'plugin_type',
    (b->>'position')::int,
    coalesce(b->'content', '{}'::jsonb),
    coalesce(b->'settings', '{}'::jsonb),
    (b->>'created_by')::uuid,
    (b->>'updated_by')::uuid
  from jsonb_array_elements(blocks) as b
  on conflict (id) do update
  set
    position = excluded.position,
    updated_by = excluded.updated_by,
    updated_at = timezone('utc', now());
end;
$$;
