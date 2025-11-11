create or replace function public.insert_org_notification(
  p_organization_id uuid,
  p_type_key text,
  p_metadata jsonb default '{}'::jsonb,
  p_link text default null
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
  raise notice 'insert_org_notification called with org_id=%, type_key=%, metadata=%, link=%', 
    p_organization_id, p_type_key, p_metadata, p_link;

  -- Get notification type
  select 
    ont.key,
    ont.title_template,
    ont.body_template,
    ont.default_in_app,
    ont.default_email
  into v_type_record
  from public.org_notifications_types as ont
  where ont.key = p_type_key::public.org_notification_key;

  if v_type_record.key is null then
    raise exception 'Unknown org_notification_key: %', p_type_key;
  end if;

  raise notice 'Resolved org notification type: %', v_type_record.key;

  -- Render title and body templates
  v_title := v_type_record.title_template;
  v_body := v_type_record.body_template;

  for v_key, v_value in
    select key, value::text
    from jsonb_each_text(p_metadata)
  loop
    v_title := replace(v_title, '{{' || v_key || '}}', v_value);
    v_body := replace(v_body, '{{' || v_key || '}}', v_value);
  end loop;

  raise notice 'Rendered title=%, body=%', v_title, v_body;

  -- Insert notification
  insert into public.org_notifications (
    organization_id,
    key,
    title,
    body,
    link,
    payload,
    delivered_in_app,
    delivered_email
  ) values (
    p_organization_id,
    p_type_key::public.org_notification_key,
    v_title,
    v_body,
    p_link,
    p_metadata,
    v_type_record.default_in_app,
    v_type_record.default_email
  )
  returning id into v_notification_id;

  raise notice 'Inserted org notification with id=%', v_notification_id;

  return v_notification_id;
exception
  when others then
    raise notice 'insert_org_notification failed: %', sqlerrm;
    raise;
end;
$$;
