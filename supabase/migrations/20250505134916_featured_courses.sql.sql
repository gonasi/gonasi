-- Create the featured courses table
create table public.featured_courses (
  id uuid default uuid_generate_v4() primary key not null,
  course_id uuid references public.courses on delete cascade not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references public.profiles on delete cascade not null, 
  updated_by uuid references public.profiles on delete set null,
  payment_status text check (payment_status in ('pending', 'paid', 'failed')) not null default 'pending',
  start_date timestamp with time zone check (
    payment_status = 'paid' or start_date is null
  ),
  end_date timestamp with time zone check (
    payment_status = 'paid' or end_date is null
  ) check (end_date > start_date),
  feature_package text check (feature_package in ('basic', 'enhanced', 'exclusive')) not null default 'basic',
  total_price numeric(10,2) check (total_price >= 0)
);
comment on table public.featured_courses is 'All featured_courses'; 

-- create a trigger to invoke the function before each row update
create trigger set_updated_at
before update on public.featured_courses
for each row
execute function update_updated_at_column();

-- secure the table
alter table public.featured_courses enable row level security;

-- define row-level security policies for featured_courses
CREATE POLICY "Allow featured_courses insert access" ON public.featured_courses 
  for insert with check ( auth.uid() = created_by );

CREATE POLICY "Allow featured_courses update access" ON public.featured_courses 
  for update using ( auth.uid() = created_by );

CREATE POLICY "Allow featured_courses select access" ON public.featured_courses 
  for select using ( auth.role() = 'authenticated' );

CREATE POLICY "Allow featured_courses delete access" ON public.featured_courses 
  for delete using ( auth.uid() = created_by );