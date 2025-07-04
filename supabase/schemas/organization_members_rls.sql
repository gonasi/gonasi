-- ===================================================
-- Enable RLS on organization_members table
-- ===================================================
alter table public.organization_members enable row level security;

-- ===================================================
-- Helper function to check organization membership permissions
-- ===================================================
create or replace function public.can_manage_organization_member(
  target_org_id uuid,
  current_user_id uuid,
  required_role text default 'admin'
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  user_role text;
begin
  select role into user_role
  from public.organization_members
  where organization_id = target_org_id
    and user_id = current_user_id;
  
  return case
    when required_role = 'owner' then user_role = 'owner'
    when required_role = 'admin' then user_role in ('owner', 'admin')
    else false
  end;
end;
$$;

-- ===================================================
-- SELECT Policy: Members can view other members in their orgs
-- ===================================================
create policy "select: members of same org"
on public.organization_members
for select
to authenticated
using (
  public.can_manage_organization_member(organization_id, (select auth.uid()), 'admin')
  or user_id = (select auth.uid())
);

-- ===================================================
-- INSERT Policy: Allow self-insert as owner and admin invites
-- ===================================================
create policy "insert: authorized users"
on public.organization_members
for insert
to authenticated
with check (
  (user_id = (select auth.uid()) and role = 'owner')
  or
  public.can_manage_organization_member(organization_id, (select auth.uid()), 'admin')
);

-- ===================================================
-- UPDATE Policy: Owner/admin can update roles with restrictions
-- ===================================================
create policy "update: authorized role changes"
on public.organization_members
for update
to authenticated
using (
  public.can_manage_organization_member(organization_id, (select auth.uid()), 'admin')
)
with check (
  case 
    when role = 'admin' then 
      public.can_manage_organization_member(organization_id, (select auth.uid()), 'owner')
    else true
  end
);

-- ===================================================
-- DELETE Policy: Owner/admin can remove non-admin members
-- ===================================================
create policy "delete: authorized removal"
on public.organization_members
for delete
to authenticated
using (
  role != 'admin'
  and public.can_manage_organization_member(organization_id, (select auth.uid()), 'admin')
);