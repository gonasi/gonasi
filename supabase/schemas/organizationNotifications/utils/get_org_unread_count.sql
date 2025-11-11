create or replace function public.get_org_unread_count(
  p_organization_id uuid,
  p_user_id uuid
)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member_role public.org_role;
  v_count int;
begin
  select role into v_member_role
  from public.organization_members
  where organization_id = p_organization_id
    and user_id = p_user_id;

  if v_member_role is null then
    return 0;
  end if;

  select count(*)::int into v_count
  from public.org_notifications n
  inner join public.org_notifications_types nt on nt.key = n.key
  left join public.org_notification_reads r 
    on r.notification_id = n.id and r.user_id = p_user_id
  where n.organization_id = p_organization_id
    and n.deleted_at is null
    and (r.read_at is null)
    and (r.dismissed_at is null)
    and (
      (v_member_role = 'owner' and nt.visible_to_owner) or
      (v_member_role = 'admin' and nt.visible_to_admin) or
      (v_member_role = 'editor' and nt.visible_to_editor)
    );

  return v_count;
end;
$$;