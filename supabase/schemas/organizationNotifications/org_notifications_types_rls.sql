alter table public.org_notifications_types enable row level security;

create policy org_notifications_types_select_authenticated
  on public.org_notifications_types
  for select
  to authenticated
  using (true);

create policy org_notifications_types_insert_privileged
  on public.org_notifications_types
  for insert
  to authenticated
  with check (
    authorize('go_su_create')
    OR authorize('go_admin_create')
  );

create policy org_notifications_types_update_privileged
  on public.org_notifications_types
  for update
  to authenticated
  using (
    authorize('go_su_update')
    OR authorize('go_admin_update')
  );

create policy org_notifications_types_delete_privileged
  on public.org_notifications_types
  for delete
  to authenticated
  using (
    authorize('go_su_delete')
    OR authorize('go_admin_delete')
  );