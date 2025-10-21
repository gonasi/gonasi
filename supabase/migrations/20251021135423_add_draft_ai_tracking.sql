drop policy "Allow INSERT of own profile by authenticated users" on "public"."profiles";

drop policy "Allow UPDATE of own profile by authenticated users" on "public"."profiles";

create table "public"."ai_usage_log" (
    "id" uuid not null default gen_random_uuid(),
    "org_id" uuid not null,
    "user_id" uuid not null,
    "credits_used" integer not null,
    "created_at" timestamp with time zone default now()
);


alter table "public"."ai_usage_log" enable row level security;

create table "public"."organizations_ai_credits" (
    "org_id" uuid not null,
    "base_credits_total" integer not null default 100,
    "base_credits_remaining" integer not null default 100,
    "purchased_credits_total" integer not null default 0,
    "purchased_credits_remaining" integer not null default 0,
    "last_reset_at" timestamp with time zone not null default now(),
    "next_reset_at" timestamp with time zone not null default (now() + '1 mon'::interval),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."organizations_ai_credits" enable row level security;

alter table "public"."tier_limits" alter column "ai_tools_enabled" set default true;

CREATE UNIQUE INDEX ai_usage_log_pkey ON public.ai_usage_log USING btree (id);

CREATE INDEX idx_ai_usage_log_created_at ON public.ai_usage_log USING btree (created_at DESC);

CREATE INDEX idx_ai_usage_log_org_created ON public.ai_usage_log USING btree (org_id, created_at DESC);

CREATE INDEX idx_ai_usage_log_org_id ON public.ai_usage_log USING btree (org_id);

CREATE INDEX idx_ai_usage_log_user_id ON public.ai_usage_log USING btree (user_id);

CREATE INDEX idx_organizations_ai_credits_next_reset_at ON public.organizations_ai_credits USING btree (next_reset_at);

CREATE INDEX idx_organizations_ai_credits_org_id ON public.organizations_ai_credits USING btree (org_id);

CREATE UNIQUE INDEX organizations_ai_credits_pkey ON public.organizations_ai_credits USING btree (org_id);

alter table "public"."ai_usage_log" add constraint "ai_usage_log_pkey" PRIMARY KEY using index "ai_usage_log_pkey";

alter table "public"."organizations_ai_credits" add constraint "organizations_ai_credits_pkey" PRIMARY KEY using index "organizations_ai_credits_pkey";

alter table "public"."ai_usage_log" add constraint "ai_usage_log_org_id_fkey" FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE not valid;

alter table "public"."ai_usage_log" validate constraint "ai_usage_log_org_id_fkey";

alter table "public"."ai_usage_log" add constraint "ai_usage_log_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."ai_usage_log" validate constraint "ai_usage_log_user_id_fkey";

alter table "public"."organizations_ai_credits" add constraint "organizations_ai_credits_org_id_fkey" FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE not valid;

alter table "public"."organizations_ai_credits" validate constraint "organizations_ai_credits_org_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_organization_ai_credits()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  monthly_limit int;
begin
  -- Get monthly AI credit limit based on tier
  select ai_usage_limit_monthly
  into monthly_limit
  from public.tier_limits
  where tier = new.tier;

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
  on conflict (org_id) do nothing;  -- in case of duplicate insert attempts

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.reset_org_ai_base_credits_when_due()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  update public.organizations_ai_credits as oac
  set
    base_credits_total = coalesce(t.ai_usage_limit_monthly, 100),
    base_credits_remaining = coalesce(t.ai_usage_limit_monthly, 100),
    last_reset_at = now(),
    next_reset_at = now() + interval '1 month',
    updated_at = now()
  from public.organizations org
  left join public.tier_limits t on org.tier = t.tier
  where
    oac.org_id = org.id
    and oac.next_reset_at <= now();
end;
$function$
;

create or replace view "public"."v_organizations_ai_available_credits" as  SELECT organizations_ai_credits.org_id,
    (organizations_ai_credits.base_credits_remaining + organizations_ai_credits.purchased_credits_remaining) AS total_available_credits,
    organizations_ai_credits.base_credits_remaining,
    organizations_ai_credits.purchased_credits_remaining,
    organizations_ai_credits.last_reset_at,
    organizations_ai_credits.next_reset_at
   FROM organizations_ai_credits;


grant delete on table "public"."ai_usage_log" to "anon";

grant insert on table "public"."ai_usage_log" to "anon";

grant references on table "public"."ai_usage_log" to "anon";

grant select on table "public"."ai_usage_log" to "anon";

grant trigger on table "public"."ai_usage_log" to "anon";

grant truncate on table "public"."ai_usage_log" to "anon";

grant update on table "public"."ai_usage_log" to "anon";

grant delete on table "public"."ai_usage_log" to "authenticated";

grant insert on table "public"."ai_usage_log" to "authenticated";

grant references on table "public"."ai_usage_log" to "authenticated";

grant select on table "public"."ai_usage_log" to "authenticated";

grant trigger on table "public"."ai_usage_log" to "authenticated";

grant truncate on table "public"."ai_usage_log" to "authenticated";

grant update on table "public"."ai_usage_log" to "authenticated";

grant delete on table "public"."ai_usage_log" to "service_role";

grant insert on table "public"."ai_usage_log" to "service_role";

grant references on table "public"."ai_usage_log" to "service_role";

grant select on table "public"."ai_usage_log" to "service_role";

grant trigger on table "public"."ai_usage_log" to "service_role";

grant truncate on table "public"."ai_usage_log" to "service_role";

grant update on table "public"."ai_usage_log" to "service_role";

grant delete on table "public"."organizations_ai_credits" to "anon";

grant insert on table "public"."organizations_ai_credits" to "anon";

grant references on table "public"."organizations_ai_credits" to "anon";

grant select on table "public"."organizations_ai_credits" to "anon";

grant trigger on table "public"."organizations_ai_credits" to "anon";

grant truncate on table "public"."organizations_ai_credits" to "anon";

grant update on table "public"."organizations_ai_credits" to "anon";

grant delete on table "public"."organizations_ai_credits" to "authenticated";

grant insert on table "public"."organizations_ai_credits" to "authenticated";

grant references on table "public"."organizations_ai_credits" to "authenticated";

grant select on table "public"."organizations_ai_credits" to "authenticated";

grant trigger on table "public"."organizations_ai_credits" to "authenticated";

grant truncate on table "public"."organizations_ai_credits" to "authenticated";

grant update on table "public"."organizations_ai_credits" to "authenticated";

grant delete on table "public"."organizations_ai_credits" to "service_role";

grant insert on table "public"."organizations_ai_credits" to "service_role";

grant references on table "public"."organizations_ai_credits" to "service_role";

grant select on table "public"."organizations_ai_credits" to "service_role";

grant trigger on table "public"."organizations_ai_credits" to "service_role";

grant truncate on table "public"."organizations_ai_credits" to "service_role";

grant update on table "public"."organizations_ai_credits" to "service_role";

grant update on table "public"."profiles" to "authenticated";

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


create policy "Restrict ai_usage_log modifications to service role"
on "public"."ai_usage_log"
as permissive
for all
to authenticated
using (false)
with check (false);


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


create policy "Restrict organizations_ai_credits modifications to service role"
on "public"."organizations_ai_credits"
as permissive
for all
to authenticated
using (false)
with check (false);


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


CREATE TRIGGER trg_create_org_ai_credits AFTER INSERT ON public.organizations FOR EACH ROW EXECUTE FUNCTION handle_new_organization_ai_credits();


