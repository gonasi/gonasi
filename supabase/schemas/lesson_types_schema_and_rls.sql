-- ====================================================================================
-- TABLE: LESSON TYPES
-- Description: Stores all types of lessons available in the system
-- ====================================================================================

create table public.lesson_types (
  id uuid primary key default uuid_generate_v4() not null,
  name text not null unique,
  description text not null,
  lucide_icon text not null,
  bg_color text not null unique,

  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null,

  -- ✅ updated to auth.users
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null
);

-- ====================================================================================
-- COMMENTS
-- ====================================================================================

comment on table public.lesson_types is 'All lesson types available in the system';
comment on column public.lesson_types.name is 'Display name of the lesson type';
comment on column public.lesson_types.description is 'Description of what the lesson type entails';
comment on column public.lesson_types.lucide_icon is 'Icon name for frontend display using Lucide';
comment on column public.lesson_types.bg_color is 'Hex background color used in UI, must be unique';
comment on column public.lesson_types.created_by is 'User who created this lesson type';
comment on column public.lesson_types.updated_by is 'Last user to update this lesson type';

-- ====================================================================================
-- INDEXES
-- ====================================================================================

create index idx_lesson_types_created_by on public.lesson_types (created_by);
create index idx_lesson_types_updated_by on public.lesson_types (updated_by);

-- ====================================================================================
-- TRIGGERS
-- ====================================================================================

create or replace trigger trg_lesson_types_set_updated_at
before update on public.lesson_types
for each row execute function update_updated_at_column();

-- ====================================================================================
-- ROW LEVEL SECURITY
-- ====================================================================================

alter table public.lesson_types enable row level security;

-- ====================================================================================
-- RLS POLICIES
-- ====================================================================================

-- ✅ Public read access
create policy lesson_types_select_public
  on public.lesson_types
  for select
  to authenticated, anon
  using (true);

-- ✅ Insert: su, admin, staff
create policy lesson_types_insert_authenticated
  on public.lesson_types
  for insert
  to authenticated
  with check (
    authorize('go_su_create')
    or authorize('go_admin_create')
    or authorize('go_staff_create')
  );

-- ✅ Update: su, admin, staff
create policy lesson_types_update_authenticated
  on public.lesson_types
  for update
  to authenticated
  using (
    authorize('go_su_update')
    or authorize('go_admin_update')
    or authorize('go_staff_update')
  );

-- ✅ Delete: su, admin, staff
create policy lesson_types_delete_authenticated
  on public.lesson_types
  for delete
  to authenticated
  using (
    authorize('go_su_delete')
    or authorize('go_admin_delete')
    or authorize('go_staff_delete')
  );
