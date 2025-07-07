create or replace function public.get_active_organization_members(
  _organization_id uuid,
  _user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  -- Ensure the calling user is part of the organization
  if not exists (
    select 1
    from public.organization_members
    where organization_id = _organization_id
      and user_id = _user_id
  ) then
    raise exception 'Access denied: you are not a member of this organization';
  end if;

  -- Fetch all members in the organization
  select jsonb_agg(jsonb_build_object(
    'user', jsonb_build_object(
      'id', u.id,
      'username', u.username,
      'full_name', u.full_name,
      'avatar_url', u.avatar_url,
      'blur_hash', u.blur_hash,
      'phone_number', u.phone_number,
      'country_code', u.country_code,
      'active_organization_id', u.active_organization_id
    ),
    'invited_by', case
      when inviter.id is not null then jsonb_build_object(
        'id', inviter.id,
        'username', inviter.username,
        'full_name', inviter.full_name,
        'avatar_url', inviter.avatar_url,
        'blur_hash', inviter.blur_hash
      )
      else null
    end,
    'membership_id', m.id,
    'organization_id', m.organization_id,
    'role', m.role,
    'membership_created_at', m.created_at,
    'membership_updated_at', m.updated_at
  ))
  into result
  from public.organization_members m
  join public.profiles u on u.id = m.user_id
  left join public.profiles inviter on inviter.id = m.invited_by
  where m.organization_id = _organization_id;

  return coalesce(result, '[]'::jsonb);
end;
$$;
