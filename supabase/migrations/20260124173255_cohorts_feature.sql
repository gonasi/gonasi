drop function if exists "public"."enroll_user_in_free_course"(p_user_id uuid, p_published_course_id uuid, p_tier_id uuid);

drop function if exists "public"."process_course_payment_from_paystack"(p_payment_reference text, p_paystack_transaction_id text, p_user_id uuid, p_published_course_id uuid, p_tier_id uuid, p_amount_paid numeric, p_currency_code text, p_payment_method text, p_paystack_fee numeric, p_metadata jsonb);


  create table "public"."cohort_membership_history" (
    "id" uuid not null default gen_random_uuid(),
    "enrollment_id" uuid not null,
    "old_cohort_id" uuid,
    "new_cohort_id" uuid,
    "reason" text,
    "changed_by" uuid,
    "changed_at" timestamp with time zone not null default now()
      );


alter table "public"."cohort_membership_history" enable row level security;


  create table "public"."cohorts" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "published_course_id" uuid not null,
    "name" text not null,
    "description" text,
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "max_enrollment" integer,
    "is_active" boolean not null default true,
    "current_enrollment_count" integer not null default 0,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "created_by" uuid,
    "updated_by" uuid
      );


alter table "public"."cohorts" enable row level security;

alter table "public"."course_enrollments" add column "cohort_id" uuid;

CREATE UNIQUE INDEX cohort_membership_history_pkey ON public.cohort_membership_history USING btree (id);

CREATE UNIQUE INDEX cohorts_pkey ON public.cohorts USING btree (id);

CREATE INDEX idx_cohort_history_changed_at ON public.cohort_membership_history USING btree (changed_at);

CREATE INDEX idx_cohort_history_changed_by ON public.cohort_membership_history USING btree (changed_by);

CREATE INDEX idx_cohort_history_enrollment_id ON public.cohort_membership_history USING btree (enrollment_id);

CREATE INDEX idx_cohort_history_enrollment_time ON public.cohort_membership_history USING btree (enrollment_id, changed_at DESC);

CREATE INDEX idx_cohort_history_new_cohort_id ON public.cohort_membership_history USING btree (new_cohort_id);

CREATE INDEX idx_cohort_history_old_cohort_id ON public.cohort_membership_history USING btree (old_cohort_id);

CREATE INDEX idx_cohorts_active ON public.cohorts USING btree (id) WHERE (is_active = true);

CREATE INDEX idx_cohorts_course_active ON public.cohorts USING btree (published_course_id, is_active);

CREATE INDEX idx_cohorts_created_by ON public.cohorts USING btree (created_by);

CREATE INDEX idx_cohorts_org_course ON public.cohorts USING btree (organization_id, published_course_id);

CREATE INDEX idx_cohorts_organization_id ON public.cohorts USING btree (organization_id);

CREATE INDEX idx_cohorts_published_course_id ON public.cohorts USING btree (published_course_id);

CREATE INDEX idx_cohorts_updated_by ON public.cohorts USING btree (updated_by);

CREATE INDEX idx_cohorts_with_dates ON public.cohorts USING btree (id) WHERE (start_date IS NOT NULL);

CREATE INDEX idx_course_enrollments_cohort_id ON public.course_enrollments USING btree (cohort_id);

CREATE INDEX idx_course_enrollments_course_cohort ON public.course_enrollments USING btree (published_course_id, cohort_id);

CREATE UNIQUE INDEX unique_cohort_name_per_course ON public.cohorts USING btree (published_course_id, name);

alter table "public"."cohort_membership_history" add constraint "cohort_membership_history_pkey" PRIMARY KEY using index "cohort_membership_history_pkey";

alter table "public"."cohorts" add constraint "cohorts_pkey" PRIMARY KEY using index "cohorts_pkey";

alter table "public"."cohort_membership_history" add constraint "cohort_membership_history_changed_by_fkey" FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."cohort_membership_history" validate constraint "cohort_membership_history_changed_by_fkey";

alter table "public"."cohort_membership_history" add constraint "cohort_membership_history_enrollment_id_fkey" FOREIGN KEY (enrollment_id) REFERENCES public.course_enrollments(id) ON DELETE CASCADE not valid;

alter table "public"."cohort_membership_history" validate constraint "cohort_membership_history_enrollment_id_fkey";

alter table "public"."cohort_membership_history" add constraint "cohort_membership_history_new_cohort_id_fkey" FOREIGN KEY (new_cohort_id) REFERENCES public.cohorts(id) ON DELETE SET NULL not valid;

alter table "public"."cohort_membership_history" validate constraint "cohort_membership_history_new_cohort_id_fkey";

alter table "public"."cohort_membership_history" add constraint "cohort_membership_history_old_cohort_id_fkey" FOREIGN KEY (old_cohort_id) REFERENCES public.cohorts(id) ON DELETE SET NULL not valid;

alter table "public"."cohort_membership_history" validate constraint "cohort_membership_history_old_cohort_id_fkey";

alter table "public"."cohorts" add constraint "cohorts_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."cohorts" validate constraint "cohorts_created_by_fkey";

alter table "public"."cohorts" add constraint "cohorts_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."cohorts" validate constraint "cohorts_organization_id_fkey";

alter table "public"."cohorts" add constraint "cohorts_published_course_id_fkey" FOREIGN KEY (published_course_id) REFERENCES public.published_courses(id) ON DELETE CASCADE not valid;

alter table "public"."cohorts" validate constraint "cohorts_published_course_id_fkey";

alter table "public"."cohorts" add constraint "cohorts_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."cohorts" validate constraint "cohorts_updated_by_fkey";

alter table "public"."cohorts" add constraint "non_negative_enrollment_count" CHECK ((current_enrollment_count >= 0)) not valid;

alter table "public"."cohorts" validate constraint "non_negative_enrollment_count";

alter table "public"."cohorts" add constraint "positive_max_enrollment" CHECK (((max_enrollment IS NULL) OR (max_enrollment > 0))) not valid;

alter table "public"."cohorts" validate constraint "positive_max_enrollment";

alter table "public"."cohorts" add constraint "unique_cohort_name_per_course" UNIQUE using index "unique_cohort_name_per_course";

alter table "public"."cohorts" add constraint "valid_date_range" CHECK (((start_date IS NULL) OR (end_date IS NULL) OR (start_date < end_date))) not valid;

alter table "public"."cohorts" validate constraint "valid_date_range";

alter table "public"."course_enrollments" add constraint "course_enrollments_cohort_id_fkey" FOREIGN KEY (cohort_id) REFERENCES public.cohorts(id) ON DELETE SET NULL not valid;

alter table "public"."course_enrollments" validate constraint "course_enrollments_cohort_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.decrement_cohort_enrollment_count_on_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  -- Only update if cohort_id was not null
  if OLD.cohort_id is not null then
    update public.cohorts
    set
      current_enrollment_count = current_enrollment_count - 1,
      updated_at = timezone('utc', now())
    where id = OLD.cohort_id;
  end if;

  return OLD;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.enroll_user_in_free_course(p_user_id uuid, p_published_course_id uuid, p_tier_id uuid, p_cohort_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_now timestamptz := timezone('utc', now());
  v_access_start timestamptz := v_now;
  v_access_end timestamptz := v_access_start + interval '1 month';

  -- course / org
  v_org_id uuid;
  v_course_title text;

  -- tier
  v_tier_name text;
  v_tier_description text;
  v_tier_promotional_price numeric(19,4);
  v_tier_price numeric(19,4);
  v_tier_currency public.currency_code;
  v_tier_frequency public.payment_frequency;
  v_tier_is_free boolean;

  -- enrollment
  v_enrollment_id uuid;
  v_existing_enrollment record;

  -- activity
  v_activity_id uuid;
begin
  ---------------------------------------------------------------
  -- Validate published course and get organization
  ---------------------------------------------------------------
  select pc.name, pc.organization_id
  into v_course_title, v_org_id
  from public.published_courses pc
  where pc.id = p_published_course_id
    and pc.is_active = true;

  if not found then
    raise exception 'Published course not found or inactive: %', p_published_course_id;
  end if;

  ---------------------------------------------------------------
  -- Validate pricing tier belongs to the course and is free
  ---------------------------------------------------------------
  select
    pt.tier_name,
    pt.tier_description,
    pt.price      as price_amount,
    pt.promotional_price,
    pt.currency_code::public.currency_code,
    pt.payment_frequency::public.payment_frequency,
    pt.is_free
  into
    v_tier_name,
    v_tier_description,
    v_tier_price,
    v_tier_promotional_price,
    v_tier_currency,
    v_tier_frequency,
    v_tier_is_free
  from public.course_pricing_tiers pt
  where pt.id = p_tier_id
    and pt.course_id = p_published_course_id
    and pt.is_active = true;

  if not found then
    raise exception 'Pricing tier not found for this course: %', p_tier_id;
  end if;

  if not v_tier_is_free then
    raise exception 'TIER_NOT_FREE: tier % is not marked free', p_tier_id;
  end if;

  -- Optional sanity: ensure price is zero if you store numeric price
  if v_tier_price is not null and v_tier_price <> 0 then
    raise exception 'TIER_PRICE_MISMATCH: tier % price is % (expected 0)', p_tier_id, v_tier_price;
  end if;

  ---------------------------------------------------------------
  -- Check for existing enrollment (locks the row when present)
  ---------------------------------------------------------------
  select id, user_id, published_course_id, organization_id, enrolled_at, expires_at, is_active
  into v_existing_enrollment
  from public.course_enrollments e
  where e.user_id = p_user_id
    and e.published_course_id = p_published_course_id
  for update;

  if found then
    -- If already active and not expired, return existing
    if v_existing_enrollment.is_active = true
       and (v_existing_enrollment.expires_at is null or v_existing_enrollment.expires_at > v_now) then
      return jsonb_build_object(
        'success', true,
        'message', 'User already actively enrolled in free course',
        'enrollment_id', v_existing_enrollment.id,
        'was_created', false
      );
    end if;

    -- Otherwise renew / reactivate the enrollment
    update public.course_enrollments
    set expires_at = v_access_end,
        is_active = true,
        updated_at = v_now,
        enrolled_at = coalesce(v_existing_enrollment.enrolled_at, v_now),
        completed_at = null
    where id = v_existing_enrollment.id
    returning id into v_enrollment_id;
  else
    -- Create a new enrollment
    insert into public.course_enrollments (
      id, user_id, published_course_id, organization_id, cohort_id,
      enrolled_at, expires_at, completed_at, is_active,
      created_at, updated_at
    ) values (
      gen_random_uuid(), p_user_id, p_published_course_id, v_org_id, p_cohort_id,
      v_access_start, v_access_end, null, true,
      v_now, v_now
    )
    returning id into v_enrollment_id;
  end if;

  ---------------------------------------------------------------
  -- Insert enrollment activity (mirrors paid flow activity shape)
  ---------------------------------------------------------------
  insert into public.course_enrollment_activities (
    enrollment_id, tier_name, tier_description, payment_frequency,
    currency_code, is_free, price_paid, promotional_price, was_promotional,
    access_start, access_end, created_by, created_at
  ) values (
    v_enrollment_id, v_tier_name, v_tier_description, v_tier_frequency,
    v_tier_currency, true, 0, v_tier_promotional_price,
    (v_tier_promotional_price is not null and v_tier_promotional_price < coalesce(v_tier_price, 0)),
    v_access_start, v_access_end, p_user_id, v_now
  ) returning id into v_activity_id;

  ---------------------------------------------------------------
  -- Insert user notification for free enrollment success
  ---------------------------------------------------------------
  begin
    perform public.insert_user_notification(
      p_user_id := p_user_id,
      p_type_key := 'course_enrollment_free_success',
      p_metadata := jsonb_build_object(
        'enrollment_id', v_enrollment_id,
        'course_title', v_course_title,
        'tier_name', v_tier_name,
        'access_start', v_access_start,
        'access_end', v_access_end
      )
    );
  exception
    when others then
      -- Log or ignore notification errors, but don't fail the enrollment
      raise notice 'Failed to insert user notification: %', sqlerrm;
  end;

  
  ---------------------------------------------------------------
  -- Return success summary
  ---------------------------------------------------------------
  return jsonb_build_object(
    'success', true,
    'message', 'User enrolled (free tier) successfully',
    'enrollment_id', v_enrollment_id,
    'activity_id', v_activity_id,
    'user_id', p_user_id,
    'course_title', v_course_title,
    'tier_name', v_tier_name,
    'access_start', v_access_start,
    'access_end', v_access_end
  );

exception
  when unique_violation then
    -- Defensive: if concurrent insert violated unique constraint, fetch the row and return it
    perform 1
    from public.course_enrollments e
    where e.user_id = p_user_id
      and e.published_course_id = p_published_course_id
    limit 1;

    select id into v_enrollment_id
    from public.course_enrollments e
    where e.user_id = p_user_id
      and e.published_course_id = p_published_course_id
    limit 1;

    return jsonb_build_object(
      'success', true,
      'message', 'User already enrolled (race condition handled)',
      'enrollment_id', v_enrollment_id,
      'was_created', false
    );

  when others then
    raise exception 'Free enrollment failed: %', sqlerrm;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_cohort_enrollment_count_on_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  -- Only update if cohort_id is not null
  if NEW.cohort_id is not null then
    update public.cohorts
    set
      current_enrollment_count = current_enrollment_count + 1,
      updated_at = timezone('utc', now())
    where id = NEW.cohort_id;
  end if;

  return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.log_cohort_membership_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_changed_by uuid;
begin
  -- Only log if cohort_id actually changed
  if OLD.cohort_id is distinct from NEW.cohort_id then
    -- Get current user ID (may be null for system operations)
    begin
      v_changed_by := auth.uid();
    exception when others then
      v_changed_by := null;
    end;

    -- Insert history record
    insert into public.cohort_membership_history (
      enrollment_id,
      old_cohort_id,
      new_cohort_id,
      changed_by,
      changed_at
    ) values (
      NEW.id,
      OLD.cohort_id,
      NEW.cohort_id,
      v_changed_by,
      timezone('utc', now())
    );
  end if;

  return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.process_course_payment_from_paystack(p_payment_reference text, p_paystack_transaction_id text, p_user_id uuid, p_published_course_id uuid, p_tier_id uuid, p_amount_paid numeric, p_currency_code text, p_payment_method text DEFAULT 'card'::text, p_paystack_fee numeric DEFAULT 0, p_metadata jsonb DEFAULT '{}'::jsonb, p_cohort_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
    -- Course & org info
    v_course_title text;
    v_organization_id uuid;
    v_org_tier public.subscription_tier;
    v_platform_fee_percent numeric(5,2);

    -- Tier info
    v_tier_name text;
    v_tier_description text;
    v_tier_price numeric(19,4);
    v_tier_promotional_price numeric(19,4);
    v_tier_frequency public.payment_frequency;
    v_tier_currency public.currency_code;

    -- Amount calculations
    v_gross_amount numeric(19,4);
    v_platform_fee_amount numeric(19,4);
    v_org_payout numeric(19,4);
    v_net_settlement numeric(19,4);
    v_platform_net_revenue numeric(19,4);

    -- Wallets
    v_org_wallet_id uuid;
    v_platform_wallet_id uuid;

    -- Ledger
    v_ledger_course_purchase uuid;
    v_ledger_org_payout uuid;
    v_ledger_platform_revenue uuid;
    v_ledger_gateway_fee uuid;

    -- Enrollment
    v_enrollment_id uuid;
    v_access_start timestamptz := timezone('utc', now());
    v_activity_id uuid;

    -- Purchase history
    v_purchase_id uuid;

    -- Notification
    v_notification_id uuid;
begin
    ---------------------------------------------------------------
    -- Idempotency
    ---------------------------------------------------------------
    perform 1
    from public.wallet_ledger_entries
    where payment_reference = p_payment_reference
    limit 1;

    if found then
        return jsonb_build_object(
            'success', false,
            'message', 'Payment already processed',
            'payment_reference', p_payment_reference
        );
    end if;

    ---------------------------------------------------------------
    -- Validate course & organization
    ---------------------------------------------------------------
    select pc.name, pc.organization_id
    into v_course_title, v_organization_id
    from public.published_courses pc
    where pc.id = p_published_course_id
      and pc.is_active = true;

    if not found then
        raise exception 'Published course not found or inactive: %', p_published_course_id;
    end if;

    -- FIXED: Get tier from organization_subscriptions table
    select os.tier into v_org_tier
    from public.organization_subscriptions os
    where os.organization_id = v_organization_id
      and os.status = 'active';

    if not found then
        raise exception 'No active subscription found for organization: %', v_organization_id;
    end if;

    select tl.platform_fee_percentage
    into v_platform_fee_percent
    from public.tier_limits tl
    where tl.tier = v_org_tier;

    ---------------------------------------------------------------
    -- Get paid pricing tier
    ---------------------------------------------------------------
    select 
        pt.tier_name,
        pt.tier_description,
        pt.price,
        pt.promotional_price,
        pt.payment_frequency::public.payment_frequency,
        pt.currency_code::public.currency_code
    into
        v_tier_name,
        v_tier_description,
        v_tier_price,
        v_tier_promotional_price,
        v_tier_frequency,
        v_tier_currency
    from public.course_pricing_tiers pt
    where pt.course_id = p_published_course_id
      and pt.id = p_tier_id
      and pt.is_active = true
      and pt.is_free = false;

    if not found then
        raise exception 'Paid pricing tier not found: %', p_tier_id;
    end if;

    ---------------------------------------------------------------
    -- Determine actual price charged
    ---------------------------------------------------------------
    if v_tier_promotional_price is not null
       and v_tier_promotional_price < v_tier_price then
        v_gross_amount := v_tier_promotional_price;
    else
        v_gross_amount := v_tier_price;
    end if;

    if p_amount_paid != v_gross_amount then
        raise exception 'Amount mismatch. Expected %, received %',
            v_gross_amount, p_amount_paid;
    end if;

    ---------------------------------------------------------------
    -- Ensure wallets exist
    ---------------------------------------------------------------
    select ow.id
    into v_org_wallet_id
    from public.organization_wallets ow
    where ow.organization_id = v_organization_id
      and ow.currency_code = v_tier_currency;

    if not found then
        insert into public.organization_wallets (organization_id, currency_code)
        values (v_organization_id, v_tier_currency)
        returning id into v_org_wallet_id;
    end if;

    select gw.id
    into v_platform_wallet_id
    from public.gonasi_wallets gw
    where gw.currency_code = v_tier_currency;

    if not found then
        raise exception 'Platform wallet missing for currency: %', v_tier_currency;
    end if;

    ---------------------------------------------------------------
    -- Compute distribution
    ---------------------------------------------------------------
    v_net_settlement := v_gross_amount - p_paystack_fee;
    v_platform_fee_amount := round(v_gross_amount * (v_platform_fee_percent / 100), 4);
    v_org_payout := v_gross_amount - v_platform_fee_amount;
    v_platform_net_revenue := v_platform_fee_amount - p_paystack_fee;

    ---------------------------------------------------------------
    -- PAYMENT FLOW (Ledger entries only - trigger updates wallets)
    ---------------------------------------------------------------

    -- 1. External → Organization (Course Purchase)
    -- Type: 'course_purchase' - Customer pays for course
    -- Trigger will credit organization wallet balance_total
    insert into public.wallet_ledger_entries(
        source_wallet_type, source_wallet_id,
        destination_wallet_type, destination_wallet_id,
        currency_code, amount, direction, type, status,
        related_entity_type, related_entity_id,
        payment_reference, metadata
    ) values (
        'external', null,
        'organization', v_org_wallet_id,
        v_tier_currency, v_gross_amount, 'credit', 'course_purchase', 'completed',
        'course', p_published_course_id,
        p_payment_reference,
        jsonb_build_object(
            'description', 'Course purchase payment received via Paystack',
            'user_id', p_user_id,
            'course_title', v_course_title,
            'tier_name', v_tier_name,
            'payment_method', p_payment_method,
            'gross_amount', v_gross_amount,
            'paystack_transaction_id', p_paystack_transaction_id
        )
    ) returning id into v_ledger_course_purchase;

    -- 2. Organization → Platform (Platform Revenue)
    -- Type: 'platform_revenue' - Platform takes its commission
    -- Trigger will debit organization wallet and credit platform wallet
    insert into public.wallet_ledger_entries(
        source_wallet_type, source_wallet_id,
        destination_wallet_type, destination_wallet_id,
        currency_code, amount, direction, type, status,
        related_entity_type, related_entity_id,
        payment_reference, metadata
    ) values (
        'organization', v_org_wallet_id,
        'platform', v_platform_wallet_id,
        v_tier_currency, v_platform_fee_amount, 'debit', 'platform_revenue', 'completed',
        'course', p_published_course_id,
        p_payment_reference,
        jsonb_build_object(
            'description', 'Platform commission on course sale',
            'platform_fee_percent', v_platform_fee_percent,
            'platform_fee_amount', v_platform_fee_amount,
            'gross_amount', v_gross_amount,
            'org_payout', v_org_payout,
            'course_purchase_ledger_id', v_ledger_course_purchase
        )
    ) returning id into v_ledger_platform_revenue;

    -- 3. Platform → Paystack (Payment Gateway Fee)
    -- Type: 'payment_gateway_fee' - Platform pays gateway processing fee
    -- Trigger will debit platform wallet
    if p_paystack_fee > 0 then
        insert into public.wallet_ledger_entries(
            source_wallet_type, source_wallet_id,
            destination_wallet_type, destination_wallet_id,
            currency_code, amount, direction, type, status,
            related_entity_type, related_entity_id,
            payment_reference, metadata
        ) values (
            'platform', v_platform_wallet_id,
            'external', null,
            v_tier_currency, p_paystack_fee, 'debit', 'payment_gateway_fee', 'completed',
            'course', p_published_course_id,
            p_payment_reference,
            jsonb_build_object(
                'description', 'Payment gateway processing fee',
                'gateway', 'Paystack',
                'payment_method', p_payment_method,
                'platform_net_revenue', v_platform_net_revenue,
                'course_purchase_ledger_id', v_ledger_course_purchase
            )
        ) returning id into v_ledger_gateway_fee;
    end if;

    ---------------------------------------------------------------
    -- Enrollment (PAID ONLY)
    ---------------------------------------------------------------
    select id
    into v_enrollment_id
    from public.course_enrollments
    where user_id = p_user_id
      and published_course_id = p_published_course_id
    for update;

    if found then
        update public.course_enrollments
        set expires_at = v_access_start + interval '1 month',
            is_active = true,
            updated_at = timezone('utc', now())
        where id = v_enrollment_id;
    else
        insert into public.course_enrollments(
            user_id, published_course_id, organization_id, cohort_id,
            enrolled_at, expires_at, is_active
        ) values (
            p_user_id, p_published_course_id, v_organization_id, p_cohort_id,
            v_access_start, v_access_start + interval '1 month', true
        ) returning id into v_enrollment_id;
    end if;

    insert into public.course_enrollment_activities(
        enrollment_id, tier_name, tier_description, payment_frequency,
        currency_code, is_free, price_paid, promotional_price, was_promotional,
        access_start, access_end, created_by
    ) values (
        v_enrollment_id, v_tier_name, v_tier_description, v_tier_frequency,
        v_tier_currency, false, v_gross_amount, v_tier_promotional_price,
        (v_tier_promotional_price is not null),
        v_access_start, v_access_start + interval '1 month', p_user_id
    ) returning id into v_activity_id;

    ---------------------------------------------------------------
    -- Purchase History
    ---------------------------------------------------------------
    insert into public.user_purchases (
        user_id, published_course_id, amount_paid, currency_code,
        payment_reference, transaction_type, purchased_at, metadata
    ) values (
        p_user_id, p_published_course_id, v_gross_amount, v_tier_currency,
        p_payment_reference, 'course_purchase', timezone('utc', now()),
        jsonb_build_object(
            'course_title', v_course_title,
            'tier_id', p_tier_id,
            'tier_name', v_tier_name,
            'tier_description', v_tier_description,
            'payment_frequency', v_tier_frequency,
            'original_price', v_tier_price,
            'promotional_price', v_tier_promotional_price,
            'was_promotional', (v_tier_promotional_price is not null and v_tier_promotional_price < v_tier_price),
            'payment_method', p_payment_method,
            'paystack_transaction_id', p_paystack_transaction_id,
            'gross_amount', v_gross_amount,
            'paystack_fee', p_paystack_fee,
            'platform_fee_percent', v_platform_fee_percent,
            'platform_fee_amount', v_platform_fee_amount,
            'organization_payout', v_org_payout,
            'organization_id', v_organization_id,
            'organization_tier', v_org_tier,
            'enrollment_id', v_enrollment_id,
            'activity_id', v_activity_id,
            'access_start', v_access_start,
            'access_end', v_access_start + interval '1 month',
            'user_metadata', p_metadata,
            'processed_at', timezone('utc', now()),
            'ledger_entries', jsonb_build_object(
                'course_purchase', v_ledger_course_purchase,
                'platform_revenue', v_ledger_platform_revenue,
                'gateway_fee', v_ledger_gateway_fee
            )
        ) 
    ) returning id into v_purchase_id;

    ---------------------------------------------------------------
    -- Non-fatal: create user notification for successful purchase/enrollment
    ---------------------------------------------------------------
    begin
      perform public.insert_user_notification(
        p_user_id,
        'course_purchase_success',
        jsonb_build_object(
          'purchase_id', v_purchase_id,
          'course_id', p_published_course_id,
          'course_title', v_course_title,
          'tier_id', p_tier_id,
          'tier_name', v_tier_name,
          'amount_paid', v_gross_amount,
          'currency', v_tier_currency,
          'access_start', v_access_start,
          'access_end', v_access_start + interval '1 month',
          'payment_reference', p_payment_reference,
          'payment_transaction_id', p_paystack_transaction_id
        )
      );
    exception
      when others then
        -- Don't fail the entire transaction if notification insertion fails.
        -- Log the issue and continue.
        raise warning 'insert_user_notification failed for purchase %: %', coalesce(v_purchase_id::text, 'null'), sqlerrm;
    end;

    ---------------------------------------------------------------
    -- Return summary
    ---------------------------------------------------------------
    return jsonb_build_object(
        'success', true,
        'message', 'Paid course purchase processed successfully',
        'enrollment', jsonb_build_object(
            'enrollment_id', v_enrollment_id,
            'activity_id', v_activity_id,
            'user_id', p_user_id,
            'course_title', v_course_title,
            'tier_name', v_tier_name,
            'access_start', v_access_start,
            'access_end', v_access_start + interval '1 month'
        ),
        'payment', jsonb_build_object(
            'reference', p_payment_reference,
            'transaction_id', p_paystack_transaction_id,
            'gross_amount', v_gross_amount,
            'currency', v_tier_currency,
            'payment_method', p_payment_method
        ),
        'distribution', jsonb_build_object(
            'gross_amount', v_gross_amount,
            'paystack_fee', p_paystack_fee,
            'net_settlement', v_net_settlement,
            'platform_fee_percent', v_platform_fee_percent,
            'platform_fee_amount', v_platform_fee_amount,
            'organization_payout', v_org_payout,
            'platform_net_revenue', v_platform_net_revenue
        ),
        'ledger_entries', jsonb_build_object(
            'course_purchase', v_ledger_course_purchase,
            'platform_revenue', v_ledger_platform_revenue,
            'gateway_fee', v_ledger_gateway_fee
        ),
        'purchase', jsonb_build_object('purchase_id', v_purchase_id)
    );

exception
    when others then
        raise exception 'Payment processing failed: %', sqlerrm;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_cohort_enrollment_count_on_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  -- Only process if cohort_id actually changed
  if OLD.cohort_id is distinct from NEW.cohort_id then
    -- Decrement old cohort count (if there was one)
    if OLD.cohort_id is not null then
      update public.cohorts
      set
        current_enrollment_count = current_enrollment_count - 1,
        updated_at = timezone('utc', now())
      where id = OLD.cohort_id;
    end if;

    -- Increment new cohort count (if there is one)
    if NEW.cohort_id is not null then
      update public.cohorts
      set
        current_enrollment_count = current_enrollment_count + 1,
        updated_at = timezone('utc', now())
      where id = NEW.cohort_id;
    end if;
  end if;

  return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_cohort_organization_course_match()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_course_org_id uuid;
begin
  -- Get the organization_id from the published course
  select organization_id
  into v_course_org_id
  from public.published_courses
  where id = NEW.published_course_id;

  if not found then
    raise exception 'Published course not found: %', NEW.published_course_id;
  end if;

  -- Verify organization match
  if v_course_org_id != NEW.organization_id then
    raise exception 'Cohort organization_id (%) does not match published course organization_id (%)',
      NEW.organization_id, v_course_org_id;
  end if;

  return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_enrollment_cohort_course_match()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_cohort_course_id uuid;
begin
  -- Allow NULL cohort_id (enrollments without cohorts are valid)
  if NEW.cohort_id is null then
    return NEW;
  end if;

  -- Get the published_course_id from the cohort
  select published_course_id
  into v_cohort_course_id
  from public.cohorts
  where id = NEW.cohort_id;

  if not found then
    raise exception 'Cohort not found: %', NEW.cohort_id;
  end if;

  -- Verify course match
  if v_cohort_course_id != NEW.published_course_id then
    raise exception 'Cohort belongs to course % but enrollment is for course %',
      v_cohort_course_id, NEW.published_course_id;
  end if;

  return NEW;
end;
$function$
;

grant delete on table "public"."cohort_membership_history" to "anon";

grant insert on table "public"."cohort_membership_history" to "anon";

grant references on table "public"."cohort_membership_history" to "anon";

grant select on table "public"."cohort_membership_history" to "anon";

grant trigger on table "public"."cohort_membership_history" to "anon";

grant truncate on table "public"."cohort_membership_history" to "anon";

grant update on table "public"."cohort_membership_history" to "anon";

grant delete on table "public"."cohort_membership_history" to "authenticated";

grant insert on table "public"."cohort_membership_history" to "authenticated";

grant references on table "public"."cohort_membership_history" to "authenticated";

grant select on table "public"."cohort_membership_history" to "authenticated";

grant trigger on table "public"."cohort_membership_history" to "authenticated";

grant truncate on table "public"."cohort_membership_history" to "authenticated";

grant update on table "public"."cohort_membership_history" to "authenticated";

grant delete on table "public"."cohort_membership_history" to "service_role";

grant insert on table "public"."cohort_membership_history" to "service_role";

grant references on table "public"."cohort_membership_history" to "service_role";

grant select on table "public"."cohort_membership_history" to "service_role";

grant trigger on table "public"."cohort_membership_history" to "service_role";

grant truncate on table "public"."cohort_membership_history" to "service_role";

grant update on table "public"."cohort_membership_history" to "service_role";

grant delete on table "public"."cohorts" to "anon";

grant insert on table "public"."cohorts" to "anon";

grant references on table "public"."cohorts" to "anon";

grant select on table "public"."cohorts" to "anon";

grant trigger on table "public"."cohorts" to "anon";

grant truncate on table "public"."cohorts" to "anon";

grant update on table "public"."cohorts" to "anon";

grant delete on table "public"."cohorts" to "authenticated";

grant insert on table "public"."cohorts" to "authenticated";

grant references on table "public"."cohorts" to "authenticated";

grant select on table "public"."cohorts" to "authenticated";

grant trigger on table "public"."cohorts" to "authenticated";

grant truncate on table "public"."cohorts" to "authenticated";

grant update on table "public"."cohorts" to "authenticated";

grant delete on table "public"."cohorts" to "service_role";

grant insert on table "public"."cohorts" to "service_role";

grant references on table "public"."cohorts" to "service_role";

grant select on table "public"."cohorts" to "service_role";

grant trigger on table "public"."cohorts" to "service_role";

grant truncate on table "public"."cohorts" to "service_role";

grant update on table "public"."cohorts" to "service_role";


  create policy "select: course editors can view cohort history"
  on "public"."cohort_membership_history"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.course_enrollments ce
  WHERE ((ce.id = cohort_membership_history.enrollment_id) AND public.can_user_edit_course(ce.published_course_id)))));



  create policy "delete: course editors can delete cohorts"
  on "public"."cohorts"
  as permissive
  for delete
  to authenticated
using (public.can_user_edit_course(published_course_id));



  create policy "insert: course editors can create cohorts"
  on "public"."cohorts"
  as permissive
  for insert
  to authenticated
with check (public.can_user_edit_course(published_course_id));



  create policy "select: course editors can view cohorts"
  on "public"."cohorts"
  as permissive
  for select
  to authenticated
using (public.can_user_edit_course(published_course_id));



  create policy "update: course editors can update cohorts"
  on "public"."cohorts"
  as permissive
  for update
  to authenticated
using (public.can_user_edit_course(published_course_id))
with check (public.can_user_edit_course(published_course_id));


CREATE TRIGGER trg_cohorts_update_updated_at BEFORE UPDATE ON public.cohorts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_validate_cohort_org_course_match BEFORE INSERT OR UPDATE ON public.cohorts FOR EACH ROW EXECUTE FUNCTION public.validate_cohort_organization_course_match();

CREATE TRIGGER trg_decrement_cohort_count_delete AFTER DELETE ON public.course_enrollments FOR EACH ROW EXECUTE FUNCTION public.decrement_cohort_enrollment_count_on_delete();

CREATE TRIGGER trg_increment_cohort_count_insert AFTER INSERT ON public.course_enrollments FOR EACH ROW EXECUTE FUNCTION public.increment_cohort_enrollment_count_on_insert();

CREATE TRIGGER trg_log_cohort_membership_change AFTER UPDATE OF cohort_id ON public.course_enrollments FOR EACH ROW WHEN ((old.cohort_id IS DISTINCT FROM new.cohort_id)) EXECUTE FUNCTION public.log_cohort_membership_change();

CREATE TRIGGER trg_update_cohort_count_update AFTER UPDATE OF cohort_id ON public.course_enrollments FOR EACH ROW WHEN ((old.cohort_id IS DISTINCT FROM new.cohort_id)) EXECUTE FUNCTION public.update_cohort_enrollment_count_on_update();

CREATE TRIGGER trg_validate_enrollment_cohort_match BEFORE INSERT OR UPDATE OF cohort_id ON public.course_enrollments FOR EACH ROW EXECUTE FUNCTION public.validate_enrollment_cohort_course_match();


