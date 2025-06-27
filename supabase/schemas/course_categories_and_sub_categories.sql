-- ===========================================
-- Table: course_categories
-- ===========================================

create table public.course_categories (
  id uuid primary key default uuid_generate_v4() not null,
  name text not null check (char_length(name) > 0),
  description text not null check (char_length(description) > 0),
  course_count bigint default 0 not null,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null
);

comment on table public.course_categories is
  'course category groupings (e.g., "road safety", "first aid").';

-- Triggers
create or replace trigger trg_course_categories_set_updated_at
before update on public.course_categories
for each row
execute function update_updated_at_column();

-- Indexes
create index idx_course_categories_created_by
  on public.course_categories (created_by);

create index idx_course_categories_updated_by
  on public.course_categories (updated_by);

-- RLS
alter table public.course_categories enable row level security;

create policy course_categories_select_public
  on public.course_categories
  for select
  to authenticated, anon
  using (true);

create policy course_categories_insert_authenticated
  on public.course_categories
  for insert
  to authenticated
  with check ((select authorize('course_categories.insert')));

create policy course_categories_update_authenticated
  on public.course_categories
  for update
  to authenticated
  using (authorize('course_categories.update'));

create policy course_categories_delete_authenticated
  on public.course_categories
  for delete
  to authenticated
  using (authorize('course_categories.delete'));

-- Optional: Enforce unique category names globally
-- create unique index uniq_course_categories_name on public.course_categories(name);


-- ===========================================
-- Table: course_sub_categories
-- ===========================================

create table public.course_sub_categories (
  id uuid primary key default uuid_generate_v4() not null,
  category_id uuid not null references public.course_categories(id) on delete cascade,
  name text not null check (char_length(name) > 0),
  course_count bigint default 0 not null,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null
);

comment on table public.course_sub_categories is
  'sub-topics under each course category (e.g., "braking techniques" under "road safety").';

-- Triggers
create or replace trigger trg_course_sub_categories_set_updated_at
before update on public.course_sub_categories
for each row
execute function update_updated_at_column();

-- Indexes
create index idx_course_sub_categories_category_id
  on public.course_sub_categories (category_id);

create index idx_course_sub_categories_created_by
  on public.course_sub_categories (created_by);

create index idx_course_sub_categories_updated_by
  on public.course_sub_categories (updated_by);

-- Enforce unique subcategory names within each category
create unique index uniq_course_sub_categories_name_per_category
  on public.course_sub_categories (category_id, name);

-- RLS
alter table public.course_sub_categories enable row level security;

create policy course_sub_categories_select_public
  on public.course_sub_categories
  for select
  to authenticated, anon
  using (true);

create policy course_sub_categories_insert_authenticated
  on public.course_sub_categories
  for insert
  to authenticated
  with check ((select authorize('course_sub_categories.insert')));

create policy course_sub_categories_update_authenticated
  on public.course_sub_categories
  for update
  to authenticated
  using (authorize('course_sub_categories.update'));

create policy course_sub_categories_delete_authenticated
  on public.course_sub_categories
  for delete
  to authenticated
  using (authorize('course_sub_categories.delete'));
