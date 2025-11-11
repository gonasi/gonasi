alter table public.org_notifications enable row level security;

create policy org_notifications_select_member
  on public.org_notifications
  for select
  to authenticated
  using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = org_notifications.organization_id
        and om.user_id = (select auth.uid())
    )
  );