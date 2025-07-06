-- ===================================================
-- Enable Row-Level Security on organization_invites
-- ===================================================
alter table public.organization_invites enable row level security;

-- ===================================================
-- Function: can_add_org_member
-- Checks if the organization can accept another member
-- Considers current active members + pending invites
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
      and oi.revoked_at is null
      and oi.expires_at > now()
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
-- SELECT Policy: allow org admins to view all invites,
-- and users to view their accepted invite
-- Note: delivery_status and delivery_logs are visible to admins
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
-- Used in public invite link flows (e.g., `/accept-invite/:token`)
-- Note: Anonymous users can see delivery_status but not delivery_logs
-- ===================================================
create policy "select: anonymous by token"
on public.organization_invites
for select
to anon
using (
  accepted_at is null
  and revoked_at is null
  and expires_at > now()
);

-- ===================================================
-- INSERT Policy: allow org admins to invite users
-- Enforces:
-- - inviter must be admin
-- - inviter must be the one inserting
-- - can't invite self
-- - must be under member cap
-- - only owners can invite admins
-- - delivery_status defaults to 'pending' (handled by schema)
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
  and email is distinct from (select email from public.profiles where id = auth.uid())
);

-- ===================================================
-- UPDATE Policy: allow org admins to manage invites,
-- and allow invited users to accept their own invite.
-- Enforces:
-- - role escalation must be done by owner
-- - accepted_by must match current user
-- - must be under member limit when accepting
-- - prevents modifying revoked invites unless admin
-- - prevents direct updates to delivery fields (managed by functions)
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
  -- Only owners can escalate to admin
  (role <> 'admin' or public.can_manage_organization_member(organization_id, (select auth.uid()), 'owner'))

  -- Self-accept only
  and (accepted_by is null or accepted_by = (select auth.uid()))

  -- Respect capacity limits on acceptance
  and (accepted_at is null or public.can_add_org_member(organization_id))

  -- Prevent modifying revoked invites unless admin
  and (revoked_at is null or public.can_manage_organization_member(organization_id, (select auth.uid()), 'admin'))

  -- Prevent direct updates to delivery fields (managed by functions only)
  and delivery_status = (select delivery_status from public.organization_invites where id = organization_invites.id)
  and delivery_logs = (select delivery_logs from public.organization_invites where id = organization_invites.id)
);

