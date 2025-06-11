-- ====================================================================================
-- ENUM TYPE: Payment Frequency
-- ====================================================================================

create type payment_frequency as enum (
  'monthly',
  'bi_monthly',     -- every 2 months
  'quarterly',      -- every 3 months
  'semi_annual',    -- every 6 months
  'annual'          -- every 12 months
);

-- ====================================================================================
-- TABLE: Course Pricing Tiers
-- ====================================================================================

create table public.course_pricing_tiers (
  id uuid default uuid_generate_v4() primary key,

  -- Reference to the associated course
  course_id uuid not null references courses(id) on delete cascade,

  -- Subscription frequency
  payment_frequency payment_frequency not null,

  -- Free tier flag
  is_free boolean not null default true,

  -- Base price for the tier 
  price numeric(19,4) not null check (price >= 0),

  -- ISO 4217 currency code (e.g., USD, EUR)
  currency_code char(3) not null default 'KES' check (currency_code in ('KES', 'USD')),

  -- Optional promotional discount fields
  discount_percentage numeric(5,2) null check (
    discount_percentage >= 0 and discount_percentage <= 100
  ),
  promotional_price numeric(19,4) null check (promotional_price >= 0),
  promotion_start_date timestamptz null,
  promotion_end_date timestamptz null,

  -- Optional display metadata
  tier_name text null,           -- e.g., "Monthly Plan"
  tier_description text null,    -- Marketing or product description

  -- Status and ordering flags
  is_active boolean not null default true,
  position integer not null default 0,  

  -- UI feature flags
  is_popular boolean not null default false,
  is_recommended boolean not null default false,

  -- Audit fields
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid not null references profiles(id) on delete cascade,
  updated_by uuid not null references profiles(id) on delete cascade,

  -- Logical constraints
  constraint chk_promotion_dates check (
    promotion_start_date is null or promotion_end_date is null or 
    promotion_start_date < promotion_end_date
  ),
  constraint chk_promotional_price check (
    is_free = true or promotional_price is null or promotional_price < price
  ),
  constraint chk_price_nonfree check (
    is_free = true or price > 0
  ),
  constraint chk_free_has_no_promo check (
    is_free = false or (
      promotional_price is null and 
      discount_percentage is null and 
      promotion_start_date is null and 
      promotion_end_date is null
    )
  ),
  constraint uq_active_frequency_per_course unique (
    course_id, payment_frequency, is_active
  ) deferrable initially deferred
);

-- ====================================================================================
-- Indexes for course_pricing_tiers
-- ====================================================================================

create index idx_course_pricing_tiers_course_id on public.course_pricing_tiers (course_id);
create index idx_course_pricing_tiers_created_by on public.course_pricing_tiers (created_by);
create index idx_course_pricing_tiers_updated_by on public.course_pricing_tiers (updated_by);
create index idx_course_pricing_tiers_course_id_active on public.course_pricing_tiers (course_id, is_active);
create index idx_course_pricing_tiers_position on public.course_pricing_tiers (course_id, position);
create index idx_course_pricing_tiers_promotion_dates on public.course_pricing_tiers (promotion_start_date, promotion_end_date);
create index idx_course_pricing_tiers_popular_recommended on public.course_pricing_tiers (is_popular, is_recommended);

-- ====================================================================================
-- COMMENT: Table Description
-- ====================================================================================

comment on table public.course_pricing_tiers is 'Subscription pricing options for a course, supporting multiple payment frequencies, promotional pricing, and free access tiers.';

-- ====================================================================================
-- TRIGGERS: Automatically set the tier position when not provided
-- ====================================================================================

create or replace function public.set_course_pricing_tier_position()
returns trigger
as $$
begin
  if new.position is null or new.position = 0 then
    select coalesce(max(position), 0) + 1
    into new.position
    from public.course_pricing_tiers
    where course_id = new.course_id;
  end if;
  return new;
end;
$$
language plpgsql
set search_path = '';

create trigger trg_set_course_pricing_tier_position
before insert on public.course_pricing_tiers
for each row
execute function public.set_course_pricing_tier_position();

-- ====================================================================================
-- TRIGGERS: Business logic for handling free tiers and paid-tier enforcement
-- ====================================================================================

-- Deletes all other pricing tiers for a course if a free tier is added
create or replace function public.trg_delete_other_tiers_if_free()
returns trigger as $$
begin
  if new.is_free = true then
    delete from public.course_pricing_tiers
    where course_id = new.course_id
      and id != new.id;
  end if;
  return new;
end;
$$ language plpgsql
set search_path = '';


create trigger trg_handle_free_tier
after insert or update on public.course_pricing_tiers
for each row
execute function public.trg_delete_other_tiers_if_free();

-- Prevent deletion of the last paid tier for a course
create or replace function public.trg_prevent_deleting_last_paid_tier()
returns trigger as $$
declare
  remaining_paid_tiers int;
begin
  if old.is_free = false then
    select count(*) into remaining_paid_tiers
    from public.course_pricing_tiers
    where course_id = old.course_id
      and id != old.id
      and is_free = false;

    if remaining_paid_tiers = 0 then
      raise exception 'Cannot delete the last paid tier for a paid course (course_id=%)', old.course_id;
    end if;
  end if;
  return old;
end;
$$ language plpgsql
set search_path = '';


create trigger trg_prevent_last_paid_tier_deletion
before delete on public.course_pricing_tiers
for each row
execute function public.trg_prevent_deleting_last_paid_tier();



-- ====================================================================================
-- ENABLE ROW LEVEL SECURITY
-- ====================================================================================

alter table public.course_pricing_tiers enable row level security;

-- ====================================================================================
-- RLS POLICIES
-- ====================================================================================

create policy "select: users with course roles or owners can view pricing tiers"
on public.course_pricing_tiers
for select
to authenticated
using (
  exists (
    select 1 from public.courses c
    where c.id = course_pricing_tiers.course_id
      and (
        is_course_admin(c.id, (select auth.uid())) or
        is_course_editor(c.id, (select auth.uid())) or
        is_course_viewer(c.id, (select auth.uid())) or
        c.created_by = (select auth.uid())
      )
  )
);

create policy "insert: users with course roles or owners can add pricing tiers"
on public.course_pricing_tiers
for insert
to authenticated
with check (
  exists (
    select 1 from public.courses c
    where c.id = course_pricing_tiers.course_id
      and (
        is_course_admin(c.id, (select auth.uid())) or
        is_course_editor(c.id, (select auth.uid())) or
        c.created_by = (select auth.uid())
      )
  )
);

create policy "update: users with admin/editor roles or owners can modify pricing tiers"
on public.course_pricing_tiers
for update
to authenticated
using (
  exists (
    select 1 from public.courses c
    where c.id = course_pricing_tiers.course_id
      and (
        is_course_admin(c.id, (select auth.uid())) or
        is_course_editor(c.id, (select auth.uid())) or
        c.created_by = (select auth.uid())
      )
  )
)
with check (
  exists (
    select 1 from public.courses c
    where c.id = course_pricing_tiers.course_id
      and (
        is_course_admin(c.id, (select auth.uid())) or
        is_course_editor(c.id, (select auth.uid())) or
        c.created_by = (select auth.uid())
      )
  )
);

create policy "delete: course admins, editors, and owners can remove pricing tiers"
on public.course_pricing_tiers
for delete
to authenticated
using (
  exists (
    select 1 from public.courses c
    where c.id = course_pricing_tiers.course_id
      and (
        is_course_admin(c.id, (select auth.uid())) or
        is_course_editor(c.id, (select auth.uid())) or
        c.created_by = (select auth.uid())
      )
  )
);


-- ====================================================================================
-- FUNCTION: add_default_free_pricing_tier
-- ====================================================================================
-- Purpose:
--   Automatically creates a default free pricing tier for a newly created course.
--
-- When Triggered:
--   After a row is inserted into the `courses` table.
--
-- Behavior:
--   - Inserts a single free pricing tier for the new course.
--   - Uses the creator of the course (`created_by`) as both creator and updater.
--   - Sets default values:
--       - is_free: true
--       - price: 0
--       - currency_code: 'KES'
--       - payment_frequency: 'monthly'
--       - tier_name: 'Free Tier'
--
-- Assumptions:
--   - The `courses` table has a `created_by` field.
--   - The `course_pricing_tiers` table supports default tier creation without violating constraints.
--
-- Notes:
--   - This function does not check if other tiers already exist (runs only on insert).
--   - It’s designed to work in tandem with triggers enforcing uniqueness constraints.
-- ====================================================================================

create or replace function public.add_default_free_pricing_tier()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  insert into public.course_pricing_tiers (
    course_id,
    is_free,
    price,
    currency_code,
    created_by,
    updated_by,
    payment_frequency,
    tier_name
  )
  values (
    new.id,
    true,
    0,
    'KES',
    new.created_by,
    new.created_by,
    'monthly',
    'Free Tier'
  );

  return new;
end;
$$;


-- ====================================================================================
-- TRIGGER: trg_add_default_free_pricing_tier
-- ====================================================================================
-- Purpose:
--   Automatically invokes the `add_default_free_pricing_tier` function after a course
--   is inserted into the `courses` table.
--
-- Timing:
--   AFTER INSERT
--
-- Table:
--   public.courses
--
-- Scope:
--   FOR EACH ROW — Executes once per inserted course
--
-- Behavior:
--   - Ensures every course starts with a basic free tier
--   - Simplifies initial setup and ensures pricing model is consistent
--
-- Dependencies:
--   - Relies on the trigger function `add_default_free_pricing_tier`
-- ====================================================================================

create trigger trg_add_default_free_pricing_tier
after insert on public.courses
for each row
execute function public.add_default_free_pricing_tier();


-- ====================================================================================
-- RPC: Set a course as free and delete other tiers
-- Purpose: Converts a course to free by deleting all tiers and inserting a free one.
-- Params:
--   - p_course_id: UUID of the course to update
--   - p_user_id: UUID of the user performing the action
-- Access: Requires course admin/editor or creator permissions
-- ====================================================================================

create or replace function public.set_course_free(p_course_id uuid, p_user_id uuid)
returns void
language plpgsql
set search_path = ''
as $$ 
declare
  has_access boolean;
begin
  -- Check if the user has sufficient permission to modify the course
  select exists (
    select 1 from public.courses c
    where c.id = p_course_id
      and (
        is_course_admin(c.id, p_user_id)
        or is_course_editor(c.id, p_user_id)
        or c.created_by = p_user_id
      )
  ) into has_access;

  if not has_access then
    raise exception 'Permission denied: You do not have access to modify this course (course_id=%)', p_course_id
      using errcode = '42501'; -- insufficient_privilege
  end if;

  -- Delete all tiers related to the course
  delete from public.course_pricing_tiers
  where course_id = p_course_id;

  -- Insert the free tier
  insert into public.course_pricing_tiers (
    course_id, is_free, price, currency_code, created_by, updated_by,
    payment_frequency, tier_name
  ) values (
    p_course_id, true, 0, 'KES', p_user_id, p_user_id,
    'monthly', 'Free Tier'
  );
end;
$$;


-- ====================================================================================
-- RPC: set_course_paid
-- Purpose:
--   Sets a course as paid by inserting a default paid pricing tier
--   if none exist. Ensures at least one tier exists for the course.
--
-- Params:
--   - p_course_id: UUID of the course to modify
--   - p_user_id: UUID of the user performing the operation
--
-- Access: Must be course owner, admin, or editor
-- ====================================================================================

create or replace function public.set_course_paid(p_course_id uuid, p_user_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  has_access boolean;
  paid_tiers_count integer;
begin
  -- Check access
  select exists (
    select 1 from public.courses c
    where c.id = p_course_id
      and (
        is_course_admin(c.id, p_user_id)
        or is_course_editor(c.id, p_user_id)
        or c.created_by = p_user_id
      )
  ) into has_access;

  if not has_access then
    raise exception 'Permission denied: You do not have access to modify this course (course_id=%)', p_course_id
      using errcode = '42501';
  end if;

  -- Check if course already has any paid tiers
  select count(*) into paid_tiers_count
  from public.course_pricing_tiers
  where course_id = p_course_id
    and is_free = false;

  -- Insert default paid tier only if none exists
  if paid_tiers_count = 0 then
    insert into public.course_pricing_tiers (
      course_id,
      is_free,
      price,
      currency_code,
      created_by,
      updated_by,
      payment_frequency,
      tier_name,
      tier_description
    ) values (
      p_course_id,
      false,
      100.00,
      'KES',
      p_user_id,
      p_user_id,
      'monthly',
      'Standard Plan',
      'Automatically added paid tier. You can update this.'
    );
  end if;
end;
$$;
