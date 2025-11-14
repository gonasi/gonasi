-- enable row-level security
alter table public.organizations enable row level security;

-- select: allow viewing public orgs, owned orgs, or orgs user is a member of
create policy "organizations_select"
on public.organizations
for select
to public
using (
  is_public = true
  or owned_by = (select auth.uid())
  or exists (
    select 1
    from public.organization_members om
    where om.organization_id = organizations.id
      and om.user_id = (select auth.uid())
  )
);

-- insert: authenticated users can create orgs within tier limits
create policy "organizations_insert"
on public.organizations
for insert
to authenticated
with check (
  owned_by = (select auth.uid())
  and public.can_create_organization((select auth.uid()))
);

-- update: owners or admins can update, but only owners can transfer ownership
create policy "organizations_update"
on public.organizations
for update
to authenticated
using (
  owned_by = (select auth.uid())
  or public.has_org_role(id, 'admin', (select auth.uid()))
)
with check (
  -- only owners or existing admins can set the owner
  (
    owned_by = (select auth.uid())
    or public.has_org_role(id, 'admin', owned_by)
  )
  -- other fields can be updated by owners or admins
  and (
    owned_by = (select auth.uid())
    or public.has_org_role(id, 'admin', (select auth.uid()))
  )
);


-- delete: only the owner can delete the organization
create policy "organizations_delete"
on public.organizations
for delete
to authenticated
using (
  owned_by = (select auth.uid())
);
