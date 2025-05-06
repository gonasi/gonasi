-- Create the blocks table
create table public.blocks (
  id uuid primary key default uuid_generate_v4(),             -- Unique block ID
  lesson_id uuid not null,                                    -- References the lesson
  plugin_type text not null,                                  -- Plugin type (e.g., rich_text, match, reveal)
  position integer default 0 not null,                        -- Sort order within the lesson
  content jsonb not null default '{}'::jsonb,                 -- Plugin-specific configuration
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp,
  created_by uuid not null,                                   -- User who created the block
  updated_by uuid not null,                                   -- User who last updated the block

  -- Foreign key constraints
  foreign key (lesson_id) references public.lessons(id) on delete cascade,
  foreign key (created_by) references public.profiles(id) on delete restrict,
  foreign key (updated_by) references public.profiles(id) on delete restrict
);

-- Comment on table
comment on table public.blocks is 'All blocks within a lesson, ordered by position, supporting various interactive plugin types';

-- Unique constraint: position must be unique per lesson
create unique index unique_block_position_per_lesson
  on public.blocks (lesson_id, position);

-- Index foreign keys for performance
create index idx_blocks_lesson_id on public.blocks(lesson_id);
create index idx_blocks_created_by on public.blocks(created_by);
create index idx_blocks_updated_by on public.blocks(updated_by);

-- Index position for sorting
create index idx_blocks_position on public.blocks(position);

-- Enable Row-Level Security (RLS)
alter table public.blocks enable row level security;

-- Policies

-- Allow insert if user is the creator
create policy "allow insert if creator" on public.blocks
  for insert
  with check (auth.uid() = created_by);

-- Allow update if user is the creator
create policy "allow update if creator" on public.blocks
  for update
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

-- Allow delete if user is the creator
create policy "allow delete if creator" on public.blocks
  for delete
  using (auth.uid() = created_by);

-- Allow select for all authenticated users
create policy "allow select for authenticated" on public.blocks
  for select
  using (auth.role() = 'authenticated');

-- Trigger to auto-update the updated_at column
create trigger set_updated_at_on_blocks
before update on public.blocks
for each row
execute function public.update_updated_at_column();

-- Reordering function
create or replace function public.reorder_blocks(blocks jsonb)
returns void
language plpgsql
security definer
as $$
declare
  target_lesson_id uuid;
begin
  target_lesson_id := (blocks->0->>'lesson_id')::uuid;

  update public.blocks
  set position = position + 1000000
  where lesson_id = target_lesson_id;

  update public.blocks as b
  set 
    position = new_data.position,
    updated_by = new_data.updated_by,
    updated_at = timezone('utc', now())
  from (
    select 
      (elem->>'id')::uuid as id,
      (elem->>'position')::int as position,
      (elem->>'updated_by')::uuid as updated_by
    from jsonb_array_elements(blocks) as elem
  ) as new_data
  where b.id = new_data.id;
end;
$$;
