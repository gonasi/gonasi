-- =============================================================================
-- FUNCTION: trigger_org_notification_email_dispatch
-- =============================================================================
-- PURPOSE:
--   AFTER INSERT trigger on org_notifications.
--   Enqueues email notifications asynchronously to organization members
--   based on notification type settings.
--
--   Key behaviors:
--     - Only sends emails if the notification type has default_email = true.
--     - Only sends emails to members whose role is allowed by visible_to_* flags.
--     - Includes optional `link` field if provided.
--     - Fails gracefully if notification type or queue is missing.
--
-- SECURITY:
--   SECURITY DEFINER to allow access to org_notifications_types and organization_members.
--
-- NOTES:
--   - Actual email sending is handled asynchronously by the edge function
--     processing the pgmq queue.
-- =============================================================================
create or replace function public.trigger_org_notification_email_dispatch()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_type_record public.org_notifications_types;
  v_recipient_emails text[];
begin
  -- Fetch the notification type record by key
  select *
  into v_type_record
  from public.org_notifications_types
  where key = new.key;

  if not found then
    raise warning 'Org notification type not found for key: %', new.key;
    return new;
  end if;

  -- Skip if email delivery not enabled
  if v_type_record.default_email is false then
    return new;
  end if;

  -- Build recipient email array based on org members and role visibility
  select array_agg(u.email)
  into v_recipient_emails
  from public.organization_members m
  join auth.users u on u.id = m.user_id
  where m.organization_id = new.organization_id
    and (
      (m.role = 'owner' and v_type_record.visible_to_owner) or
      (m.role = 'admin' and v_type_record.visible_to_admin) or
      (m.role = 'editor' and v_type_record.visible_to_editor)
    );

  if v_recipient_emails is null or array_length(v_recipient_emails, 1) = 0 then
    raise notice 'No matching org members to send email for notification: %', new.id;
    return new;
  end if;

  -- Enqueue into PGMQ queue for async email delivery
  begin
    perform pgmq.send(
      'org_notifications_email_queue',
      jsonb_build_object(
        'notification_id', new.id,
        'organization_id', new.organization_id,
        'type_key', new.key,
        'title', new.title,
        'body', new.body,
        'payload', new.payload,
        'link', new.link,  -- ✅ Include optional link
        'emails', v_recipient_emails
      )
    );
  exception
    when others then
      raise warning 'Failed to enqueue org email notification: %', sqlerrm;
  end;

  return new;
end;
$$;

-- =============================================================================
-- TRIGGER: org_notifications_email_dispatch_trigger
-- =============================================================================
drop trigger if exists org_notifications_email_dispatch_trigger on public.org_notifications;

create trigger org_notifications_email_dispatch_trigger
after insert
on public.org_notifications
for each row
execute function public.trigger_org_notification_email_dispatch();
