-- =====================================================================
-- FUNCTION: public.insert_user_notification
-- =====================================================================
-- PURPOSE:
--   Safely insert a new user notification based on a known notification
--   type (defined in user_notifications_types table).
--
--   Handles:
--     - Validation: Ensures notification type exists
--     - Template rendering: Replaces placeholders in title/body templates
--     - Default delivery channels (in-app, email)
--     - Structured payload (JSONB)
--
-- PARAMETERS:
--   p_user_id      UUID      → User receiving the notification
--   p_type_key     TEXT      → Notification type key (enum: user_notification_key)
--   p_metadata     JSONB     → Metadata for template variables and context
--
-- RETURNS:
--   UUID → ID of the newly-created user_notification row
--
-- EXAMPLES:
--   select insert_user_notification(
--       'uuid-user',
--       'course_enrollment_free_success',
--       '{"course_title":"Intro to SQL","tier_name":"Free"}'::jsonb
--   );
--
-- NOTES:
--   - Templates use {{variable}} syntax for placeholders
--   - Basic string replacement is used (no complex templating engine)
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
  v_type_record record;
  v_notification_id uuid;
  v_title text;
  v_body text;
  v_key text;
  v_value text;
begin
  -- Log input parameters
  raise notice 'insert_user_notification called with user_id=%, type_key=%, metadata=%', 
    p_user_id, p_type_key, p_metadata;

  -- Resolve notification type and get templates
  select 
    unt.key,
    unt.title_template,
    unt.body_template,
    unt.default_in_app,
    unt.default_email
  into v_type_record
  from public.user_notifications_types as unt
  where unt.key = p_type_key::public.user_notification_key;

  if v_type_record.key is null then
    raise exception 'Unknown user_notification_key: %', p_type_key;
  end if;

  raise notice 'Resolved notification type: %', v_type_record.key;

  -- Start with templates
  v_title := v_type_record.title_template;
  v_body := v_type_record.body_template;

  -- Simple template variable replacement
  -- Replace {{key}} with value from metadata
  for v_key, v_value in
    select key, value::text
    from jsonb_each_text(p_metadata)
  loop
    v_title := replace(v_title, '{{' || v_key || '}}', v_value);
    v_body := replace(v_body, '{{' || v_key || '}}', v_value);
  end loop;

  raise notice 'Rendered title=%, body=%', v_title, v_body;

  -- Insert notification row with actual schema columns
  insert into public.user_notifications (
    user_id,
    key,
    title,
    body,
    payload,
    delivered_in_app,
    delivered_email
  ) values (
    p_user_id,
    p_type_key::public.user_notification_key,
    v_title,
    v_body,
    p_metadata,
    v_type_record.default_in_app,
    v_type_record.default_email
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