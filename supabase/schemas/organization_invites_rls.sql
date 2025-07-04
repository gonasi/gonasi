-- ===================================================
-- Function: public.can_add_org_member
-- Description: Checks if an organization has capacity to add a new member
-- based on tier limits, current active members, and unaccepted invites.
-- ===================================================
create or replace function public.can_add_org_member(organization_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  with active_members as (
    select count(*) as count
    from public.organization_members om
    where om.organization_id = $1
  ),
  pending_invites as (
    select count(*) as count
    from public.organization_invites oi
    where oi.organization_id = $1
      and oi.accepted_at is null
      and oi.expires_at > now()
      and (oi.revoked_at is null)
  ),
  limits as (
    select tl.max_members_per_org
    from public.organizations o
    join public.tier_limits tl on o.tier = tl.tier
    where o.id = $1
  )
  select (am.count + pi.count) < limits.max_members_per_org
  from active_members am, pending_invites pi, limits;
$$;


-- ===================================================
-- Enable Row-Level Security on organization_invites
-- ===================================================
alter table public.organization_invites enable row level security;

-- ===================================================
-- SELECT Policy: allow org admins to see all invites
-- and allow users to see their own accepted invite
-- ===================================================
create policy "select: org admins and accepted invites"
on public.organization_invites
for select
to authenticated
using (
  public.can_manage_organization_member(organization_id, (select auth.uid()), 'admin')
  or accepted_by = (select auth.uid())
);

-- ===================================================
-- SELECT Policy: allow anonymous users to view invite by token
-- used during invite link flow
-- ===================================================
create policy "select: anonymous by token"
on public.organization_invites
for select
to anon
using (
  expires_at > now()
  and accepted_at is null
);

-- ===================================================
-- INSERT Policy: allow admins to invite users
-- with these checks:
-- - must be inviter
-- - must be under member limit
-- - only owners can invite admins
-- ===================================================
create policy "insert: org admins with member limit"
on public.organization_invites
for insert
to authenticated
with check (
  public.can_manage_organization_member(organization_id, (select auth.uid()), 'admin')
  and invited_by = (select auth.uid())
  and public.can_add_org_member(organization_id)
  and (
    role <> 'admin'
    or public.can_manage_organization_member(organization_id, (select auth.uid()), 'owner')
  )
);

-- ===================================================
-- UPDATE Policy: allow
-- - admins to manage invites
-- - users to accept their own invite
-- Enforces:
-- - no role escalation to admin unless by owner
-- - accepted_by must match current user
-- - must be under member limit to accept
-- ===================================================
create policy "update: org admins and acceptance"
on public.organization_invites
for update
to authenticated
using (
  public.can_manage_organization_member(organization_id, (select auth.uid()), 'admin')
  or accepted_by = (select auth.uid())
)
with check (
  case 
    when role = 'admin' then 
      public.can_manage_organization_member(organization_id, (select auth.uid()), 'owner')
    else true
  end
  and
  case 
    when accepted_by is not null then 
      accepted_by = (select auth.uid())
    else true
  end
  and
  case 
    when accepted_at is not null then 
      public.can_add_org_member(organization_id)
    else true
  end
);

-- ===================================================
-- DELETE Policy: only admins and owners can delete invites
-- ===================================================
create policy "delete: org admins only"
on public.organization_invites
for delete
to authenticated
using (
  public.can_manage_organization_member(organization_id, (select auth.uid()), 'admin')
);
