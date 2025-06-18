-- ========================
-- TABLE: course_categories
-- ========================

create table public.course_categories (
  id uuid default uuid_generate_v4() primary key not null,
  name text not null,
  description text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references public.profiles null,
  updated_by uuid references public.profiles not null
);

comment on table public.course_categories is 'Course category groupings (e.g., "Road Safety", "First Aid").';

-- Trigger to auto-update the "updated_at" column
create or replace trigger trg_course_categories_set_updated_at
before update on public.course_categories
for each row
execute function update_updated_at_column();

-- Add index on created_by (foreign key)
create index idx_course_categories_created_by
  on public.course_categories (created_by);

-- Add index on updated_by (foreign key)
create index idx_course_categories_updated_by
  on public.course_categories (updated_by);


-- Enable Row-Level Security (RLS)
alter table public.course_categories enable row level security;

-- ===============================
-- POLICIES: course_categories
-- ===============================

-- Public read access (for both authenticated users and guests)
create policy course_categories_select_public
on public.course_categories
for select
to authenticated, anon
using (true);

-- Authenticated users with proper permission can insert
create policy course_categories_insert_authenticated
on public.course_categories
for insert
to authenticated
with check ((select authorize('course_categories.insert')));

-- Authenticated users with proper permission can update
create policy course_categories_update_authenticated
on public.course_categories
for update
to authenticated
using (authorize('course_categories.update'));

-- Authenticated users with proper permission can delete
create policy course_categories_delete_authenticated
on public.course_categories
for delete
to authenticated
using (authorize('course_categories.delete'));


-- ============================
-- TABLE: course_sub_categories
-- ============================

create table public.course_sub_categories (
  id uuid default uuid_generate_v4() primary key not null,
  category_id uuid references public.course_categories on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references public.profiles null,
  updated_by uuid references public.profiles not null
);

comment on table public.course_sub_categories is 'Sub-topics under each course category (e.g., "Braking Techniques" under "Road Safety").';

-- Trigger to auto-update the "updated_at" column
create or replace trigger trg_course_sub_categories_set_updated_at
before update on public.course_sub_categories
for each row
execute function update_updated_at_column();

-- Add index on category_id (foreign key to course_categories)
create index idx_course_sub_categories_category_id
  on public.course_sub_categories (category_id);

-- Add index on created_by (foreign key)
create index idx_course_sub_categories_created_by
  on public.course_sub_categories (created_by);

-- Add index on updated_by (foreign key)
create index idx_course_sub_categories_updated_by
  on public.course_sub_categories (updated_by);


-- Enable Row-Level Security (RLS)
alter table public.course_sub_categories enable row level security;

-- ===============================
-- POLICIES: course_sub_categories
-- ===============================

-- Public read access (for both authenticated users and guests)
create policy course_sub_categories_select_public
on public.course_sub_categories
for select
to authenticated, anon
using (true); 

-- Authenticated users with proper permission can insert
create policy course_sub_categories_insert_authenticated
on public.course_sub_categories
for insert
to authenticated
with check ((select authorize('course_sub_categories.insert')));

-- Authenticated users with proper permission can update
create policy course_sub_categories_update_authenticated
on public.course_sub_categories
for update
to authenticated
using (authorize('course_sub_categories.update'));

-- Authenticated users with proper permission can delete
create policy course_sub_categories_delete_authenticated
on public.course_sub_categories
for delete
to authenticated
using (authorize('course_sub_categories.delete'));
