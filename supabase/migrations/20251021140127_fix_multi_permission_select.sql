drop policy "Allow org members to view ai_usage_log" on "public"."ai_usage_log";

drop policy "Allow organization members to view organizations_ai_credits" on "public"."organizations_ai_credits";

create policy "Allow org members to view ai_usage_log"
on "public"."ai_usage_log"
as permissive
for select
to authenticated
using (((EXISTS ( SELECT 1
   FROM organization_members om
  WHERE ((om.organization_id = ai_usage_log.org_id) AND (om.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT o.owned_by
   FROM organizations o
  WHERE (o.id = ai_usage_log.org_id)) = ( SELECT auth.uid() AS uid))));


create policy "Allow organization members to view organizations_ai_credits"
on "public"."organizations_ai_credits"
as permissive
for select
to authenticated
using (((EXISTS ( SELECT 1
   FROM organization_members om
  WHERE ((om.organization_id = organizations_ai_credits.org_id) AND (om.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT o.owned_by
   FROM organizations o
  WHERE (o.id = organizations_ai_credits.org_id)) = ( SELECT auth.uid() AS uid))));



