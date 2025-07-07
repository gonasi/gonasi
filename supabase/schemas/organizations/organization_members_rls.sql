-- enable row-level security
alter table public.organization_members enable row level security;

-- select: members can view their own memberships or others in the same org if admin
create policy "organization_members_select"                                         
on public.organization_members                                                      
for select                                                                          
to authenticated                                                                    
using (                                                                             
  user_id = (select auth.uid())                                                     
  or public.has_org_role(organization_id, 'admin', (select auth.uid()))                                  
);


-- insert: allow self-insert as owner, or allow admins to add members (with limits)
create policy "organization_members_insert"
on public.organization_members
for insert
to authenticated
with check (
  -- self-insert as owner (during org creation)
  (user_id = (select auth.uid()) and role = 'owner')
  -- or added by admin (and within tier limits)
  or (
    public.has_org_role(organization_id, 'admin', (select auth.uid()))
    and public.can_accept_new_member(organization_id)
    and (role != 'admin' or public.has_org_role(organization_id, 'owner', (select auth.uid())))
  )
);


-- update: only admins can update members, with role restrictions
create policy "organization_members_update"
on public.organization_members
for update
to authenticated
using (
  public.has_org_role(organization_id, 'admin', (select auth.uid()))
)
with check (
  -- only owners can promote to admin
  (role != 'admin' or public.has_org_role(organization_id, 'owner', (select auth.uid())))
  -- prevent demoting yourself if you're the only owner
  and (
    role != 'owner'
    or user_id != (select auth.uid())
    or exists (
      select 1
      from public.organization_members om
      where om.organization_id = organization_members.organization_id
        and om.role = 'owner'
        and om.user_id != (select auth.uid())
    )
  )
);


-- This policy governs who is allowed to delete rows from the `organization_members` table.
-- It supports the following rules:
--   1. Editors and admins can remove themselves.
--   2. Admins can remove non-admins (i.e., editors), but not themselves or owners.
--   3. Owners can remove anyone except themselves.

create policy "organization_members_delete"
on public.organization_members
for delete
to authenticated
using (
  (
    -- Rule 1: editors and admins can delete themselves
    user_id = (select auth.uid())       -- this is the current user
    and role != 'owner'        -- owners are not allowed to delete themselves
  )
  or (
    -- Rule 2: an admin can remove an editor (but not themselves or other admins/owners)
    role = 'editor'                                      -- target is an editor
    and user_id != (select auth.uid())                            -- cannot remove themselves
    and public.has_org_role(organization_id, 'admin', (select auth.uid()))  -- current user is an admin
  )
  or (
    -- Rule 3: an owner can remove anyone except themselves
    user_id != (select auth.uid())                                -- cannot remove themselves
    and public.has_org_role(organization_id, 'owner', (select auth.uid()))  -- current user is an owner
  )
);


-- This function is triggered after a row in `organization_members` is deleted.
-- It updates the corresponding user’s profile in `public.profiles`:
--   - Sets their mode to 'personal'
--   - Clears their `active_organization_id`
create or replace function public.handle_organization_member_delete()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Use fully-qualified table name to avoid relying on search_path
  update public.profiles
  set
    mode = 'personal',
    active_organization_id = null
  where id = old.user_id;

  return old;
end;
$$;


-- This trigger runs the above function *after* any row is deleted from `organization_members`.
-- It ensures the user’s profile reflects the change in membership.

create trigger on_member_delete_set_profile_personal
after delete on public.organization_members
for each row
execute procedure public.handle_organization_member_delete();
