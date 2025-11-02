-- =============================================================================
-- FUNCTION: trigger_user_notification_email_dispatch
-- =============================================================================
-- PURPOSE:
--   AFTER INSERT trigger on user_notifications.
--   If the notification type has send_email = true, enqueue an email job
--   into the PGMQ queue: user_notifications_email_queue.
--
-- NOTES:
--   - Email sending happens asynchronously in the edge worker.
--   - Prevents any blocking during notification creation.
-- =============================================================================
create or replace function public.trigger_user_notification_email_dispatch()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_type_record public.user_notifications_types;
begin
  -- Fetch the notification type record
  select *
  into v_type_record
  from public.user_notifications_types
  where id = new.type_id;

  -- If email is not enabled for this notification type, exit
  if v_type_record.send_email is false then
    return new;
  end if;

  -- Enqueue into the PGMQ queue
  perform public.pgmq.send(
    'user_notifications_email_queue',
    jsonb_build_object(
      'user_id', new.user_id,
      'type_key', v_type_record.key,
      'metadata', new.metadata
    )
  );

  return new;
end;
$$;

drop trigger if exists trg_user_notification_email_dispatch on public.user_notifications;

create trigger trg_user_notification_email_dispatch
after insert on public.user_notifications
for each row
execute function public.trigger_user_notification_email_dispatch();
