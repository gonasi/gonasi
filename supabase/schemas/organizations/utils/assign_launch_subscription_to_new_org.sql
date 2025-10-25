-- ==========================================================
-- FUNCTION: assign_launch_subscription_to_new_org
-- ==========================================================
-- Purpose:
--   Automatically assign every newly created organization
--   a default "launch" subscription (free tier).
--
-- Security:
--   - Declared as SECURITY DEFINER so it can insert into
--     organization_subscriptions even if the caller has limited rights.
--   - Sets search_path = '' to eliminate schema lookup risk.
--     All objects must be explicitly schema-qualified (public.table_name).
--
-- Trigger Timing:
--   AFTER INSERT on public.organizations
--
-- Behavior:
--   - Inserts a "launch" subscription with status 'active'
--   - Skips creation if a subscription already exists
--   - Uses UTC timestamps for start and current period fields
--
-- Notes:
--   - The 'launch' tier never expires (current_period_end = NULL)
-- ==========================================================
create or replace function public.assign_launch_subscription_to_new_org()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Skip if this organization already has a subscription (safety check)
  if exists (
    select 1
    from public.organization_subscriptions s
    where s.organization_id = new.id
  ) then
    return new;
  end if;

  -- Insert default subscription record
  insert into public.organization_subscriptions (
    organization_id,
    tier,
    status,
    start_date,
    current_period_start,
    current_period_end,
    created_by,
    updated_by
  )
  values (
    new.id,                 -- new organization ID
    'launch',               -- default free tier
    'active',               -- active subscription
    timezone('utc', now()), -- subscription start date
    timezone('utc', now()), -- current period start
    null,                   -- 'launch' tier has no expiry
    new.created_by,         -- who created the organization (if tracked)
    new.created_by
  );

  return new;
end;
$$;


-- ==========================================================
-- TRIGGER: trg_assign_launch_subscription
-- ==========================================================
-- Fires AFTER each new organization is created.
-- Ensures every organization starts with a default "launch" subscription.
-- ==========================================================
create trigger trg_assign_launch_subscription
after insert on public.organizations
for each row
execute function public.assign_launch_subscription_to_new_org();
