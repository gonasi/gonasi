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


-- delete: 
-- - editors and admins can remove themselves
-- - admins can remove non-admins (editors)
-- - owners can remove anyone except themselves
create policy "organization_members_delete"
on public.organization_members
for delete
to authenticated
using (
  (
    -- self-deletion for admins and editors
    user_id = auth.uid()
    and role != 'owner'
  )
  or (
    -- admin removing editor (not themselves)
    role = 'editor'
    and user_id != auth.uid()
    and public.has_org_role(organization_id, 'admin', auth.uid())
  )
  or (
    -- owner removing anyone except themselves
    user_id != auth.uid()
    and public.has_org_role(organization_id, 'owner', auth.uid())
  )
);
