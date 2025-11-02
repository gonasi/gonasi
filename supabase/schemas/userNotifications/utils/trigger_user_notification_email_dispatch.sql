-- =============================================================================
-- FUNCTION: trigger_user_notification_email_dispatch (FIXED)
-- =============================================================================
-- PURPOSE:
--   AFTER INSERT trigger on user_notifications.
--   If the notification type has default_email = true, enqueue an email job
--   into the PGMQ queue: user_notifications_email_queue.
--
-- CHANGES:
--   - Fixed to use NEW.key instead of NEW.type_id
--   - Looks up notification type by key instead of id
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
  -- Fetch the notification type record BY KEY (not by id)
  select *
  into v_type_record
  from public.user_notifications_types
  where key = new.key;  -- ✓ FIXED: was new.type_id

  if not found then
    raise warning 'Notification type not found for key: %', new.key;
    return new;
  end if;

  -- If email is not enabled for this notification type, exit
  if v_type_record.default_email is false then
    return new;
  end if;

  -- Enqueue into the PGMQ queue (only if pgmq is installed and queue exists)
  begin
    perform pgmq.send(
      'user_notifications_email_queue',
      jsonb_build_object(
        'notification_id', new.id,
        'user_id', new.user_id,
        'type_key', new.key,
        'title', new.title,
        'body', new.body,
        'payload', new.payload
      )
    );
  exception
    when others then
      -- Don't fail the insert if pgmq isn't available
      raise warning 'Failed to enqueue email notification: %', sqlerrm;
  end;

  return new;
end;
$$;

-- Recreate the trigger
drop trigger if exists trg_user_notification_email_dispatch on public.user_notifications;

create trigger trg_user_notification_email_dispatch
after insert on public.user_notifications
for each row
execute function public.trigger_user_notification_email_dispatch();