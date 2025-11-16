create or replace function prevent_multiple_launch_orgs()
returns trigger language plpgsql as $$
declare
  v_owner uuid;
  v_exists boolean;
begin
  -- Only enforce on launch tier INSERTs/UPDATEs
  if NEW.tier = 'launch' then
    select owned_by into v_owner
    from public.organizations
    where id = NEW.organization_id;

    select exists(
      select 1
      from public.organization_subscriptions s
      join public.organizations o on o.id = s.organization_id
      where o.owned_by = v_owner
        and s.tier = 'launch'
        and s.organization_id != NEW.organization_id
    ) into v_exists;

    if v_exists then
      raise exception 'Owner already has an organization on launch tier';
    end if;
  end if;

  return NEW;
end;
$$;

create trigger trg_prevent_multiple_launch
  before insert or update on public.organization_subscriptions
  for each row execute function prevent_multiple_launch_orgs();
