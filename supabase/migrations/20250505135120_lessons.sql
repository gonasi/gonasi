-- Create the lessons table
create table public.lessons (
  id uuid primary key default uuid_generate_v4(),          -- Unique lesson ID
  course_id uuid not null,                                 -- References the course
  chapter_id uuid not null,                                -- References the chapter
  lesson_type_id uuid not null,                            -- References the lesson type
  name text not null,                                      -- Lesson title                                      -- Optional lesson content
  position integer default 0,                              -- Sort order within the chapter
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp,
  created_by uuid not null,                                -- User who created the lesson
  updated_by uuid not null,                                -- User who last updated the lesson
  metadata jsonb default '{}'::jsonb not null,
  settings jsonb default '{}'::jsonb not null,

  -- Foreign key constraints
  foreign key (course_id) references public.courses(id) on delete cascade,
  foreign key (chapter_id) references public.chapters(id) on delete cascade,
  foreign key (lesson_type_id) references public.lesson_types(id) on delete set null,
  foreign key (created_by) references public.profiles(id) on delete restrict,
  foreign key (updated_by) references public.profiles(id) on delete restrict
);

-- Add comment to the table
comment on table public.lessons is 'All lessons for chapters within a course';

-- Ensure lesson position is unique within a chapter
create unique index unique_lesson_position_per_chapter
  on public.lessons (chapter_id, position);

-- Index foreign keys to optimize joins
create index idx_lessons_course_id on public.lessons(course_id);
create index idx_lessons_chapter_id on public.lessons(chapter_id);
create index idx_lessons_lesson_type_id on public.lessons(lesson_type_id);
create index idx_lessons_created_by on public.lessons(created_by);
create index idx_lessons_updated_by on public.lessons(updated_by);

-- Index position for better sorting and querying
create index idx_lessons_position on public.lessons(position);


-- Enable Row-Level Security (RLS)
alter table public.lessons enable row level security;

-- Policies

-- Allow insert if user is the creator
create policy "allow insert if creator" on public.lessons
  for insert
  with check (auth.uid() = created_by);

-- Allow update if user is the creator
create policy "allow update if creator" on public.lessons
  for update
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

-- Allow delete if user is the creator
create policy "allow delete if creator" on public.lessons
  for delete
  using (auth.uid() = created_by);

-- Allow select for all authenticated users
create policy "allow select for authenticated" on public.lessons
  for select
  using (auth.role() = 'authenticated');

-- Function to auto-update the `updated_at` column on update
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$ language plpgsql;

-- Trigger to apply the above function before updating a row
create trigger set_updated_at_on_lessons
before update on public.lessons
for each row
execute function public.update_updated_at_column();

-- Function to reorder lessons within a chapter using a JSONB array
create or replace function public.reorder_lessons(lessons jsonb)
returns void
language plpgsql
security definer
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
