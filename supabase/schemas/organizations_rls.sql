-- ===================================================
-- Enable RLS on organizations table
-- ===================================================
alter table public.organizations enable row level security;

-- ===================================================
-- Function: check if user can create another organization under 'launch' tier
-- ===================================================
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

-- ===================================================
-- Policy: allow select for public orgs or members/owners/students
-- ===================================================
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

-- ===================================================
-- Policy: allow insert by authenticated users as owner within launch tier limit
-- ===================================================
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

-- ===================================================
-- Policy: allow updates by owner or admin, but restrict ownership transfers to admins
-- ===================================================
create policy "update: owner or admin, transfer to admin only"
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
)
with check (
  owned_by = (select auth.uid())
  or exists (
    select 1
    from public.organization_members m
    where m.organization_id = organizations.id
      and m.user_id = owned_by
      and m.role = 'admin'
  )
);

-- ===================================================
-- Policy: allow deletion only by the current owner
-- ===================================================
create policy "delete: owner only"
on public.organizations
for delete
to authenticated
using (
  owned_by = (select auth.uid())
);
