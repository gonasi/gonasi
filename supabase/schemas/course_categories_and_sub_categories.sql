-- ===========================================
-- table: course_categories
-- ===========================================

-- main category table (e.g., "road safety", "first aid")
create table public.course_categories (
  id uuid default uuid_generate_v4() primary key not null,
  name text not null,
  description text not null,
  course_count bigint default 0 not null,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null,
  created_by uuid references public.profiles null,
  updated_by uuid references public.profiles null
);

comment on table public.course_categories is
  'course category groupings (e.g., "road safety", "first aid").';

-- -------------------------------------------
-- triggers
-- -------------------------------------------

-- automatically update `updated_at` on changes
create or replace trigger trg_course_categories_set_updated_at
before update on public.course_categories
for each row
execute function update_updated_at_column();

-- -------------------------------------------
-- indexes
-- -------------------------------------------

create index idx_course_categories_created_by
  on public.course_categories (created_by);

create index idx_course_categories_updated_by
  on public.course_categories (updated_by);

-- -------------------------------------------
-- row-level security (rls)
-- -------------------------------------------

alter table public.course_categories enable row level security;

-- rls policies

-- allow read access to all users (guests + authenticated)
create policy course_categories_select_public
  on public.course_categories
  for select
  to authenticated, anon
  using (true);

-- allow insert if the user has permission
create policy course_categories_insert_authenticated
  on public.course_categories
  for insert
  to authenticated
  with check ((select authorize('course_categories.insert')));

-- allow update if the user has permission
create policy course_categories_update_authenticated
  on public.course_categories
  for update
  to authenticated
  using (authorize('course_categories.update'));

-- allow delete if the user has permission
create policy course_categories_delete_authenticated
  on public.course_categories
  for delete
  to authenticated
  using (authorize('course_categories.delete'));



-- ===========================================
-- table: course_sub_categories
-- ===========================================

-- sub-topics within each main course category
-- e.g., "braking techniques" under "road safety"
create table public.course_sub_categories (
  id uuid default uuid_generate_v4() primary key not null,
  category_id uuid references public.course_categories on delete cascade not null,
  name text not null,
  course_count bigint default 0 not null,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null,
  created_by uuid references public.profiles null,
  updated_by uuid references public.profiles null
);

comment on table public.course_sub_categories is
  'sub-topics under each course category (e.g., "braking techniques" under "road safety").';

-- -------------------------------------------
-- triggers
-- -------------------------------------------

-- automatically update `updated_at` on changes
create or replace trigger trg_course_sub_categories_set_updated_at
before update on public.course_sub_categories
for each row
execute function update_updated_at_column();

-- -------------------------------------------
-- indexes
-- -------------------------------------------

create index idx_course_sub_categories_category_id
  on public.course_sub_categories (category_id);

create index idx_course_sub_categories_created_by
  on public.course_sub_categories (created_by);

create index idx_course_sub_categories_updated_by
  on public.course_sub_categories (updated_by);

-- -------------------------------------------
-- row-level security (rls)
-- -------------------------------------------

alter table public.course_sub_categories enable row level security;

-- rls policies

-- allow read access to all users (guests + authenticated)
create policy course_sub_categories_select_public
  on public.course_sub_categories
  for select
  to authenticated, anon
  using (true);

-- allow insert if the user has permission
create policy course_sub_categories_insert_authenticated
  on public.course_sub_categories
  for insert
  to authenticated
  with check ((select authorize('course_sub_categories.insert')));

-- allow update if the user has permission
create policy course_sub_categories_update_authenticated
  on public.course_sub_categories
  for update
  to authenticated
  using (authorize('course_sub_categories.update'));

-- allow delete if the user has permission
create policy course_sub_categories_delete_authenticated
  on public.course_sub_categories
  for delete
  to authenticated
  using (authorize('course_sub_categories.delete'));
