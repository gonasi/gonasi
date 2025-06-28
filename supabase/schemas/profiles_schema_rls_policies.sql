-- Enable Row-Level Security on the profiles table
alter table public.profiles enable row level security;

-- -------------------------------------
-- SELECT POLICY
-- -------------------------------------
-- Allow authenticated users to SELECT their own profile
-- and allow SELECT on public profiles through a separate view
create policy "Allow authenticated users to SELECT own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

-- -------------------------------------
-- INSERT POLICY
-- -------------------------------------
-- Allow authenticated users to INSERT their own profile
create policy "Allow INSERT of own profile by authenticated users"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

-- -------------------------------------
-- UPDATE POLICY
-- -------------------------------------
-- Allow authenticated users to UPDATE their own profile
-- Only applies if they have explicit column-level update rights
create policy "Allow UPDATE of own profile by authenticated users"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- Revoke full table-level UPDATE privileges from authenticated users
revoke update on public.profiles from authenticated;

-- Grant column-level UPDATE privileges only on allowed columns
grant update (
  username,
  full_name,
  avatar_url,
  blur_hash,
  phone_number,
  is_public,
  country_code,
  preferred_language,
  notifications_enabled,
  mode,
  active_organization_id
) on public.profiles to authenticated;

-- -------------------------------------
-- DELETE POLICY
-- -------------------------------------
-- Allow authenticated users to DELETE their own profile
create policy "Allow DELETE of own profile by authenticated users"
on public.profiles
for delete
to authenticated
using ((select auth.uid()) = id);

-- -------------------------------------
-- PUBLIC PROFILES VIEW
-- -------------------------------------
-- Revoke default SELECT access to the profiles table
revoke select on public.profiles from authenticated, anon;

-- Create a view exposing only public fields from public profiles
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
where
  is_public = true
  or id = (select auth.uid()); -- include own profile even if not public

-- Grant SELECT access on the view to both authenticated and anonymous users
grant select on public.public_profiles to authenticated, anon;
