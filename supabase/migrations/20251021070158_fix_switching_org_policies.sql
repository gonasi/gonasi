-- ============================================================
-- Drop existing policies first
-- ============================================================
drop policy if exists "Allow SELECT on own or public profiles" on public.profiles;
drop policy if exists "Allow INSERT of own profile by authenticated users" on public.profiles;
drop policy if exists "Allow UPDATE of own profile by authenticated users" on public.profiles;
drop policy if exists "Allow DELETE of own profile by authenticated users" on public.profiles;

-- ============================================================
-- ✅ Enable Row-Level Security on the profiles table
-- ============================================================
alter table public.profiles enable row level security;

-- ============================================================
-- 🔓 SELECT POLICY (combined)
-- ============================================================
create policy "Allow SELECT on own or public profiles"
on public.profiles
for select
to public
using (
  is_public = true
  or (select auth.uid()) = id
);

-- ============================================================
-- 📝 INSERT POLICY
-- ============================================================
create policy "Allow INSERT of own profile by authenticated users"
on public.profiles
for insert
to authenticated
with check (
  (select auth.uid()) = id
  and (
    -- Personal mode: no organization
    (mode = 'personal' and active_organization_id is null) 
    or 
    -- Organization mode: must be member
    (mode = 'organization' and exists (
      select 1
      from public.organization_members m
      where m.user_id = (select auth.uid())
        and m.organization_id = profiles.active_organization_id
    ))
  )
);

-- ============================================================
-- ✏️ UPDATE POLICY (SIMPLIFIED)
-- ============================================================
create policy "Allow UPDATE of own profile by authenticated users"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check (
  (select auth.uid()) = id
  and (
    -- Switching to personal mode (organization_id will be NULL)
    (mode = 'personal' and active_organization_id is null)
    or
    -- Switching to organization mode (must be member of that org)
    (mode = 'organization' and exists (
      select 1
      from public.organization_members m
      where m.user_id = (select auth.uid())
        and m.organization_id = profiles.active_organization_id
    ))
  )
);

-- ============================================================
-- 🔐 COLUMN-LEVEL PERMISSIONS
-- ============================================================
revoke update on public.profiles from authenticated;

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

-- ============================================================
-- ❌ DELETE POLICY
-- ============================================================
create policy "Allow DELETE of own profile by authenticated users"
on public.profiles
for delete
to authenticated
using ((select auth.uid()) = id);