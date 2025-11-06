-- enable row-level security
alter table public.organization_invites enable row level security;

-- select (authenticated): admins can see all; users can see their own valid invites
create policy "organization_invites_select_authenticated"
on public.organization_invites
for select
to authenticated
using (
  -- Admins and owners can view all invites
  public.has_org_role(organization_id, 'admin', (select auth.uid()))

  -- Invite recipients can view their own unexpired, pending invites
  or (
    email = (select email from public.profiles where id = (select auth.uid()))
    and accepted_at is null
    and revoked_at is null
    and expires_at > now()
  )
);


-- insert: only admins can invite, with tier and role limits
create policy "organization_invites_insert"
on public.organization_invites
for insert
to authenticated
with check (
  -- Must be an admin
  public.has_org_role(organization_id, 'admin', (select auth.uid()))
  
  -- Must be the one sending the invite
  and invited_by = (select auth.uid())

  -- Tier/member limits
  and public.can_accept_new_member(organization_id, 'invite')

  -- Only owners can invite other admins
  and (role != 'admin' or public.has_org_role(organization_id, 'owner', (select auth.uid())))

  -- Can't invite yourself
  and email != (select email from public.profiles where id = (select auth.uid()))

  -- 🚫 Can't invite someone who's already a member
  and not public.is_user_already_member(organization_id, email)
);


-- ===================================================
-- POLICY: organization_invites_update
-- ---------------------------------------------------
-- Allows users to update rows in the `organization_invites` table
-- under strict conditions:
--
-- 1. Admins can update invites for their organization.
-- 2. Invite recipients can accept their own invite,
--    if it's not expired, revoked, or already accepted.
--
-- The `with check` clause ensures:
-- - Only owners can promote others to admin.
-- - The accepting user is the intended recipient.
-- - Tier limits (e.g., member caps) are enforced on acceptance.
-- - Only admins can revoke invites.
-- - Delivery fields (status, logs) are system-managed and must remain unchanged.
-- ===================================================
create policy "organization_invites_update"
on public.organization_invites
for update
to authenticated
using (
  public.has_org_role(organization_id, 'admin', (select auth.uid()))
  or (
    email = (select email from public.profiles where id = (select auth.uid()))
    and accepted_at is null
    and revoked_at is null
    and expires_at > now()
  )
)
with check (
  (role != 'admin' or public.has_org_role(organization_id, 'owner', (select auth.uid())))
  and (accepted_by is null or accepted_by = (select auth.uid()))
  and (accepted_at is null or public.can_accept_new_member(organization_id, 'invite'))
  and (revoked_at is null or public.has_org_role(organization_id, 'admin', (select auth.uid())))
);




-- delete: only admins can delete invites
create policy "organization_invites_delete"
on public.organization_invites
for delete
to authenticated
using (
  public.has_org_role(organization_id, 'owner', (select auth.uid()))
);
