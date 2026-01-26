alter table "public"."course_invites" add column "pricing_tier_id" uuid;

CREATE INDEX idx_course_invites_pricing_tier_id ON public.course_invites USING btree (pricing_tier_id);

alter table "public"."course_invites" add constraint "course_invites_pricing_tier_id_fkey" FOREIGN KEY (pricing_tier_id) REFERENCES public.course_pricing_tiers(id) ON DELETE SET NULL not valid;

alter table "public"."course_invites" validate constraint "course_invites_pricing_tier_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.revoke_invites_on_pricing_tier_deletion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  -- Update all pending invites that reference the deleted pricing tier
  update public.course_invites
  set revoked_at = now()
  where pricing_tier_id = old.id
    and accepted_at is null
    and revoked_at is null;

  return old;
end;
$function$
;

CREATE TRIGGER trg_revoke_invites_on_tier_deletion AFTER DELETE ON public.course_pricing_tiers FOR EACH ROW EXECUTE FUNCTION public.revoke_invites_on_pricing_tier_deletion();


