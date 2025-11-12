-- ============================================================================
-- FUNCTION: Broadcast org notification via Realtime
-- ============================================================================
create or replace function public.broadcast_org_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_type_record record;
  v_payload jsonb;
begin
  -- Get notification type info for visibility rules
  select 
    nt.visible_to_owner,
    nt.visible_to_admin,
    nt.visible_to_editor,
    nt.category
  into v_type_record
  from public.org_notifications_types nt
  where nt.key = new.key;

  if not found then
    raise warning 'Notification type not found for key: %', new.key;
    return new;
  end if;

  -- Build payload with notification data and visibility info
  v_payload := jsonb_build_object(
    'id', new.id,
    'organization_id', new.organization_id,
    'key', new.key,
    'title', new.title,
    'body', new.body,
    'link', new.link,
    'payload', new.payload,
    'created_at', new.created_at,
    'visibility', jsonb_build_object(
      'owner', v_type_record.visible_to_owner,
      'admin', v_type_record.visible_to_admin,
      'editor', v_type_record.visible_to_editor
    ),
    'category', v_type_record.category
  );

  -- Broadcast to organization channel
  -- Topic format: 'org-notifications:{organization_id}'
  perform pg_notify(
    'org-notifications:' || new.organization_id::text,
    v_payload::text
  );

  return new;
exception
  when others then
    -- Don't fail the insert if broadcast fails
    raise warning 'Failed to broadcast org notification: %', sqlerrm;
    return new;
end;
$$;

-- ============================================================================
-- TRIGGER: Broadcast after notification insert
-- ============================================================================
create trigger trg_broadcast_org_notification
after insert on public.org_notifications
for each row
execute function public.broadcast_org_notification();

