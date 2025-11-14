-- ===========================================
-- FUNCTION: is_user_already_member
-- -------------------------------------------
-- Checks if a user is already a member of an organization
-- using their email (case-insensitive).
--
-- Prevents sending invites to users who are already members.
-- ===========================================

create or replace function public.is_user_already_member(
  arg_org_id uuid,         -- Organization to check
  user_email text          -- Email of the user to check
)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members om
    join public.profiles p on om.user_id = p.id
    where om.organization_id = arg_org_id
      and lower(p.email) = lower(user_email)
  )
$$;
