set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_organization_ai_credits()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  monthly_limit int;
begin
  -- Get monthly AI credit limit based on tier
  select public.tier_limits.ai_usage_limit_monthly
  into monthly_limit
  from public.tier_limits
  where public.tier_limits.tier = new.tier;

  -- Fallback to 100 if tier not found or has null limit
  if monthly_limit is null then
    monthly_limit := 100;
  end if;

  -- Insert the org’s initial AI credit record
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
  on conflict (org_id) do nothing;  -- Prevent duplicates

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.reset_org_ai_base_credits_when_due()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  update public.organizations_ai_credits as oac
  set
    base_credits_total = coalesce(t.ai_usage_limit_monthly, 100),
    base_credits_remaining = coalesce(t.ai_usage_limit_monthly, 100),
    last_reset_at = now(),
    next_reset_at = now() + interval '1 month',
    updated_at = now()
  from public.organizations as org
  left join public.tier_limits as t
    on org.tier = t.tier
  where
    oac.org_id = org.id
    and oac.next_reset_at <= now();
end;
$function$
;


