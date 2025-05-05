-- ============================================================
-- Table: lesson_types
-- Description: Stores all types of lessons available in the system
-- ============================================================

create table public.lesson_types (
  id uuid primary key default uuid_generate_v4() not null,
  name text not null,                          -- Display name of the lesson type
  description text not null,                   -- Description of what the lesson type entails
  lucide_icon text not null,                   -- Icon name for frontend display (Lucide icon set)
  bg_color text not null unique,               -- Hex background color, must be unique
  created_at timestamp with time zone 
    default timezone('utc'::text, now()) not null, -- Timestamp of record creation (UTC)
  updated_at timestamp with time zone 
    default timezone('utc'::text, now()) not null, -- Timestamp of last update (UTC)

  created_by uuid not null 
    references public.profiles on delete cascade,  -- Creator of the record
  updated_by uuid not null 
    references public.profiles on delete set null  -- Last user to update the record
);

comment on table public.lesson_types is 'All lesson types';

-- ============================================================
-- Trigger: Auto-update 'updated_at' before each row update
-- ============================================================

create trigger set_updated_at
before update on public.lesson_types
for each row
execute function update_updated_at_column();

-- ============================================================
-- Security: Enable Row Level Security
-- ============================================================

alter table public.lesson_types enable row level security;

-- ============================================================
-- RLS Policies for lesson_types
-- ============================================================

-- Allow authenticated users to read lesson types
create policy "Authenticated users can read course lesson types"
  on public.lesson_types
  for select to authenticated
  using (auth.role() = 'authenticated');

-- Allow authorized users to insert new lesson types
create policy "Authorized users can insert course lesson types"
  on public.lesson_types
  for insert to authenticated
  with check ((SELECT authorize('lesson_types.insert')));

-- Allow authorized users to update existing lesson types
create policy "Authorized users can update course lesson types"
  on public.lesson_types
  for update to authenticated
  using (authorize('lesson_types.update'));

-- Allow authorized users to delete lesson types
create policy "Authorized users can delete course lesson types"
  on public.lesson_types
  for delete to authenticated
  using (authorize('lesson_types.delete'));
