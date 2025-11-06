-- Enable Row-Level Security on the organization_members table
alter table public.organization_members enable row level security;

-- SELECT Policy:
-- - Users can view their own membership
-- - Admins can view any member in the same organization
-- NOTE: We display users on the frontend from a view so this doesn't apply to that case
create policy "organization_members_select"                                         
on public.organization_members                                                      
for select                                                                          
to authenticated                                                                    
using (                                                                             
  user_id = (select auth.uid())                                                     
  or public.has_org_role(organization_id, 'admin', (select auth.uid()))                                  
);

-- INSERT Policy:
-- - A user can insert themselves as 'owner' (typically during org creation)
-- - Admins can add members if:
--     • Organization tier allows it
--     • They're not assigning 'admin' role (unless they are an owner)
create policy "organization_members_insert"
on public.organization_members
for insert
to authenticated
with check (
  (user_id = (select auth.uid()) and role = 'owner')
  or (
    public.has_org_role(organization_id, 'admin', (select auth.uid()))
    and public.can_accept_new_member(organization_id, 'accept')
    and (role != 'admin' or public.has_org_role(organization_id, 'owner', (select auth.uid())))
  )
);

-- UPDATE Policy:
-- - Only the organization owner can update member roles
-- - Allowed roles: 'admin' or 'editor'
-- - Owners cannot update their own membership row
create policy "organization_members_update"
on public.organization_members
for update
to authenticated
using (
  public.has_org_role(organization_id, 'owner', (select auth.uid()))
)
with check (
  user_id != (select auth.uid())
  and role in ('admin', 'editor')
);

-- DELETE Policy:
-- - Editors and admins can remove themselves (owners cannot)
-- - Admins can remove editors (not other admins or owners)
-- - Owners can remove anyone except themselves
create policy "organization_members_delete"
on public.organization_members
for delete
to authenticated
using (
  (
    -- Self-removal for editors/admins (not owners)
    user_id = (select auth.uid())
    and role != 'owner'
  )
  or (
    -- Admin removes an editor
    role = 'editor'
    and user_id != (select auth.uid())
    and public.has_org_role(organization_id, 'admin', (select auth.uid()))
  )
  or (
    -- Owner removes anyone except themselves
    user_id != (select auth.uid())
    and public.has_org_role(organization_id, 'owner', (select auth.uid()))
  )
);

-- ====================================================================================
-- TRIGGER FUNCTION: Handles user exit from organization
-- - Sets profile.mode to 'personal'
-- - Clears active_organization_id
-- - Clears course ownership for courses in the exited organization
-- ====================================================================================
create or replace function public.handle_member_exit_update_profile()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Step 1: Update profile
  update public.profiles
  set
    mode = 'personal',
    active_organization_id = null
  where id = old.user_id;

  -- Step 2: Nullify course ownership in this organization (if any)
  update public.courses
  set owned_by = null
  where organization_id = old.organization_id
    and owned_by = old.user_id;

  return old;
end;
$$;
