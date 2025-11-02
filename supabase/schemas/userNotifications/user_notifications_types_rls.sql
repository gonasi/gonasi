-- RLS
alter table public.user_notifications_types enable row level security;

-- ============================================================
-- SELECT: Only authenticated users should read
-- ============================================================
create policy user_notifications_types_select_authenticated
  on public.user_notifications_types
  for select
  to authenticated
  using (true);


-- ============================================================
-- INSERT: authenticated users who are go_su_create OR go_admin
-- ============================================================
create policy user_notifications_types_insert_privileged
  on public.user_notifications_types
  for insert
  to authenticated
  with check (
    authorize('go_su_create')
    OR authorize('go_admin_create')
  );


-- ============================================================
-- UPDATE: authenticated users who are go_su_update OR go_admin
-- ============================================================
create policy user_notifications_types_update_privileged
  on public.user_notifications_types
  for update
  to authenticated
  using (
    authorize('go_su_update')
    OR authorize('go_admin_update')
  );


-- ============================================================
-- DELETE: authenticated users who are go_su_delete OR go_admin
-- ============================================================
create policy user_notifications_types_delete_privileged
  on public.user_notifications_types
  for delete
  to authenticated
  using (
    authorize('go_su_delete')
    OR authorize('go_admin_delete')
  );
