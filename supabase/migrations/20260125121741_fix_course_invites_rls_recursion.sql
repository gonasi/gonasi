drop policy "course_invites_insert" on "public"."course_invites";


  create policy "course_invites_insert"
  on "public"."course_invites"
  as permissive
  for insert
  to authenticated
with check (((public.has_org_role(organization_id, 'admin'::text, ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM (public.course_editors ce
     JOIN public.courses c ON ((c.id = ce.course_id)))
  WHERE ((c.id = course_invites.published_course_id) AND (ce.user_id = ( SELECT auth.uid() AS uid)))))) AND (invited_by = ( SELECT auth.uid() AS uid)) AND public.can_send_course_invite(organization_id, published_course_id) AND (email <> ( SELECT profiles.email
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid)))) AND (NOT (EXISTS ( SELECT 1
   FROM (public.course_enrollments ce
     JOIN public.profiles p ON ((p.id = ce.user_id)))
  WHERE ((ce.published_course_id = course_invites.published_course_id) AND (p.email = course_invites.email)))))));



