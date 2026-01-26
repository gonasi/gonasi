drop policy "course_invites_insert" on "public"."course_invites";

drop policy "course_invites_update" on "public"."course_invites";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.revoke_invites_on_course_visibility_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  -- Only process if visibility changed from 'private' to 'public' or 'unlisted'
  if old.visibility = 'private' and new.visibility in ('public', 'unlisted') then
    -- Update all pending invites for this published course
    update public.course_invites
    set revoked_at = now()
    where published_course_id = new.id
      and accepted_at is null
      and revoked_at is null;
  end if;

  return new;
end;
$function$
;


  create policy "course_invites_insert"
  on "public"."course_invites"
  as permissive
  for insert
  to authenticated
with check (((public.has_org_role(organization_id, 'admin'::text, ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM (public.course_editors ce
     JOIN public.courses c ON ((c.id = ce.course_id)))
  WHERE ((c.id = course_invites.published_course_id) AND (ce.user_id = ( SELECT auth.uid() AS uid)))))) AND (invited_by = ( SELECT auth.uid() AS uid)) AND public.can_send_course_invite(organization_id, published_course_id) AND (EXISTS ( SELECT 1
   FROM public.published_courses pc
  WHERE ((pc.id = course_invites.published_course_id) AND (pc.visibility = 'private'::public.course_access)))) AND (email <> ( SELECT profiles.email
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid)))) AND (NOT (EXISTS ( SELECT 1
   FROM (public.course_enrollments ce
     JOIN public.profiles p ON ((p.id = ce.user_id)))
  WHERE ((ce.published_course_id = course_invites.published_course_id) AND (p.email = course_invites.email)))))));



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
  WHERE ((c.id = course_invites.published_course_id) AND (ce.user_id = ( SELECT auth.uid() AS uid)))))) AND ((last_sent_at = ( SELECT ci_old.last_sent_at
   FROM public.course_invites ci_old
  WHERE (ci_old.id = course_invites.id))) OR (EXISTS ( SELECT 1
   FROM public.published_courses pc
  WHERE ((pc.id = course_invites.published_course_id) AND (pc.visibility = 'private'::public.course_access)))))));


CREATE TRIGGER trg_revoke_invites_on_visibility_change AFTER UPDATE ON public.published_courses FOR EACH ROW EXECUTE FUNCTION public.revoke_invites_on_course_visibility_change();


