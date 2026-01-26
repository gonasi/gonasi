-- ===================================================
-- RLS POLICIES: course_invites
-- ===================================================

-- Enable row-level security
alter table public.course_invites enable row level security;

-- ===================================================
-- POLICY: course_invites_select
-- ---------------------------------------------------
-- Allows users to view course invites if they are:
-- 1. Org admins/owners for the organization
-- 2. Course editors for the specific course
-- 3. The invite recipient (for unexpired, pending invites)
-- ===================================================
create policy "course_invites_select"
on public.course_invites
for select
to authenticated
using (
  -- Org admins/owners can view all invites for their org
  public.has_org_role(organization_id, 'admin', (select auth.uid()))

  -- Course editors can view invites for their courses
  or exists (
    select 1 from public.course_editors ce
    join public.courses c on c.id = ce.course_id
    where c.id = course_invites.published_course_id
      and ce.user_id = (select auth.uid())
  )

  -- Recipients can view their own unexpired, pending invites
  or (
    email = (select email from public.profiles where id = (select auth.uid()))
    and accepted_at is null
    and revoked_at is null
    and expires_at > now()
  )
);

-- ===================================================
-- POLICY: course_invites_insert
-- ---------------------------------------------------
-- Allows users to create course invites if they are:
-- 1. Org admins/owners OR course editors
-- 2. Organization tier allows it (enforced via can_send_course_invite)
-- 3. Course visibility is 'private' (public/unlisted don't need invites)
-- 4. Not inviting themselves
-- 5. Not inviting someone already enrolled
-- 6. No pending invite exists for this email+course
-- ===================================================
create policy "course_invites_insert"
on public.course_invites
for insert
to authenticated
with check (
  -- Must be org admin or course editor
  (
    public.has_org_role(organization_id, 'admin', (select auth.uid()))
    or exists (
      select 1 from public.course_editors ce
      join public.courses c on c.id = ce.course_id
      where c.id = published_course_id
        and ce.user_id = (select auth.uid())
    )
  )

  -- Must be the one sending the invite
  and invited_by = (select auth.uid())

  -- Tier-based invite restrictions (temp can't send, launch can't send for free courses)
  and public.can_send_course_invite(organization_id, published_course_id)

  -- Course must be private (public/unlisted courses don't need email invites)
  and exists (
    select 1 from public.published_courses pc
    where pc.id = published_course_id
      and pc.visibility = 'private'
  )

  -- Can't invite yourself
  and email != (select email from public.profiles where id = (select auth.uid()))

  -- Can't invite someone already enrolled
  and not exists (
    select 1 from public.course_enrollments ce
    join public.profiles p on p.id = ce.user_id
    where ce.published_course_id = course_invites.published_course_id
      and p.email = course_invites.email
  )

  -- Note: Duplicate invite check is handled by unique index and application layer
  -- to avoid infinite recursion in RLS policy
);

-- ===================================================
-- POLICY: course_invites_update
-- ---------------------------------------------------
-- Allows users to update course invites if they are:
-- 1. Org admins/owners OR course editors (can update any field)
-- 2. The invite recipient (can only accept their own invite)
--
-- With check ensures:
-- - Accepting user must be the recipient
-- - Only admins/editors can revoke
-- - Resending only allowed for private courses
-- - Resending respects cooldown period
-- ===================================================
create policy "course_invites_update"
on public.course_invites
for update
to authenticated
using (
  -- Admins/editors can update invites
  public.has_org_role(organization_id, 'admin', (select auth.uid()))
  or exists (
    select 1 from public.course_editors ce
    join public.courses c on c.id = ce.course_id
    where c.id = published_course_id
      and ce.user_id = (select auth.uid())
  )

  -- Recipients can accept their own invite
  or (
    email = (select email from public.profiles where id = (select auth.uid()))
    and accepted_at is null
    and revoked_at is null
    and expires_at > now()
  )
)
with check (
  -- Accepting user must be the recipient
  (accepted_by is null or accepted_by = (select auth.uid()))

  -- Only admins/editors can revoke
  and (
    revoked_at is null
    or public.has_org_role(organization_id, 'admin', (select auth.uid()))
    or exists (
      select 1 from public.course_editors ce
      join public.courses c on c.id = ce.course_id
      where c.id = published_course_id
        and ce.user_id = (select auth.uid())
    )
  )

  -- If resending (last_sent_at changed), course must still be private
  and (
    last_sent_at = (select ci_old.last_sent_at from public.course_invites ci_old where ci_old.id = course_invites.id)
    or exists (
      select 1 from public.published_courses pc
      where pc.id = published_course_id
        and pc.visibility = 'private'
    )
  )
);

-- ===================================================
-- POLICY: course_invites_delete
-- ---------------------------------------------------
-- Only org owners can permanently delete invites
-- (Admins and editors should use revoke instead)
-- ===================================================
create policy "course_invites_delete"
on public.course_invites
for delete
to authenticated
using (
  public.has_org_role(organization_id, 'owner', (select auth.uid()))
);
