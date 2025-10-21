drop policy "Allow INSERT of own profile by authenticated users" on "public"."profiles";

drop policy "Allow UPDATE of own profile by authenticated users" on "public"."profiles";

create policy "Allow INSERT of own profile by authenticated users"
on "public"."profiles"
as permissive
for insert
to authenticated
with check (((( SELECT auth.uid() AS uid) = id) AND (((mode = 'personal'::profile_mode) AND (active_organization_id IS NULL)) OR ((mode = 'organization'::profile_mode) AND (active_organization_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM organization_members m
  WHERE ((m.user_id = ( SELECT auth.uid() AS uid)) AND (m.organization_id = profiles.active_organization_id))))))));


create policy "Allow UPDATE of own profile by authenticated users"
on "public"."profiles"
as permissive
for update
to authenticated
using ((( SELECT auth.uid() AS uid) = id))
with check (((( SELECT auth.uid() AS uid) = id) AND (((mode = 'personal'::profile_mode) AND (active_organization_id IS NULL)) OR ((mode = 'organization'::profile_mode) AND (active_organization_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM organization_members m
  WHERE ((m.user_id = ( SELECT auth.uid() AS uid)) AND (m.organization_id = profiles.active_organization_id))))))));



