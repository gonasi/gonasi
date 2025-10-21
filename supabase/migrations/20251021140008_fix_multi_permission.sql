drop policy "Restrict ai_usage_log modifications to service role" on "public"."ai_usage_log";

drop policy "Restrict organizations_ai_credits modifications to service role" on "public"."organizations_ai_credits";

drop policy "Allow org members to view ai_usage_log" on "public"."ai_usage_log";

drop policy "Allow organization members to view organizations_ai_credits" on "public"."organizations_ai_credits";

create policy "Restrict ai_usage_log modifications to service role (delete)"
on "public"."ai_usage_log"
as permissive
for delete
to authenticated
using (false);


create policy "Restrict ai_usage_log modifications to service role (insert)"
on "public"."ai_usage_log"
as permissive
for insert
to authenticated
with check (false);


create policy "Restrict ai_usage_log modifications to service role (update)"
on "public"."ai_usage_log"
as permissive
for update
to authenticated
using (false)
with check (false);


create policy "Restrict organizations_ai_credits delete to service role"
on "public"."organizations_ai_credits"
as permissive
for delete
to authenticated
using (false);


create policy "Restrict organizations_ai_credits insert to service role"
on "public"."organizations_ai_credits"
as permissive
for insert
to authenticated
with check (false);


create policy "Restrict organizations_ai_credits update to service role"
on "public"."organizations_ai_credits"
as permissive
for update
to authenticated
using (false)
with check (false);


create policy "Allow org members to view ai_usage_log"
on "public"."ai_usage_log"
as permissive
for select
to authenticated
using (((EXISTS ( SELECT 1
   FROM organization_members om
  WHERE ((om.organization_id = ai_usage_log.org_id) AND (om.user_id = auth.uid())))) OR (( SELECT o.owned_by
   FROM organizations o
  WHERE (o.id = ai_usage_log.org_id)) = auth.uid())));


create policy "Allow organization members to view organizations_ai_credits"
on "public"."organizations_ai_credits"
as permissive
for select
to authenticated
using (((EXISTS ( SELECT 1
   FROM organization_members om
  WHERE ((om.organization_id = organizations_ai_credits.org_id) AND (om.user_id = auth.uid())))) OR (( SELECT o.owned_by
   FROM organizations o
  WHERE (o.id = organizations_ai_credits.org_id)) = auth.uid())));



