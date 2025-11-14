-- ===========================================
-- FUNCTION: has_pending_invite
-- -------------------------------------------
-- Checks if a user already has a pending invitation 
-- to join an organization (case-insensitive email).
--
-- A pending invite is one that:
-- - has not been accepted
-- - has not been revoked
-- - has not expired
-- ===========================================

create or replace function public.has_pending_invite(
  arg_org_id uuid,         -- Organization to check
  user_email text          -- Email of user to check
)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_invites oi
    where oi.organization_id = arg_org_id
      and lower(oi.email) = lower(user_email)
      and oi.accepted_at is null
      and oi.revoked_at is null
      and oi.expires_at > now()
  );
$$;

