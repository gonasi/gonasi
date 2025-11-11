create or replace function public.dismiss_org_notification(
  p_notification_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.org_notification_reads (
    notification_id,
    user_id,
    read_at,
    dismissed_at
  ) values (
    p_notification_id,
    p_user_id,
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict (notification_id, user_id)
  do update set 
    dismissed_at = timezone('utc', now()),
    read_at = coalesce(org_notification_reads.read_at, timezone('utc', now()));
end;
$$;