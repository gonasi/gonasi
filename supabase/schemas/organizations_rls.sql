-- enable row-level security (rls) on the organizations table
alter table public.organizations enable row level security;

-- ======================================================
-- function: checks if the current user can create another
-- organization under the 'launch' tier (max 2 allowed)
-- ======================================================
create or replace function can_create_org_under_limit()
returns boolean
security invoker
set search_path = ''
language sql
as $$
  select count(*) < 2
  from public.organizations
  where owned_by = (select auth.uid())
    and tier = 'launch';
$$;

-- ======================================================
-- policy: allow anyone to view public orgs,
-- or users to view orgs they own, are members of, or are students in
-- ======================================================
create policy "select: public, owner, member, or student"
on public.organizations
for select
to public
using (
  is_public
  or owned_by = (select auth.uid())
  or exists (
    select 1
    from public.organization_members m
    where m.organization_id = organizations.id
      and m.user_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.organization_students s
    where s.organization_id = organizations.id
      and s.user_id = (select auth.uid())
  )
);

-- ======================================================
-- policy: allow authenticated users to create organizations
-- only if they are the owner and within the allowed limit for 'launch' tier
-- ======================================================
create policy "insert: auth user as owner within tier limit"
on public.organizations
for insert
to authenticated
with check (
  owned_by = (select auth.uid())
  and (
    tier != 'launch' or can_create_org_under_limit()
  )
);

-- ======================================================
-- policy: allow org updates by the owner or an admin member
-- ======================================================
create policy "update: owner or admin"
on public.organizations
for update
to authenticated
using (
  owned_by = (select auth.uid())
  or exists (
    select 1
    from public.organization_members m
    where m.organization_id = organizations.id
      and m.user_id = (select auth.uid())
      and m.role = 'admin'
  )
);

-- ======================================================
-- policy: allow only the owner to delete the organization
-- ======================================================
create policy "delete: owner only"
on public.organizations
for delete
to authenticated
using (
  owned_by = (select auth.uid())
);
