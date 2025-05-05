-- Custom types
create type public.app_permission as enum (
  'course_categories.insert', 
  'course_categories.update', 
  'course_categories.delete',
  'course_sub_categories.insert', 
  'course_sub_categories.update', 
  'course_sub_categories.delete',
  'featured_courses_pricing.insert', 
  'featured_courses_pricing.update', 
  'featured_courses_pricing.delete',
  'lesson_types.insert', 
  'lesson_types.update', 
  'lesson_types.delete'
);
create type public.app_role as enum ('go_su', 'go_admin', 'go_staff', 'user');
create type public.user_status as enum ('ONLINE', 'OFFLINE');

-- USERS
create table public.profiles (
  id          uuid references auth.users not null primary key, -- UUID from auth.users
  username text unique, -- Unique username for the profile
  email text unique not null, -- User email
  full_name text, -- Full name of the user
  phone_number text,
  phone_number_verified boolean not null default false, -- Whether the phone number is verified
  email_verified boolean not null default false, -- Whether the email is verified
  avatar_url text, -- URL to the user's avatar image
  is_onboarding_complete boolean not null default false, -- Ensure is_complete is false by default
  account_verified boolean not null default false, -- Whether the profile is officially verified (e.g., for influencers, businesses)
  updated_at timestamp with time zone,
  status      user_status default 'OFFLINE'::public.user_status,

  bio text, -- Short user bio
  website text, -- Personal or professional website URL
  notifications_enabled boolean not null default true, -- Whether the user allows notifications

  -- Fine-Grained Social Links
  twitter_url text check (twitter_url ~* '^https?://(www\.)?twitter\.com/.+$'),
  linkedin_url text check (linkedin_url ~* '^https?://(www\.)?linkedin\.com/in/.+$'),
  github_url text check (github_url ~* '^https?://(www\.)?github\.com/.+$'),
  instagram_url text check (instagram_url ~* '^https?://(www\.)?instagram\.com/.+$'),
  facebook_url text check (facebook_url ~* '^https?://(www\.)?facebook\.com/.+$'),
  tiktok_url text check (tiktok_url ~* '^https?://(www\.)?tiktok\.com/@.+$'),
  youtube_url text check (youtube_url ~* '^https?://(www\.)?youtube\.com/(c|channel|user)/.+$'),
  discord_url text check (discord_url ~* '^https?://(www\.)?discord\.gg/.+$'),

  constraint username_length check (char_length(username) >= 3), -- Ensure username is at least 3 characters long
  constraint username_lowercase check (username = lower(username)), -- Ensure username is in lowercase
  constraint email_valid check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') -- Ensure valid email format
);
comment on table public.profiles is 'Profile data for each user.';
comment on column public.profiles.id is 'References the internal Supabase Auth user.';

-- Create a function to update the updated_at column
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now()); 
  return new;
end;
$$ language plpgsql;

create type staff_role_enum AS ENUM ('su', 'admin', 'user');

-- Create table for staff members
create table if not exists public.staff_members (
  id uuid default uuid_generate_v4() primary key not null,
  staff_id uuid not null references public.profiles(id) on delete cascade,
  company_id uuid not null references public.profiles(id) on delete cascade,
  staff_role staff_role_enum not null default 'user',
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now()),
  created_by uuid not null references public.profiles(id) on delete cascade,
  updated_by uuid references public.profiles(id) on delete set null,
  constraint unique_staff_per_company unique (staff_id, company_id)
);

-- Add a comment describing the table
comment on table public.staff_members is 'Stores staff members associated with a company.';

-- Ensure only one 'su' per company_id
create unique index unique_su_per_company
on public.staff_members (company_id)
where staff_role = 'su';

-- Create a trigger to update the updated_at column automatically
create or replace trigger set_updated_at
before update on public.staff_members
for each row
execute function update_updated_at_column();

-- Create an index to optimize queries on created_at
create index if not exists idx_staff_members_created_at on public.staff_members (created_at);

-- user active companies
create table public.user_active_companies (
  id uuid default uuid_generate_v4() primary key not null,
  user_id uuid not null references public.profiles(id),
  company_id uuid not null references public.profiles(id),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (user_id, company_id)
);

comment on table public.user_active_companies is 'Tracks the active company associated with a user.';

-- course categories
create table public.course_categories (
  id uuid default uuid_generate_v4() primary key not null,
  name text not null,
  description text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references public.profiles not null,
  updated_by uuid references public.profiles not null
);
comment on table public.course_categories is 'Topics and groups.';

-- Create a trigger to invoke the function before each row update
create trigger set_updated_at
before update on public.course_categories
for each row
execute function update_updated_at_column();

-- course sub categories
create table public.course_sub_categories (
  id uuid default uuid_generate_v4() primary key not null,
  category_id uuid references public.course_categories on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references public.profiles not null,
  updated_by uuid references public.profiles not null
);
comment on table public.course_sub_categories is 'Individual messages sent by each user.';

-- Create a trigger to invoke the function before each row update
create trigger set_updated_at
before update on public.course_sub_categories
for each row
execute function update_updated_at_column();

-- USER ROLES
create table public.user_roles (
  id uuid default uuid_generate_v4() primary key not null,
  user_id   uuid references public.profiles on delete cascade not null,
  role      app_role not null,
  unique (user_id, role)
);
comment on table public.user_roles is 'Application roles for each user.';

-- ROLE PERMISSIONS
create table public.role_permissions (
  id uuid default uuid_generate_v4() primary key not null,
  role         app_role not null,
  permission   app_permission not null,
  unique (role, permission)
);
comment on table public.role_permissions is 'Application permissions for each role.';

-- authorize with role-based access control (RBAC)
create or replace function public.authorize(
  requested_permission app_permission
)
returns boolean as $$
declare
  bind_permissions int;
  user_role public.app_role;
begin
  -- Fetch user role once and store it to reduce number of calls
  select (auth.jwt() ->> 'user_role')::public.app_role into user_role;

  select count(*)
  into bind_permissions
  from public.role_permissions
  where role_permissions.permission = requested_permission
    and role_permissions.role = user_role;

  return bind_permissions > 0;
end;
$$ language plpgsql stable security definer set search_path = '';

-- Secure the tables
alter table public.profiles enable row level security;
alter table public.staff_members enable row level security;
alter table public.course_categories enable row level security;
alter table public.user_active_companies enable row level security;
alter table public.course_sub_categories enable row level security;
alter table public.user_roles enable row level security;
alter table public.role_permissions enable row level security;

-- Profiles Policies
create policy "Authenticated users can read profiles"
  on public.profiles
  for select
  using (auth.role() = 'authenticated');

create policy "Users can insert their own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

-- user_active_companies
create policy "Allow user_active_companies insert access" on public.user_active_companies 
  for insert with check ( auth.uid() = user_id );

create policy "Allow user_active_companies update access" on public.user_active_companies 
  for update using ( auth.uid() = user_id );

create policy "Allow user_active_companies select access" on public.user_active_companies 
  for select using ( auth.role() = 'authenticated' );

create policy "Allow user_active_companies delete access" on public.user_active_companies 
  for delete using ( auth.uid() = user_id );


-- Create a view to track which users belong to which companies
-- This will help us check company membership without triggering RLS recursion
create view public.company_memberships as
select 
  staff_id,  -- The user ID of the staff member
  company_id, -- The company they belong to
  staff_role
from public.staff_members;

-- Create a policy that allows company members to view all staff in their company
create policy "allow company members to view all staff in their company"
on public.staff_members
for select
using (
  company_id in (  -- Allow access if the user's company_id matches
    select company_id 
    from public.company_memberships  -- Query the view instead of the table to avoid recursion
    where staff_id = auth.uid()  -- Ensure the user is a member of the company
  )
);

create policy "allow su and admin to create staff members"
on public.staff_members
for insert
with check (
  exists (
    select 1 
    from public.company_memberships 
    where staff_id = auth.uid() 
    and staff_role in ('su', 'admin')  -- Only 'su' and 'admin' can create records
  )
);

create policy "allow only su to update staff members"
on public.staff_members
for update
using (
  exists (
    select 1 
    from public.company_memberships 
    where staff_id = auth.uid() 
    and staff_role = 'su'  -- Only 'su' can update records
  )
);

create policy "allow only su to delete staff members except when company_id = staff_id"
on public.staff_members
for delete
using (
  exists (
    select 1 
    from public.company_memberships 
    where staff_id = auth.uid() 
    and staff_role = 'su'  -- Only 'su' can delete records
  ) 
  and company_id <> staff_id  -- Prevent deletion when company_id and staff_id are equal
);

-- Grant all authenticated users permission to read from the company_memberships view
grant select on public.company_memberships to authenticated;


-- Course Categories Policies
create policy "Authenticated users can read course categories"
  on public.course_categories
  for select
  using (auth.role() = 'authenticated');

create policy "Authorized users can insert course categories" on public.course_categories for insert to authenticated with check ( (SELECT authorize('course_categories.insert')) );

create policy "Authorized users can update course categories"
  on public.course_categories
  for update to authenticated
  using (authorize('course_categories.update'));

create policy "Authorized users can delete course categories"
  on public.course_categories
  for delete to authenticated
  using (authorize('course_categories.delete'));

-- Course Sub-Categories Policies
create policy "Authenticated users can read course sub-categories"
  on public.course_sub_categories
  for select to authenticated
  using (auth.role() = 'authenticated');

create policy "Authorized users can insert course sub-categories" on public.course_sub_categories for insert to authenticated with check ( (SELECT authorize('course_sub_categories.insert')) );

create policy "Authorized users can update course sub-categories"
  on public.course_sub_categories
  for update to authenticated
  using (authorize('course_sub_categories.update'));

create policy "Authorized users can delete course sub-categories"
  on public.course_sub_categories
  for delete to authenticated
  using (authorize('course_sub_categories.delete'));


-- Send "previous data" on change 
alter table public.profiles replica identity full; 
alter table public.user_active_companies replica identity full; 
alter table public.course_categories replica identity full; 
alter table public.course_sub_categories replica identity full;

-- inserts a row into public.profiles and assigns roles
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, username, email, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'username', new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url'); -- Insert a new profile

  insert into public.staff_members (staff_id, company_id, staff_role, created_by, updated_by) 
    values (new.id, new.id, 'su', new.id, new.id); 

  insert into public.user_active_companies (user_id, company_id) 
    values (new.id, new.id); 

  -- Assign role based on email
  if new.email = 'gonasiapp@gmail.com' then
    insert into public.user_roles (user_id, role) values (new.id, 'go_su');
  elsif new.email ilike '%@gonasi.com' then
    insert into public.user_roles (user_id, role) values (new.id, 'go_staff');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'user');
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = auth, public;

-- trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

/**
 * REALTIME SUBSCRIPTIONS
 * Only allow realtime listening on public tables.
 */

begin; 
  -- remove the realtime publication
  drop publication if exists supabase_realtime; 

  -- re-create the publication but don't enable it for any tables
  create publication supabase_realtime;  
commit;

-- add tables to the publication
alter publication supabase_realtime add table public.course_categories;
alter publication supabase_realtime add table public.course_sub_categories;
alter publication supabase_realtime add table public.profiles;

/**
 * AUTH HOOKS
 * Create an auth hook to add a custom claim to the access token jwt.
 */

-- Create the auth hook function
-- https://supabase.com/docs/guides/auth/auth-hooks#hook-custom-access-token
-- Create the auth hook function
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
  declare
    claims jsonb;
    user_role public.app_role;
  begin
    -- Fetch the user role in the user_roles table
    select role into user_role from public.user_roles where user_id = (event->>'user_id')::uuid;

    claims := event->'claims';

    if user_role is not null then
      -- Set the claim
      claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
    else
      claims := jsonb_set(claims, '{user_role}', 'null');
    end if;

    -- Update the 'claims' object in the original event
    event := jsonb_set(event, '{claims}', claims);

    -- Return the modified or original event
    return event;
  end;
$$;

grant usage on schema public to supabase_auth_admin;

grant execute
  on function public.custom_access_token_hook
  to supabase_auth_admin;

revoke execute
  on function public.custom_access_token_hook
  from authenticated, anon, public;

grant all
  on table public.user_roles
to supabase_auth_admin;

revoke all
  on table public.user_roles
  from authenticated, anon, public;

create policy "Allow auth admin to read user roles" ON public.user_roles
as permissive for select
to supabase_auth_admin
using (true)