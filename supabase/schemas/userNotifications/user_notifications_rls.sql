alter table public.user_notifications
  enable row level security;

-- ============================================================
-- SELECT: A user may read only their own notifications
-- ============================================================
create policy user_notifications_select_own
  on public.user_notifications
  for select
  to authenticated
  using (user_id = (select auth.uid()));


-- ============================================================
-- INSERT: A user may create a notification ONLY for themselves
-- ============================================================
create policy user_notifications_insert_own
  on public.user_notifications
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));


-- ============================================================
-- UPDATE: A user may update ONLY their own notifications
-- (Used for marking as read or soft-delete)
-- ============================================================
create policy user_notifications_update_own
  on public.user_notifications
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
