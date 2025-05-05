-- Create the chapters table which stores individual chapter data linked to a course
create table public.chapters (
  id uuid default uuid_generate_v4() primary key, -- Unique identifier for the chapter
  course_id uuid not null,                        -- Foreign key referencing the parent course
  name text not null,                             -- Name/title of the chapter
  description text null,                          -- Optional description of the chapter
  requires_payment boolean default false,         -- Flag to indicate if the chapter requires payment to access
  position integer null default 0,                -- Used to order chapters within a course (drag-and-drop)
  created_at timestamp with time zone default timezone('utc', now()) not null, -- Timestamp when chapter is created
  updated_at timestamp with time zone default timezone('utc', now()) not null, -- Timestamp when chapter is last updated
  created_by uuid not null,                       -- User ID of the chapter creator
  updated_by uuid not null,                       -- User ID of the last person who updated the chapter

  -- Foreign key constraints
  foreign key (course_id) references courses(id) on delete cascade,             -- Delete chapters if course is deleted
  foreign key (created_by) references profiles(id) on delete restrict,          -- Prevent deletion of user if used here
  foreign key (updated_by) references profiles(id) on delete restrict,          -- Same as above

  -- Additional constraints
  constraint unique_chapter_position_per_course unique (course_id, position)   -- Prevent duplicate positions in a course
);
-- Add a comment to describe the chapters table
comment on table public.chapters is 'All chapters';

-- Function that auto-updates the "updated_at" column before any update to a row
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now()); -- Set the updated_at to current UTC time
  return new;
end;
$$ language plpgsql;

-- Trigger that runs the above function before any update on a chapter row
create trigger set_updated_at 
before update on public.chapters
for each row
execute function update_updated_at_column();

-- Enable Row-Level Security (RLS) for the chapters table
alter table public.chapters enable row level security;


-- RLS policy to allow 'su' and 'admin' roles to select chapters 
-- based on course visibility, published status, or if the chapter is assigned to the user
create policy "allow admin and su, others on public, published, or assigned chapters"
on public.chapters
for select
using (
  -- Allow access if the user is an admin or superuser in the same company
  exists (
    select 1 
    from public.company_memberships
    where staff_id = auth.uid() 
    and staff_role in ('su', 'admin')
  )

  -- Allow access to chapters linked to a published and public course
  or exists (
    select 1 
    from public.courses
    where id = public.chapters.course_id
    and status = 'published' 
    and visibility = 'public'
  )

  -- Allow access to chapters linked to a course assigned to the user
  or exists (
    select 1 
    from public.assigned_courses_to_members
    where course_id = public.chapters.course_id
    and user_id = auth.uid()
  )
);

-- RLS policy to allow only superusers (su) and admins to add (insert) chapters
create policy "allow su and admin to add chapters"
on public.chapters
for insert
with check (
  -- Ensure the user is an admin or superuser
  exists (
    select 1 
    from public.company_memberships 
    where staff_id = auth.uid() 
    and staff_role in ('su', 'admin')
  )
);

-- RLS policy to allow only superusers (su) and admins to update chapters
create policy "allow su and admin to update chapters"
on public.chapters
for update
using (
  -- Ensure the user is an admin or superuser
  exists (
    select 1 
    from public.company_memberships 
    where staff_id = auth.uid() 
    and staff_role in ('su', 'admin')
  )
);

-- RLS policy to allow only superusers (su) and admins to delete chapters
create policy "allow su and admin to delete chapters"
on public.chapters
for delete
using (
  -- Ensure the user is an admin or superuser
  exists (
    select 1 
    from public.company_memberships 
    where staff_id = auth.uid() 
    and staff_role in ('su', 'admin')
  )
);



-- Function to reorder chapter positions within a course
create or replace function reorder_chapters(chapters jsonb)
returns void
language plpgsql
security definer -- Runs with privileges of the function owner (not the caller)
as $$
declare
  target_course_id uuid;
begin
  -- Step 1: Extract the course_id from the first chapter in the JSON array
  target_course_id := (chapters->0->>'course_id')::uuid;

  -- Step 2: Temporarily shift positions of all existing chapters in the course
  -- This avoids violating the unique constraint on (course_id, position)
  update chapters
  set position = position + 1000000
  where course_id = target_course_id;

  -- Step 3: Insert or update chapters with new positions from the provided JSON array
  insert into chapters (
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
    position = excluded.position,                -- Update position to new value
    updated_by = excluded.updated_by,            -- Track who made the change
    updated_at = timezone('utc', now());         -- Refresh updated timestamp
end;
$$;
