alter table public.org_notifications enable row level security;

-- Create enhanced policy that respects role-based visibility
create policy org_notifications_select_member_with_role_check
  on public.org_notifications
  for select
  to authenticated
  using (
    exists (
      select 1 
      from public.organization_members om
      inner join public.org_notifications_types nt on nt.key = org_notifications.key
      where om.organization_id = org_notifications.organization_id
        and om.user_id = (select auth.uid())
        and org_notifications.deleted_at is null
        and org_notifications.created_at >= om.updated_at
        and (
          (om.role = 'owner' and nt.visible_to_owner) or
          (om.role = 'admin' and nt.visible_to_admin) or
          (om.role = 'editor' and nt.visible_to_editor)
        )
    )
  );