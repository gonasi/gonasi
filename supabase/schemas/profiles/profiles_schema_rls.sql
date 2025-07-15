-- ============================================================
-- ✅ Enable Row-Level Security on the profiles table
-- ============================================================
alter table public.profiles enable row level security;

-- ============================================================
-- 🔓 SELECT POLICY (combined)
-- ============================================================
-- Allow users to SELECT their own profile or any public profile
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
    active_organization_id is null
    or exists (
      select 1
      from public.organization_members m
      where m.user_id = (select auth.uid())
        and m.organization_id = profiles.active_organization_id
    )
  )
);

-- ============================================================
-- ✏️ UPDATE POLICY
-- ============================================================
create policy "Allow UPDATE of own profile by authenticated users"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

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
