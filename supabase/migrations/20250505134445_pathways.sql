-- create the pathways table
create table public.pathways (
  id uuid default uuid_generate_v4() primary key not null,
  name text not null,
  description text not null,
  image_url text not null, 
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references public.profiles on delete cascade not null,
  updated_by uuid references public.profiles on delete set null not null
);

comment on table public.pathways is 'All pathways'; 
comment on column public.pathways.image_url is 'URL of pathway image';

-- create a trigger to invoke the function before each row update
create trigger set_updated_at
before update on public.pathways
for each row
execute function update_updated_at_column();

-- secure the table
alter table public.pathways enable row level security;

-- define row-level security policies for pathways
create policy "Allow pathways insert access" on public.pathways 
  for insert with check ( auth.uid() = created_by );

create policy "Allow pathways update access" on public.pathways 
  for update using ( auth.uid() = created_by );

create policy "Allow pathways select access" on public.pathways 
  for select using ( auth.role() = 'authenticated' );

create policy "Allow pathways delete access" on public.pathways 
  for delete using ( auth.uid() = created_by );

-- set up a storage bucket for pathways
insert into storage.buckets (id, name) values ('pathways', 'pathways');

-- define row-level security policies for pathways bucket
create policy "Allow pathways bucket update access" on storage.objects
  for update using ((select auth.uid()) = owner_id::uuid ) with check (bucket_id = 'pathways'); 

create policy "Allow pathways bucket insert access" on storage.objects
  for insert with check ((select auth.uid()) = owner_id::uuid and bucket_id = 'pathways');

create policy "Allow pathways bucket select access" on storage.objects
  for select using (auth.role() = 'authenticated'  and bucket_id = 'pathways');

create policy "Allow pathways bucket delete access" on storage.objects
  for delete using ((select auth.uid()) = owner_id::uuid  and bucket_id = 'pathways');

-- Send "previous data" on change 
alter table public.pathways replica identity full; 

-- add tables to the publication
alter publication supabase_realtime add table public.pathways;
