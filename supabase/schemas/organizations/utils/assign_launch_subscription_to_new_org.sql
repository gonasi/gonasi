-- ==========================================================
-- FUNCTION: assign_default_subscription_to_new_org
-- ==========================================================
-- Purpose:
--   Automatically assign a subscription to every newly created organization:
--     - First org: "launch"
--     - Subsequent orgs: "temp"
-- ==========================================================
create or replace function public.assign_default_subscription_to_new_org()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := new.owned_by;
  v_tier public.subscription_tier;
begin
    -- Safety check: skip if organization already has a subscription
    if exists (
      select 1
      from public.organization_subscriptions s
      where s.organization_id = new.id
    ) then
        return new;
    end if;

    -- Determine tier: launch for first org, temp otherwise
    if not exists (
        select 1 
        from public.organizations o
        join public.organization_subscriptions s
        on o.id = s.organization_id
        where o.owned_by = v_user_id
          and s.tier = 'launch'
    ) then
        v_tier := 'launch';
    else
        v_tier := 'temp';
    end if;

    -- Insert default subscription
    insert into public.organization_subscriptions (
      organization_id,
      tier,
      status,
      start_date,
      current_period_start,
      current_period_end,
      created_by,
      updated_by
    ) values (
      new.id,
      v_tier,
      'active',
      timezone('utc', now()),
      timezone('utc', now()),
      -- current_period_end is NULL for launch or temp
      case when v_tier in ('launch', 'temp') then null else timezone('utc', now()) + interval '30 days' end,
      new.created_by,
      new.created_by
    );

    return new;
end;
$$;

-- ==========================================================
-- TRIGGER: trg_assign_default_subscription
-- ==========================================================
create trigger trg_assign_default_subscription
after insert on public.organizations
for each row
execute function public.assign_default_subscription_to_new_org();
