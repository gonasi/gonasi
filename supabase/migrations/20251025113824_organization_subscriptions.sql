create table "public"."organization_subscriptions" (
    "id" uuid not null default uuid_generate_v4(),
    "organization_id" uuid not null,
    "tier" subscription_tier not null default 'launch'::subscription_tier,
    "status" subscription_status not null default 'active'::subscription_status,
    "start_date" timestamp with time zone not null default timezone('utc'::text, now()),
    "current_period_start" timestamp with time zone not null default timezone('utc'::text, now()),
    "current_period_end" timestamp with time zone,
    "cancel_at_period_end" boolean not null default false,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_by" uuid,
    "updated_by" uuid
);


alter table "public"."organization_subscriptions" enable row level security;

CREATE INDEX idx_org_subscriptions_active_period ON public.organization_subscriptions USING btree (status, current_period_end);

CREATE INDEX idx_org_subscriptions_org_id ON public.organization_subscriptions USING btree (organization_id);

CREATE INDEX idx_org_subscriptions_status ON public.organization_subscriptions USING btree (status);

CREATE INDEX idx_org_subscriptions_tier ON public.organization_subscriptions USING btree (tier);

CREATE UNIQUE INDEX one_active_subscription_per_org ON public.organization_subscriptions USING btree (organization_id, status);

CREATE UNIQUE INDEX organization_subscriptions_pkey ON public.organization_subscriptions USING btree (id);

alter table "public"."organization_subscriptions" add constraint "organization_subscriptions_pkey" PRIMARY KEY using index "organization_subscriptions_pkey";

alter table "public"."organization_subscriptions" add constraint "one_active_subscription_per_org" UNIQUE using index "one_active_subscription_per_org" DEFERRABLE INITIALLY DEFERRED;

alter table "public"."organization_subscriptions" add constraint "organization_subscriptions_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."organization_subscriptions" validate constraint "organization_subscriptions_created_by_fkey";

alter table "public"."organization_subscriptions" add constraint "organization_subscriptions_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE not valid;

alter table "public"."organization_subscriptions" validate constraint "organization_subscriptions_organization_id_fkey";

alter table "public"."organization_subscriptions" add constraint "organization_subscriptions_tier_fkey" FOREIGN KEY (tier) REFERENCES tier_limits(tier) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."organization_subscriptions" validate constraint "organization_subscriptions_tier_fkey";

alter table "public"."organization_subscriptions" add constraint "organization_subscriptions_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."organization_subscriptions" validate constraint "organization_subscriptions_updated_by_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.assign_launch_subscription_to_new_org()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  -- Skip if this organization already has a subscription (safety check)
  if exists (
    select 1
    from public.organization_subscriptions s
    where s.organization_id = new.id
  ) then
    return new;
  end if;

  -- Insert default subscription record
  insert into public.organization_subscriptions (
    organization_id,
    tier,
    status,
    start_date,
    current_period_start,
    current_period_end,
    created_by,
    updated_by
  )
  values (
    new.id,                 -- new organization ID
    'launch',               -- default free tier
    'active',               -- active subscription
    timezone('utc', now()), -- subscription start date
    timezone('utc', now()), -- current period start
    null,                   -- 'launch' tier has no expiry
    new.created_by,         -- who created the organization (if tracked)
    new.created_by
  );

  return new;
end;
$function$
;

grant delete on table "public"."organization_subscriptions" to "anon";

grant insert on table "public"."organization_subscriptions" to "anon";

grant references on table "public"."organization_subscriptions" to "anon";

grant select on table "public"."organization_subscriptions" to "anon";

grant trigger on table "public"."organization_subscriptions" to "anon";

grant truncate on table "public"."organization_subscriptions" to "anon";

grant update on table "public"."organization_subscriptions" to "anon";

grant delete on table "public"."organization_subscriptions" to "authenticated";

grant insert on table "public"."organization_subscriptions" to "authenticated";

grant references on table "public"."organization_subscriptions" to "authenticated";

grant select on table "public"."organization_subscriptions" to "authenticated";

grant trigger on table "public"."organization_subscriptions" to "authenticated";

grant truncate on table "public"."organization_subscriptions" to "authenticated";

grant update on table "public"."organization_subscriptions" to "authenticated";

grant delete on table "public"."organization_subscriptions" to "service_role";

grant insert on table "public"."organization_subscriptions" to "service_role";

grant references on table "public"."organization_subscriptions" to "service_role";

grant select on table "public"."organization_subscriptions" to "service_role";

grant trigger on table "public"."organization_subscriptions" to "service_role";

grant truncate on table "public"."organization_subscriptions" to "service_role";

grant update on table "public"."organization_subscriptions" to "service_role";

create policy "organization_subscriptions_delete"
on "public"."organization_subscriptions"
as permissive
for delete
to service_role
using (true);


create policy "organization_subscriptions_insert"
on "public"."organization_subscriptions"
as permissive
for insert
to service_role
with check (true);


create policy "organization_subscriptions_select"
on "public"."organization_subscriptions"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM organizations o
  WHERE ((o.id = organization_subscriptions.organization_id) AND ((o.owned_by = ( SELECT auth.uid() AS uid)) OR has_org_role(o.id, 'admin'::text, ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM organization_members om
          WHERE ((om.organization_id = o.id) AND (om.user_id = ( SELECT auth.uid() AS uid))))))))));


create policy "organization_subscriptions_update"
on "public"."organization_subscriptions"
as permissive
for update
to service_role
using (true)
with check (true);


CREATE TRIGGER trg_assign_launch_subscription AFTER INSERT ON public.organizations FOR EACH ROW EXECUTE FUNCTION assign_launch_subscription_to_new_org();


