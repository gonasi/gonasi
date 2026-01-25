
  create table "public"."course_invites" (
    "id" uuid not null default gen_random_uuid(),
    "published_course_id" uuid not null,
    "organization_id" uuid not null,
    "cohort_id" uuid,
    "email" text not null,
    "invited_by" uuid not null,
    "token" text not null,
    "resend_count" integer not null default 0,
    "last_sent_at" timestamp with time zone not null default now(),
    "delivery_status" public.invite_delivery_status not null default 'pending'::public.invite_delivery_status,
    "delivery_logs" jsonb not null default '[]'::jsonb,
    "expires_at" timestamp with time zone not null,
    "accepted_at" timestamp with time zone,
    "accepted_by" uuid,
    "revoked_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."course_invites" enable row level security;

CREATE UNIQUE INDEX course_invites_pkey ON public.course_invites USING btree (id);

CREATE UNIQUE INDEX course_invites_token_key ON public.course_invites USING btree (token);

CREATE INDEX idx_course_invites_accepted_by ON public.course_invites USING btree (accepted_by);

CREATE INDEX idx_course_invites_cohort_id ON public.course_invites USING btree (cohort_id);

CREATE INDEX idx_course_invites_course_cohort ON public.course_invites USING btree (published_course_id, cohort_id);

CREATE INDEX idx_course_invites_email ON public.course_invites USING btree (email);

CREATE INDEX idx_course_invites_expires_at ON public.course_invites USING btree (expires_at);

CREATE INDEX idx_course_invites_invited_by ON public.course_invites USING btree (invited_by);

CREATE INDEX idx_course_invites_org_course ON public.course_invites USING btree (organization_id, published_course_id);

CREATE INDEX idx_course_invites_organization_id ON public.course_invites USING btree (organization_id);

CREATE INDEX idx_course_invites_published_course_id ON public.course_invites USING btree (published_course_id);

CREATE INDEX idx_course_invites_token ON public.course_invites USING btree (token);

CREATE UNIQUE INDEX unique_pending_course_invite_per_user ON public.course_invites USING btree (published_course_id, email) WHERE ((accepted_at IS NULL) AND (revoked_at IS NULL));

alter table "public"."course_invites" add constraint "course_invites_pkey" PRIMARY KEY using index "course_invites_pkey";

alter table "public"."course_invites" add constraint "course_invites_accepted_by_fkey" FOREIGN KEY (accepted_by) REFERENCES auth.users(id) not valid;

alter table "public"."course_invites" validate constraint "course_invites_accepted_by_fkey";

alter table "public"."course_invites" add constraint "course_invites_cohort_id_fkey" FOREIGN KEY (cohort_id) REFERENCES public.cohorts(id) ON DELETE SET NULL not valid;

alter table "public"."course_invites" validate constraint "course_invites_cohort_id_fkey";

alter table "public"."course_invites" add constraint "course_invites_invited_by_fkey" FOREIGN KEY (invited_by) REFERENCES auth.users(id) not valid;

alter table "public"."course_invites" validate constraint "course_invites_invited_by_fkey";

alter table "public"."course_invites" add constraint "course_invites_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."course_invites" validate constraint "course_invites_organization_id_fkey";

alter table "public"."course_invites" add constraint "course_invites_published_course_id_fkey" FOREIGN KEY (published_course_id) REFERENCES public.published_courses(id) ON DELETE CASCADE not valid;

alter table "public"."course_invites" validate constraint "course_invites_published_course_id_fkey";

alter table "public"."course_invites" add constraint "course_invites_token_key" UNIQUE using index "course_invites_token_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.can_resend_course_invite(p_invite_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  last_sent timestamptz;
  min_wait_interval interval := interval '5 minutes';
begin
  -- Get the last sent timestamp
  select last_sent_at into last_sent
  from public.course_invites
  where id = p_invite_id;

  -- If no record found, return false
  if last_sent is null then
    return false;
  end if;

  -- Check if enough time has passed since last send
  return (now() - last_sent) >= min_wait_interval;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.can_send_course_invite(p_org_id uuid, p_published_course_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  org_tier public.subscription_tier;
  course_has_free_tier boolean;
begin
  -- Get organization tier
  org_tier := public.get_org_tier(p_org_id);

  -- temp tier cannot send invites (can't create courses)
  if org_tier = 'temp' then
    return false;
  end if;

  -- Get course pricing info
  select has_free_tier into course_has_free_tier
  from public.published_courses
  where id = p_published_course_id;

  -- launch tier cannot send invites for free courses
  if org_tier = 'launch' and course_has_free_tier then
    return false;
  end if;

  -- All other cases are allowed (scale, impact can send for any course)
  return true;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.revoke_invites_on_free_course_for_launch_tier()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  org_tier public.subscription_tier;
  revoked_count int;
begin
  -- Only proceed if has_free_tier changed from false to true
  if OLD.has_free_tier = false and NEW.has_free_tier = true then

    -- Get the organization's tier
    org_tier := public.get_org_tier(NEW.organization_id);

    -- Only revoke invites for launch tier organizations
    if org_tier = 'launch' then

      -- Revoke all pending invites for this course
      update public.course_invites
      set
        revoked_at = now(),
        updated_at = now()
      where published_course_id = NEW.id
        and accepted_at is null
        and revoked_at is null
        and expires_at > now();

      get diagnostics revoked_count = row_count;

      -- Log the action for debugging (optional, can be removed)
      raise notice 'Course % (org: %) became free on launch tier. Revoked % pending invites.',
        NEW.id, NEW.organization_id, revoked_count;

    end if;
  end if;

  return NEW;
end;
$function$
;

grant delete on table "public"."course_invites" to "anon";

grant insert on table "public"."course_invites" to "anon";

grant references on table "public"."course_invites" to "anon";

grant select on table "public"."course_invites" to "anon";

grant trigger on table "public"."course_invites" to "anon";

grant truncate on table "public"."course_invites" to "anon";

grant update on table "public"."course_invites" to "anon";

grant delete on table "public"."course_invites" to "authenticated";

grant insert on table "public"."course_invites" to "authenticated";

grant references on table "public"."course_invites" to "authenticated";

grant select on table "public"."course_invites" to "authenticated";

grant trigger on table "public"."course_invites" to "authenticated";

grant truncate on table "public"."course_invites" to "authenticated";

grant update on table "public"."course_invites" to "authenticated";

grant delete on table "public"."course_invites" to "service_role";

grant insert on table "public"."course_invites" to "service_role";

grant references on table "public"."course_invites" to "service_role";

grant select on table "public"."course_invites" to "service_role";

grant trigger on table "public"."course_invites" to "service_role";

grant truncate on table "public"."course_invites" to "service_role";

grant update on table "public"."course_invites" to "service_role";


  create policy "course_invites_delete"
  on "public"."course_invites"
  as permissive
  for delete
  to authenticated
using (public.has_org_role(organization_id, 'owner'::text, ( SELECT auth.uid() AS uid)));



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
  WHERE ((ce.published_course_id = course_invites.published_course_id) AND (p.email = course_invites.email))))) AND (NOT (EXISTS ( SELECT 1
   FROM public.course_invites ci
  WHERE ((ci.published_course_id = course_invites.published_course_id) AND (ci.email = course_invites.email) AND (ci.accepted_at IS NULL) AND (ci.revoked_at IS NULL) AND (ci.expires_at > now()) AND (ci.id <> course_invites.id)))))));



  create policy "course_invites_select"
  on "public"."course_invites"
  as permissive
  for select
  to authenticated
using ((public.has_org_role(organization_id, 'admin'::text, ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM (public.course_editors ce
     JOIN public.courses c ON ((c.id = ce.course_id)))
  WHERE ((c.id = course_invites.published_course_id) AND (ce.user_id = ( SELECT auth.uid() AS uid))))) OR ((email = ( SELECT profiles.email
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid)))) AND (accepted_at IS NULL) AND (revoked_at IS NULL) AND (expires_at > now()))));



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
  WHERE ((c.id = course_invites.published_course_id) AND (ce.user_id = ( SELECT auth.uid() AS uid))))))));


CREATE TRIGGER trg_course_invites_updated_at BEFORE UPDATE ON public.course_invites FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_revoke_invites_on_free_course AFTER UPDATE ON public.published_courses FOR EACH ROW WHEN ((old.has_free_tier IS DISTINCT FROM new.has_free_tier)) EXECUTE FUNCTION public.revoke_invites_on_free_course_for_launch_tier();


