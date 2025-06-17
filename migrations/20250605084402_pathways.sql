-- ========================================
-- Create 'pathways' table
-- ========================================
create table public.pathways (
  id uuid primary key default uuid_generate_v4() not null,
  name text not null,
  description text not null,
  image_url text not null,         -- URL of pathway image
  blur_hash text null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid not null references public.profiles on delete cascade,
  updated_by uuid not null references public.profiles on delete set null
);

comment on table public.pathways is 'Table containing all learning pathways.';
comment on column public.pathways.image_url is 'URL of the associated pathway image.';

-- Add index on created_by to support the foreign key constraint
create index idx_pathways_created_by
on public.pathways (created_by);

-- Add index on updated_by to support the foreign key constraint
create index idx_pathways_updated_by
on public.pathways (updated_by);


-- ========================================
-- Trigger: auto-update updated_at timestamp on update
-- ========================================
create or replace trigger trg_pathways_set_updated_at
before update on public.pathways
for each row
execute function update_updated_at_column();

-- ========================================
-- Enable RLS (Row-Level Security)
-- ========================================
alter table public.pathways enable row level security;

-- ========================================
-- RLS Policies for public.pathways
-- ========================================

-- Allow inserts only if created_by matches current user
create policy pathways_insert_own_record
on public.pathways
for insert
with check ((select auth.uid()) = created_by);

-- Allow updates only by creator
create policy pathways_update_own_record
on public.pathways
for update
using ((select auth.uid()) = created_by);

-- Allow read access to all (authenticated and anonymous)
create policy pathways_read_public
on public.pathways
for select
to authenticated, anon
using (true);

-- Allow deletion only by creator
create policy pathways_delete_own_record
on public.pathways
for delete
using ((select auth.uid()) = created_by);

-- ========================================
-- Set up storage bucket for pathways images
-- ========================================
insert into storage.buckets (id, name, public)
values ('pathways', 'pathways', true)
on conflict (id) do nothing;

-- ========================================
-- RLS Policies for storage.objects (Pathways Bucket)
-- ========================================

-- Allow update to objects in 'pathways' bucket by their owner
create policy pathways_bucket_update_own_object
on storage.objects
for update
using ((select auth.uid()) = owner)
with check (bucket_id = 'pathways');

-- Allow insert into 'pathways' bucket
create policy pathways_bucket_insert
on storage.objects
for insert
with check (bucket_id = 'pathways');

-- Allow read access to all objects in 'pathways' bucket
create policy pathways_bucket_read
on storage.objects
for select
using (bucket_id = 'pathways');

-- Allow deletion of own objects (incorrectly references 'avatars' bucket originally — fixed)
create policy pathways_bucket_delete_own_object
on storage.objects
for delete
using ((select auth.uid()) = owner and bucket_id = 'pathways');

-- ========================================
-- Enable "replica identity full" for CDC or logical decoding
-- ========================================
alter table public.pathways replica identity full;

-- ========================================
-- Add pathways table to the realtime publication
-- ========================================
alter publication supabase_realtime add table public.pathways;
