-- ===================================================
-- Function: Automatically add owner to organization_members
-- ===================================================
create or replace function public.add_or_update_owner_in_organization_members()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- On insert: add initial owner
  if tg_op = 'INSERT' and new.owned_by is not null then
    insert into public.organization_members (
      organization_id,
      user_id,
      role,
      invited_by
    )
    values (
      new.id,
      new.owned_by,
      'owner',
      new.owned_by
    )
    on conflict do nothing;

  -- On update: ownership transfer
  elsif tg_op = 'UPDATE' and new.owned_by is distinct from old.owned_by then
    if new.owned_by is not null then
      insert into public.organization_members (
        organization_id,
        user_id,
        role,
        invited_by
      )
      values (
        new.id,
        new.owned_by,
        'owner',
        new.owned_by
      )
      on conflict do nothing;
    end if;
  end if;

  return new;
end;
$$;

-- ===================================================
-- Trigger: Add owner to organization_members on INSERT
-- ===================================================
create trigger trg_insert_owner_into_organization_members
after insert on public.organizations
for each row
execute function public.add_or_update_owner_in_organization_members();

-- ===================================================
-- Trigger: Add new owner to organization_members on ownership transfer
-- ===================================================
create trigger trg_update_owner_into_organization_members
after update on public.organizations
for each row
when (old.owned_by is distinct from new.owned_by)
execute function public.add_or_update_owner_in_organization_members();
