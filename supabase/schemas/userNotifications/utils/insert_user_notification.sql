-- =====================================================================
-- FUNCTION: public.insert_user_notification
-- =====================================================================
-- PURPOSE:
--   Safely insert a new user notification based on a known notification
--   type (defined in user_notification_type table).
--
--   Handles:
--     - Validation: Ensures notification type exists
--     - Default read state: unread
--     - Structured metadata (JSONB)
--     - Soft future-proofing (email dispatch trigger will hook here)
--
-- PARAMETERS:
--   p_user_id      UUID      → User receiving the notification
--   p_type_key     TEXT      → Notification type key (enum: user_notification_key)
--   p_metadata     JSONB     → Optional metadata (course name, org, etc.)
--
-- RETURNS:
--   UUID → ID of the newly-created user_notification row
--
-- EXAMPLES:
--   select insert_user_notification(
--       'uuid-user',
--       'course_purchased',
--       '{"course_id":"...","amount":1500}'::jsonb
--   );
--
-- NOTES:
--   ⚠️ Notifications are "in-app". Email triggers should be attached
--      separately via NOTIFY/LISTEN or pgmq.
-- =====================================================================
create or replace function public.insert_user_notification(
  p_user_id uuid,
  p_type_key text,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_type_id uuid;
  v_notification_id uuid;
begin
  -- Log input parameters
  raise notice 'insert_user_notification called with user_id=%, type_key=%, metadata=%', p_user_id, p_type_key, p_metadata;

  -- Resolve notification type
  select unt.id
    into v_type_id
  from public.user_notifications_types as unt
  where unt.key = p_type_key;

  raise notice 'Resolved type_id=%', v_type_id;

  if v_type_id is null then
    raise exception 'Unknown user_notification_type key: %', p_type_key;
  end if;

  -- Insert notification row
  insert into public.user_notifications (
    user_id,
    type_id,
    metadata
  ) values (
    p_user_id,
    v_type_id,
    p_metadata
  )
  returning id into v_notification_id;

  raise notice 'Inserted notification with id=%', v_notification_id;

  return v_notification_id;
exception
  when others then
    raise notice 'insert_user_notification failed: %', sqlerrm;
    raise;
end;
$$;
