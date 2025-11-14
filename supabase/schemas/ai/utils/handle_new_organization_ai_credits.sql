-- ============================================================
-- Trigger Function: public.handle_new_organization_ai_credits
-- ------------------------------------------------------------
-- Purpose:
--   Automatically creates an initial AI credits record for a newly
--   inserted organization, based on its **active subscription tier**.
--
-- Workflow:
--   1. Looks up the organization's active subscription in
--      `organization_subscriptions`.
--   2. Retrieves the monthly AI credit limit from `tier_limits`.
--   3. Fallback: if no tier or limit found, defaults to 100 credits.
--   4. Inserts a new row into `organizations_ai_credits` with:
--        - base_credits_total / base_credits_remaining
--        - purchased_credits_total / purchased_credits_remaining (0)
--        - last_reset_at = now()
--        - next_reset_at = now() + 1 month
--        - updated_at = now()
--   5. Prevents duplicate inserts using `ON CONFLICT (org_id) DO NOTHING`.
--
-- Notes:
--   - SECURITY DEFINER ensures the function can read subscriptions
--     even if called by a limited-privilege role.
--   - `search_path` is cleared to prevent schema resolution issues.
--   - Only considers **active subscriptions** (`status = 'active'`).
--
-- Trigger:
--   - Fires **AFTER INSERT** on `organizations`.
--   - Executes once per new row.
--
-- Example:
--   -- When a new organization is created:
--   insert into organizations (name, handle, owned_by)
--   values ('Acme Corp', 'acme', '9a7c1e2f-1234-5678-90ab-cdef12345678');
--   -- The trigger automatically inserts AI credits for this org.
-- ============================================================
create or replace function public.handle_new_organization_ai_credits()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  monthly_limit int;
begin
  -- Look up monthly AI credit limit based on the organization's active subscription
  select tl.ai_usage_limit_monthly
  into monthly_limit
  from public.organization_subscriptions s
  join public.tier_limits tl on tl.tier = s.tier
  where s.organization_id = new.id
    and s.status = 'active'
  limit 1;

  -- Fallback to 100 if no tier found or limit is null
  if monthly_limit is null then
    monthly_limit := 100;
  end if;

  -- Insert initial AI credits for the organization
  insert into public.organizations_ai_credits (
    org_id,
    base_credits_total,
    base_credits_remaining,
    purchased_credits_total,
    purchased_credits_remaining,
    last_reset_at,
    next_reset_at,
    updated_at
  )
  values (
    new.id,
    monthly_limit,
    monthly_limit,
    0,
    0,
    now(),
    now() + interval '1 month',
    now()
  )
  on conflict (org_id) do nothing;  -- Prevent duplicate inserts

  return new;
end;
$$;


-- ============================================================
-- Trigger: trg_create_org_ai_credits
-- ------------------------------------------------------------
-- Purpose:
--   Fires AFTER INSERT on the `organizations` table to execute
--   the `handle_new_organization_ai_credits` function.
--
-- Behavior:
--   - Executes for each newly inserted organization.
--   - Ensures initial AI credits are created automatically.
-- ============================================================
drop trigger if exists trg_create_org_ai_credits on public.organizations;

create trigger trg_create_org_ai_credits
after insert on public.organizations
for each row
execute function public.handle_new_organization_ai_credits();
