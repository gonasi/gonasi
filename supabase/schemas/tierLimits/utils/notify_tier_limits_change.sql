-- ============================================================
-- FUNCTION: notify_tier_limits_change()
-- Description: Calls an Edge Function whenever tier_limits are
--              inserted or updated.
-- ============================================================

create or replace function public.notify_tier_limits_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  project_url text;
  publishable_key text;
  endpoint text;
begin
  -- Fetch secrets inline from Vault (explicit schema)
  select decrypted_secret into project_url 
  from vault.decrypted_secrets 
  where name = 'project_url';

  select decrypted_secret into publishable_key
  from vault.decrypted_secrets
  where name = 'publishable_key';

  -- Build Edge Function URL
  endpoint := project_url || '/functions/v1/tier-limits-updated';

  -- Call Edge Function (explicit extension schema)
  perform net.http_post(
    url := endpoint,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || publishable_key
    ),
    body := jsonb_build_object(
      'event', TG_OP,
      'table', TG_TABLE_NAME,
      'row', row_to_json(NEW)
    )
  );

  return NEW;
end;
$$;


-- ============================================================
-- TRIGGER 1: After INSERT on tier_limits
-- ============================================================

drop trigger if exists tr_after_insert_tier_limits_notify 
on public.tier_limits;

create trigger tr_after_insert_tier_limits_notify
after insert on public.tier_limits
for each row
execute function public.notify_tier_limits_change();


-- ============================================================
-- TRIGGER 2: After UPDATE on tier_limits
-- ============================================================

drop trigger if exists tr_after_update_tier_limits_notify 
on public.tier_limits;

create trigger tr_after_update_tier_limits_notify
after update on public.tier_limits
for each row
execute function public.notify_tier_limits_change();
