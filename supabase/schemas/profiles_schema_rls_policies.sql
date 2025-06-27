-- Enable RLS on the profiles table
alter table public.profiles enable row level security;

-- SELECT AUTHENTICATED: Single policy for authenticated users: Allow owners to SELECT all columns of own profile OR limited columns of public profiles
create policy "Allow authenticated users to SELECT own profile or public profiles"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

-- INSERT: Allow authenticated users to create only their own profile
create policy "Allow INSERT of own profile by authenticated users"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

-- UPDATE: Allow authenticated users to update only their own profile
create policy "Allow UPDATE of own profile by authenticated users"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- DELETE: Allow authenticated users to delete only their own profile
create policy "Allow DELETE of own profile by authenticated users"
on public.profiles
for delete
to authenticated
using ((select auth.uid()) = id);

-- Revoke default SELECT permissions
revoke select on public.profiles from authenticated, anon;

-- Create a view for limited public profile access
create or replace view public.public_profiles as
select 
  id,
  username,
  full_name,
  avatar_url,
  blur_hash,
  is_public,
  account_verified,
  created_at
from public.profiles
where is_public = true;

-- Grant SELECT on the view to authenticated and anonymous users
grant select on public.public_profiles to authenticated, anon;