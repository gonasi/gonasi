-- Create the pricing table
create table public.featured_courses_pricing (
  id uuid default uuid_generate_v4() primary key not null,
  feature_package text check (feature_package in ('basic', 'enhanced', 'exclusive')) not null,
  description text not null,
  daily_rate numeric(10,2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

comment on table public.featured_courses_pricing is 'All featured_courses_pricing'; 

-- create a trigger to invoke the function before each row update
create trigger set_updated_at
before update on public.featured_courses_pricing
for each row
execute function update_updated_at_column();

-- Update total_price only when payment is 'paid'
update public.featured_courses fp
set total_price = (
  select p.daily_rate * extract(day from (fp.end_date - fp.start_date))
  from public.featured_courses_pricing p
  where p.feature_package = fp.feature_package
)
where fp.payment_status = 'paid';

-- secure the table
alter table public.featured_courses_pricing enable row level security;

-- define row-level security policies for featured_courses_pricing
create policy "Allow featured_courses_pricing insert access" on public.featured_courses_pricing 
  for insert to authenticated with check ((SELECT authorize('featured_courses_pricing.insert')));

create policy "Allow featured_courses_pricing update access" on public.featured_courses_pricing 
  for update using ((SELECT authorize('featured_courses_pricing.update')));

create policy "Allow featured_courses_pricing select access" on public.featured_courses_pricing 
  for select using ( auth.role() = 'authenticated' );

create policy "Allow featured_courses_pricing delete access" on public.featured_courses_pricing 
  for delete using ((SELECT authorize('featured_courses_pricing.delete')));
