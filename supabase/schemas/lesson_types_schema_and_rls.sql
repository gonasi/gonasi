-- ====================================================================================
-- TABLE: LESSON TYPES
-- Description: Stores all types of lessons available in the system
-- ====================================================================================

create table public.lesson_types (
  id uuid primary key default uuid_generate_v4() not null, -- Unique identifier
  name text not null unique,                          -- Display name of the lesson type
  description text not null,                   -- Description of what the lesson type entails
  lucide_icon text not null,                   -- Icon name (Lucide icon set)
  bg_color text not null unique,               -- Unique hex background color 
  created_at timestamp with time zone 
    default timezone('utc'::text, now()) not null, -- UTC timestamp of record creation
  updated_at timestamp with time zone 
    default timezone('utc'::text, now()) not null, -- UTC timestamp of last update

  created_by uuid null 
    references public.profiles on delete cascade,  -- Creator of the record
  updated_by uuid null 
    references public.profiles on delete set null  -- Last user to update the record
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

-- Improve filtering or ordering by timestamps
create index idx_lesson_types_created_by on public.lesson_types (created_by);
create index idx_lesson_types_updated_by on public.lesson_types (updated_by);

-- ====================================================================================
-- TRIGGERS
-- ====================================================================================

-- Automatically update `updated_at` on row update
create or replace trigger trg_lesson_types_set_updated_at
before update on public.lesson_types
for each row
execute function update_updated_at_column();

-- ====================================================================================
-- ROW LEVEL SECURITY
-- ====================================================================================

alter table public.lesson_types enable row level security;

-- ====================================================================================
-- RLS POLICIES: LESSON TYPES
-- ====================================================================================

-- Allow public (anon and authenticated) to read lesson types
create policy "Public can read lesson types"
  on public.lesson_types
  for select
  to authenticated, anon
  using (true);

-- Allow authorized users to insert new lesson types
create policy "Authenticated users can insert lesson types"
  on public.lesson_types
  for insert
  to authenticated
  with check ((select authorize('lesson_types.insert')));

-- Allow authorized users to update lesson types
create policy "Authenticated users can update lesson types"
  on public.lesson_types
  for update
  to authenticated
  using ((select authorize('lesson_types.update')));

-- Allow authorized users to delete lesson types
create policy "Authenticated users can delete lesson types"
  on public.lesson_types
  for delete
  to authenticated
  using ((select authorize('lesson_types.delete')));
