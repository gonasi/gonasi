alter table public.org_notification_reads enable row level security;

create policy org_notification_reads_select_own
  on public.org_notification_reads
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy org_notification_reads_insert_own
  on public.org_notification_reads
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy org_notification_reads_update_own
  on public.org_notification_reads
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy org_notification_reads_delete_own
  on public.org_notification_reads
  for delete
  to authenticated
  using (user_id = (select auth.uid()));