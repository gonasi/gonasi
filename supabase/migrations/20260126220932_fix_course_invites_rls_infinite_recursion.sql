drop policy "course_invites_update" on "public"."course_invites";


  create policy "course_invites_update"
  on "public"."course_invites"
  as permissive
  for update
  to authenticated
using ((public.has_org_role(organization_id, 'admin'::text, ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM (public.course_editors ce
     JOIN public.courses c ON ((c.id = ce.course_id)))
  WHERE ((c.id = course_invites.published_course_id) AND (ce.user_id = ( SELECT auth.uid() AS uid))))) OR ((email = ( SELECT profiles.email
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid)))) AND (accepted_at IS NULL) AND (revoked_at IS NULL) AND (expires_at > now()))))
with check ((((accepted_by IS NULL) OR (accepted_by = ( SELECT auth.uid() AS uid))) AND ((revoked_at IS NULL) OR public.has_org_role(organization_id, 'admin'::text, ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM (public.course_editors ce
     JOIN public.courses c ON ((c.id = ce.course_id)))
  WHERE ((c.id = course_invites.published_course_id) AND (ce.user_id = ( SELECT auth.uid() AS uid)))))) AND ((email = ( SELECT profiles.email
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid)))) OR (EXISTS ( SELECT 1
   FROM public.published_courses pc
  WHERE ((pc.id = course_invites.published_course_id) AND (pc.visibility = 'private'::public.course_access)))))));



