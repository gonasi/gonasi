create or replace function public.get_org_notifications_for_member(
  p_organization_id uuid,
  p_user_id uuid,
  p_limit int default 50,
  p_offset int default 0
)
returns table (
  id uuid,
  organization_id uuid,
  key public.org_notification_key,
  category public.org_notification_category,
  title text,
  body text,
  link text,
  payload jsonb,
  created_at timestamptz,
  read_at timestamptz,
  dismissed_at timestamptz,
  is_read boolean,
  is_dismissed boolean,
  visibility jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member_role public.org_role;
  v_member_joined_at timestamptz;
begin
  -- Get member's role and join timestamp
  select om.role, om.updated_at
    into v_member_role, v_member_joined_at
  from public.organization_members om
  where om.organization_id = p_organization_id
    and om.user_id = p_user_id;

  if v_member_role is null then
    raise exception 'User % is not a member of organization %',
      p_user_id, p_organization_id;
  end if;

  return query
  select
    n.id,
    n.organization_id,
    n.key,
    nt.category,
    n.title,
    n.body,
    n.link,
    n.payload,
    n.created_at,
    r.read_at,
    r.dismissed_at,
    (r.read_at is not null) as is_read,
    (r.dismissed_at is not null) as is_dismissed,
    jsonb_build_object(
      'owner', nt.visible_to_owner,
      'admin', nt.visible_to_admin,
      'editor', nt.visible_to_editor
    ) as visibility
  from public.org_notifications n
  join public.org_notifications_types nt
    on nt.key = n.key
  left join public.org_notification_reads r
    on r.notification_id = n.id
    and r.user_id = p_user_id
  where n.organization_id = p_organization_id
    and n.deleted_at is null
    and r.dismissed_at is null
    and n.created_at >= v_member_joined_at
    and (
      (v_member_role = 'owner'  and nt.visible_to_owner)
      or (v_member_role = 'admin'  and nt.visible_to_admin)
      or (v_member_role = 'editor' and nt.visible_to_editor)
    )
  order by n.created_at desc
  limit p_limit
  offset p_offset;
end;
$$;
