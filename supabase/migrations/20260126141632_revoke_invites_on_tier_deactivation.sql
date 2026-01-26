set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.revoke_invites_on_pricing_tier_deactivation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  -- Only process if is_active changed from true to false
  if old.is_active = true and new.is_active = false then
    -- Update all pending invites that reference the deactivated pricing tier
    update public.course_invites
    set revoked_at = now()
    where pricing_tier_id = new.id
      and accepted_at is null
      and revoked_at is null;
  end if;

  return new;
end;
$function$
;

CREATE TRIGGER trg_revoke_invites_on_tier_deactivation AFTER UPDATE ON public.course_pricing_tiers FOR EACH ROW EXECUTE FUNCTION public.revoke_invites_on_pricing_tier_deactivation();


