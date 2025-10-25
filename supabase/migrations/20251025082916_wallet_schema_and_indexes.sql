create type "public"."transaction_status" as enum ('pending', 'completed', 'failed', 'reversed');

create table "public"."org_wallets" (
    "id" uuid not null default uuid_generate_v4(),
    "organization_id" uuid not null,
    "currency_code" currency_code not null,
    "balance_total" numeric(19,4) not null default 0,
    "balance_reserved" numeric(19,4) not null default 0,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


create table "public"."platform_wallets" (
    "id" uuid not null default uuid_generate_v4(),
    "currency_code" currency_code not null,
    "balance_total" numeric(19,4) not null default 0,
    "balance_reserved" numeric(19,4) not null default 0,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


create table "public"."user_wallets" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "currency_code" currency_code not null,
    "balance_total" numeric(19,4) not null default 0,
    "balance_reserved" numeric(19,4) not null default 0,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


create table "public"."wallet_ledger_entries" (
    "id" uuid not null default uuid_generate_v4(),
    "source_wallet_id" uuid,
    "source_wallet_type" text,
    "destination_wallet_id" uuid,
    "destination_wallet_type" text,
    "currency_code" currency_code not null,
    "amount" numeric(19,4) not null,
    "direction" text not null,
    "type" text not null,
    "status" transaction_status not null default 'completed'::transaction_status,
    "related_entity_type" text,
    "related_entity_id" uuid,
    "metadata" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
);


CREATE INDEX idx_org_wallets_created_at ON public.org_wallets USING btree (created_at);

CREATE INDEX idx_org_wallets_currency_code ON public.org_wallets USING btree (currency_code);

CREATE INDEX idx_org_wallets_organization_id ON public.org_wallets USING btree (organization_id);

CREATE INDEX idx_platform_wallets_created_at ON public.platform_wallets USING btree (created_at);

CREATE INDEX idx_platform_wallets_currency_code ON public.platform_wallets USING btree (currency_code);

CREATE INDEX idx_user_wallets_created_at ON public.user_wallets USING btree (created_at);

CREATE INDEX idx_user_wallets_currency_code ON public.user_wallets USING btree (currency_code);

CREATE INDEX idx_user_wallets_user_id ON public.user_wallets USING btree (user_id);

CREATE INDEX idx_wallet_tx_created_at ON public.wallet_ledger_entries USING btree (created_at);

CREATE INDEX idx_wallet_tx_currency ON public.wallet_ledger_entries USING btree (currency_code);

CREATE INDEX idx_wallet_tx_destination_wallet ON public.wallet_ledger_entries USING btree (destination_wallet_id, destination_wallet_type);

CREATE INDEX idx_wallet_tx_related_entity ON public.wallet_ledger_entries USING btree (related_entity_type, related_entity_id);

CREATE INDEX idx_wallet_tx_source_wallet ON public.wallet_ledger_entries USING btree (source_wallet_id, source_wallet_type);

CREATE UNIQUE INDEX org_wallets_organization_id_currency_code_key ON public.org_wallets USING btree (organization_id, currency_code);

CREATE UNIQUE INDEX org_wallets_pkey ON public.org_wallets USING btree (id);

CREATE UNIQUE INDEX platform_wallets_currency_code_key ON public.platform_wallets USING btree (currency_code);

CREATE UNIQUE INDEX platform_wallets_pkey ON public.platform_wallets USING btree (id);

CREATE UNIQUE INDEX user_wallets_pkey ON public.user_wallets USING btree (id);

CREATE UNIQUE INDEX user_wallets_user_id_currency_code_key ON public.user_wallets USING btree (user_id, currency_code);

CREATE UNIQUE INDEX wallet_ledger_entries_pkey ON public.wallet_ledger_entries USING btree (id);

alter table "public"."org_wallets" add constraint "org_wallets_pkey" PRIMARY KEY using index "org_wallets_pkey";

alter table "public"."platform_wallets" add constraint "platform_wallets_pkey" PRIMARY KEY using index "platform_wallets_pkey";

alter table "public"."user_wallets" add constraint "user_wallets_pkey" PRIMARY KEY using index "user_wallets_pkey";

alter table "public"."wallet_ledger_entries" add constraint "wallet_ledger_entries_pkey" PRIMARY KEY using index "wallet_ledger_entries_pkey";

alter table "public"."org_wallets" add constraint "org_wallets_organization_id_currency_code_key" UNIQUE using index "org_wallets_organization_id_currency_code_key";

alter table "public"."org_wallets" add constraint "org_wallets_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE not valid;

alter table "public"."org_wallets" validate constraint "org_wallets_organization_id_fkey";

alter table "public"."platform_wallets" add constraint "platform_wallets_currency_code_key" UNIQUE using index "platform_wallets_currency_code_key";

alter table "public"."user_wallets" add constraint "user_wallets_user_id_currency_code_key" UNIQUE using index "user_wallets_user_id_currency_code_key";

alter table "public"."user_wallets" add constraint "user_wallets_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_wallets" validate constraint "user_wallets_user_id_fkey";

alter table "public"."wallet_ledger_entries" add constraint "wallet_ledger_entries_amount_check" CHECK ((amount > (0)::numeric)) not valid;

alter table "public"."wallet_ledger_entries" validate constraint "wallet_ledger_entries_amount_check";

alter table "public"."wallet_ledger_entries" add constraint "wallet_ledger_entries_currency_not_null" CHECK ((currency_code IS NOT NULL)) not valid;

alter table "public"."wallet_ledger_entries" validate constraint "wallet_ledger_entries_currency_not_null";

alter table "public"."wallet_ledger_entries" add constraint "wallet_ledger_entries_destination_wallet_type_check" CHECK ((destination_wallet_type = ANY (ARRAY['platform'::text, 'organization'::text, 'user'::text, 'external'::text]))) not valid;

alter table "public"."wallet_ledger_entries" validate constraint "wallet_ledger_entries_destination_wallet_type_check";

alter table "public"."wallet_ledger_entries" add constraint "wallet_ledger_entries_direction_check" CHECK ((direction = ANY (ARRAY['credit'::text, 'debit'::text]))) not valid;

alter table "public"."wallet_ledger_entries" validate constraint "wallet_ledger_entries_direction_check";

alter table "public"."wallet_ledger_entries" add constraint "wallet_ledger_entries_source_wallet_type_check" CHECK ((source_wallet_type = ANY (ARRAY['platform'::text, 'organization'::text, 'user'::text, 'external'::text]))) not valid;

alter table "public"."wallet_ledger_entries" validate constraint "wallet_ledger_entries_source_wallet_type_check";

alter table "public"."wallet_ledger_entries" add constraint "wallet_ledger_entries_type_check" CHECK ((type = ANY (ARRAY['course_sale'::text, 'course_sale_payout'::text, 'subscription_payment'::text, 'ai_credit_purchase'::text, 'sponsorship_payment'::text, 'funds_hold'::text, 'funds_release'::text, 'reward_payout'::text, 'withdrawal_request'::text, 'withdrawal_complete'::text, 'withdrawal_revert'::text, 'platform_fee'::text, 'paystack_fee'::text]))) not valid;

alter table "public"."wallet_ledger_entries" validate constraint "wallet_ledger_entries_type_check";

alter table "public"."wallet_ledger_entries" add constraint "wallet_tx_external_dest_id_null" CHECK ((((destination_wallet_type = 'external'::text) AND (destination_wallet_id IS NULL)) OR (destination_wallet_type <> 'external'::text))) not valid;

alter table "public"."wallet_ledger_entries" validate constraint "wallet_tx_external_dest_id_null";

alter table "public"."wallet_ledger_entries" add constraint "wallet_tx_external_id_null" CHECK ((((source_wallet_type = 'external'::text) AND (source_wallet_id IS NULL)) OR (source_wallet_type <> 'external'::text))) not valid;

alter table "public"."wallet_ledger_entries" validate constraint "wallet_tx_external_id_null";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_user_wallets()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  -- iterate over the enum values; type is fully qualified
  currency public.currency_code;
begin
  -- Loop through every currency defined in public.currency_code
  for currency in select unnest(enum_range(null::public.currency_code)) loop
    -- Insert a wallet row for this user + currency.
    -- All object names are schema-qualified to work with empty search_path.
    insert into public.user_wallets (id, user_id, currency_code, balance_total, balance_reserved, created_at, updated_at)
    values (
      public.uuid_generate_v4(),      -- id
      new.id,                         -- user_id (from auth.users)
      currency,                       -- currency_code
      0::numeric(19,4),               -- balance_total default
      0::numeric(19,4),               -- balance_reserved default
      timezone('utc', now()),         -- created_at
      timezone('utc', now())          -- updated_at
    )
    on conflict (user_id, currency_code) do nothing;
  end loop;

  -- Return the inserted user record (standard for AFTER INSERT triggers)
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.org_wallets()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  currency public.currency_code;
begin
  -- Loop through every currency defined in public.currency_code
  for currency in select unnest(enum_range(null::public.currency_code)) loop
    -- Insert an organization wallet for this organization + currency
    insert into public.organization_wallets (id, organization_id, currency_code, balance_total, balance_reserved, created_at, updated_at)
    values (
      public.uuid_generate_v4(),      -- id
      new.id,                         -- organization_id (from public.organizations)
      currency,                       -- currency_code
      0::numeric(19,4),               -- balance_total default
      0::numeric(19,4),               -- balance_reserved default
      timezone('utc', now()),         -- created_at
      timezone('utc', now())          -- updated_at
    )
    on conflict (organization_id, currency_code) do nothing;
  end loop;

  -- Return the inserted organization record
  return new;
end;
$function$
;

grant delete on table "public"."org_wallets" to "anon";

grant insert on table "public"."org_wallets" to "anon";

grant references on table "public"."org_wallets" to "anon";

grant select on table "public"."org_wallets" to "anon";

grant trigger on table "public"."org_wallets" to "anon";

grant truncate on table "public"."org_wallets" to "anon";

grant update on table "public"."org_wallets" to "anon";

grant delete on table "public"."org_wallets" to "authenticated";

grant insert on table "public"."org_wallets" to "authenticated";

grant references on table "public"."org_wallets" to "authenticated";

grant select on table "public"."org_wallets" to "authenticated";

grant trigger on table "public"."org_wallets" to "authenticated";

grant truncate on table "public"."org_wallets" to "authenticated";

grant update on table "public"."org_wallets" to "authenticated";

grant delete on table "public"."org_wallets" to "service_role";

grant insert on table "public"."org_wallets" to "service_role";

grant references on table "public"."org_wallets" to "service_role";

grant select on table "public"."org_wallets" to "service_role";

grant trigger on table "public"."org_wallets" to "service_role";

grant truncate on table "public"."org_wallets" to "service_role";

grant update on table "public"."org_wallets" to "service_role";

grant delete on table "public"."platform_wallets" to "anon";

grant insert on table "public"."platform_wallets" to "anon";

grant references on table "public"."platform_wallets" to "anon";

grant select on table "public"."platform_wallets" to "anon";

grant trigger on table "public"."platform_wallets" to "anon";

grant truncate on table "public"."platform_wallets" to "anon";

grant update on table "public"."platform_wallets" to "anon";

grant delete on table "public"."platform_wallets" to "authenticated";

grant insert on table "public"."platform_wallets" to "authenticated";

grant references on table "public"."platform_wallets" to "authenticated";

grant select on table "public"."platform_wallets" to "authenticated";

grant trigger on table "public"."platform_wallets" to "authenticated";

grant truncate on table "public"."platform_wallets" to "authenticated";

grant update on table "public"."platform_wallets" to "authenticated";

grant delete on table "public"."platform_wallets" to "service_role";

grant insert on table "public"."platform_wallets" to "service_role";

grant references on table "public"."platform_wallets" to "service_role";

grant select on table "public"."platform_wallets" to "service_role";

grant trigger on table "public"."platform_wallets" to "service_role";

grant truncate on table "public"."platform_wallets" to "service_role";

grant update on table "public"."platform_wallets" to "service_role";

grant delete on table "public"."user_wallets" to "anon";

grant insert on table "public"."user_wallets" to "anon";

grant references on table "public"."user_wallets" to "anon";

grant select on table "public"."user_wallets" to "anon";

grant trigger on table "public"."user_wallets" to "anon";

grant truncate on table "public"."user_wallets" to "anon";

grant update on table "public"."user_wallets" to "anon";

grant delete on table "public"."user_wallets" to "authenticated";

grant insert on table "public"."user_wallets" to "authenticated";

grant references on table "public"."user_wallets" to "authenticated";

grant select on table "public"."user_wallets" to "authenticated";

grant trigger on table "public"."user_wallets" to "authenticated";

grant truncate on table "public"."user_wallets" to "authenticated";

grant update on table "public"."user_wallets" to "authenticated";

grant delete on table "public"."user_wallets" to "service_role";

grant insert on table "public"."user_wallets" to "service_role";

grant references on table "public"."user_wallets" to "service_role";

grant select on table "public"."user_wallets" to "service_role";

grant trigger on table "public"."user_wallets" to "service_role";

grant truncate on table "public"."user_wallets" to "service_role";

grant update on table "public"."user_wallets" to "service_role";

grant delete on table "public"."wallet_ledger_entries" to "anon";

grant insert on table "public"."wallet_ledger_entries" to "anon";

grant references on table "public"."wallet_ledger_entries" to "anon";

grant select on table "public"."wallet_ledger_entries" to "anon";

grant trigger on table "public"."wallet_ledger_entries" to "anon";

grant truncate on table "public"."wallet_ledger_entries" to "anon";

grant update on table "public"."wallet_ledger_entries" to "anon";

grant delete on table "public"."wallet_ledger_entries" to "authenticated";

grant insert on table "public"."wallet_ledger_entries" to "authenticated";

grant references on table "public"."wallet_ledger_entries" to "authenticated";

grant select on table "public"."wallet_ledger_entries" to "authenticated";

grant trigger on table "public"."wallet_ledger_entries" to "authenticated";

grant truncate on table "public"."wallet_ledger_entries" to "authenticated";

grant update on table "public"."wallet_ledger_entries" to "authenticated";

grant delete on table "public"."wallet_ledger_entries" to "service_role";

grant insert on table "public"."wallet_ledger_entries" to "service_role";

grant references on table "public"."wallet_ledger_entries" to "service_role";

grant select on table "public"."wallet_ledger_entries" to "service_role";

grant trigger on table "public"."wallet_ledger_entries" to "service_role";

grant truncate on table "public"."wallet_ledger_entries" to "service_role";

grant update on table "public"."wallet_ledger_entries" to "service_role";

CREATE TRIGGER trg_org_wallets AFTER INSERT ON public.organizations FOR EACH ROW EXECUTE FUNCTION org_wallets();


