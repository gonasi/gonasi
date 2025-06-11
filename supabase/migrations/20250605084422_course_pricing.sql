-- ============================================================================
-- course pricing tiers schema
-- ============================================================================
-- this schema defines a flexible pricing system for courses that supports:
-- - multiple payment frequencies (monthly, quarterly, annual, etc.)
-- - free and paid tiers with promotional pricing
-- - automatic tier management with business logic enforcement
-- - comprehensive rbac (role-based access control) policies
-- ============================================================================

-- ============================================================================
-- enum types
-- ============================================================================

-- defines supported payment frequencies for course subscriptions
-- this enum ensures consistency across the application and prevents invalid frequency values
create type payment_frequency as enum (
  'monthly',        -- charged every month
  'bi_monthly',     -- charged every 2 months
  'quarterly',      -- charged every 3 months (popular for business courses)
  'semi_annual',    -- charged every 6 months
  'annual'          -- charged every 12 months (often discounted)
);

-- ============================================================================
-- main table: course_pricing_tiers
-- ============================================================================

-- this table stores all pricing information for courses, supporting both free and paid models
-- each course can have multiple pricing tiers with different payment frequencies
-- the table includes promotional pricing, display metadata, and audit trails
create table public.course_pricing_tiers (
  -- primary key and course relationship
  id uuid default uuid_generate_v4() primary key,
  course_id uuid not null references courses(id) on delete cascade,

  -- core pricing configuration
  payment_frequency payment_frequency not null,
  is_free boolean not null default true,
  price numeric(19,4) not null check (price >= 0),
  currency_code char(3) not null default 'KES' check (currency_code in ('KES', 'USD')),

  -- promotional pricing system
  -- allows temporary discounts with percentage or fixed price reductions
  discount_percentage numeric(5,2) null check (
    discount_percentage >= 0 and discount_percentage <= 100
  ),
  promotional_price numeric(19,4) null check (promotional_price >= 0),
  promotion_start_date timestamptz null,
  promotion_end_date timestamptz null,

  -- display and marketing metadata
  -- these fields control how pricing tiers appear in the ui
  tier_name text null,           -- e.g., "monthly plan", "premium annual"
  tier_description text null,    -- marketing copy or feature descriptions

  -- status and display ordering
  is_active boolean not null default true,      -- allows soft deletion of tiers
  position integer not null default 0,          -- controls display order in ui

  -- ui enhancement flags
  -- these flags help highlight certain tiers for better conversion
  is_popular boolean not null default false,      -- shows "most popular" badge
  is_recommended boolean not null default false,  -- shows "recommended" badge

  -- comprehensive audit trail
  -- tracks who created/modified each tier and when
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid not null references profiles(id) on delete cascade,
  updated_by uuid not null references profiles(id) on delete cascade,

  -- business logic constraints
  -- these constraints enforce pricing model integrity

  -- ensures promotion dates are logically ordered
  constraint chk_promotion_dates check (
    promotion_start_date is null or promotion_end_date is null or 
    promotion_start_date < promotion_end_date
  ),

  -- ensures promotional price is always lower than regular price
  constraint chk_promotional_price check (
    is_free = true or promotional_price is null or promotional_price < price
  ),

  -- ensures paid tiers have a price greater than zero
  constraint chk_price_nonfree check (
    is_free = true or price > 0
  ),

  -- prevents free tiers from having promotional pricing (business rule)
  -- free tiers should not have promotions as they're already free
  constraint chk_free_has_no_promo check (
    is_free = false or (
      promotional_price is null and 
      discount_percentage is null and 
      promotion_start_date is null and 
      promotion_end_date is null
    )
  ),

  -- ensures only one active tier per payment frequency per course
  -- this prevents confusion and duplicate pricing options
  constraint uq_active_frequency_per_course unique (
    course_id, payment_frequency, is_active
  ) deferrable initially deferred
);

-- ============================================================================
-- performance indexes
-- ============================================================================

-- basic foreign key indexes for join performance
create index idx_course_pricing_tiers_course_id on public.course_pricing_tiers (course_id);
create index idx_course_pricing_tiers_created_by on public.course_pricing_tiers (created_by);
create index idx_course_pricing_tiers_updated_by on public.course_pricing_tiers (updated_by);

-- composite indexes for common query patterns
create index idx_course_pricing_tiers_course_id_active 
  on public.course_pricing_tiers (course_id, is_active);

create index idx_course_pricing_tiers_position 
  on public.course_pricing_tiers (course_id, position);

-- promotional pricing queries
create index idx_course_pricing_tiers_promotion_dates 
  on public.course_pricing_tiers (promotion_start_date, promotion_end_date);

-- ui enhancement flags for marketing queries
create index idx_course_pricing_tiers_popular_recommended 
  on public.course_pricing_tiers (is_popular, is_recommended);

-- ============================================================================
-- table documentation
-- ============================================================================

comment on table public.course_pricing_tiers is 
  'comprehensive pricing system for courses supporting multiple payment frequencies, promotional pricing, free access tiers, and advanced ui customization options. includes built-in business logic constraints and audit trails.';

-- ============================================================================
-- trigger functions and business logic automation
-- ============================================================================

-- automatically sets position for new pricing tiers
-- when a tier is created without specifying position, it gets the next available number
-- this ensures consistent ordering without manual position management
create or replace function public.set_course_pricing_tier_position()
returns trigger
as $$
begin
  -- only set position if it's not provided or is zero
  if new.position is null or new.position = 0 then
    -- find the highest existing position for this course and add 1
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

-- trigger to automatically set position on insert
create trigger trg_set_course_pricing_tier_position
before insert on public.course_pricing_tiers
for each row
execute function public.set_course_pricing_tier_position();

-- enforces the "free tier exclusivity" business rule
-- when a course is marked as free, all other pricing tiers are automatically removed
-- this prevents mixed free/paid models which could confuse users
create or replace function public.trg_delete_other_tiers_if_free()
returns trigger as $$
begin
  if new.is_free = true then
    -- delete all other tiers for this course when adding a free tier
    delete from public.course_pricing_tiers
    where course_id = new.course_id
      and id != new.id;
  end if;
  return new;
end;
$$ 
language plpgsql
set search_path = '';

-- trigger to enforce free tier exclusivity
create trigger trg_handle_free_tier
after insert or update on public.course_pricing_tiers
for each row
execute function public.trg_delete_other_tiers_if_free();

-- prevents deletion of the last paid tier for paid courses
-- this maintains data integrity by ensuring paid courses always have at least one paid option
-- includes bypass mechanism for bulk operations (course conversion scenarios)
create or replace function public.trg_prevent_deleting_last_paid_tier()
returns trigger as $$
declare
  remaining_paid_tiers int;
  bypass_check boolean;
begin
  -- check if we're in a course conversion context (bulk operations)
  -- this allows controlled deletion during course type changes
  select coalesce(current_setting('app.converting_course_pricing', true)::boolean, false) 
  into bypass_check;
  
  if bypass_check then
    return old; -- skip the check during course conversion
  end if;

  -- only check if we're deleting a paid tier
  if old.is_free = false then
    -- count remaining paid tiers after this deletion
    select count(*) into remaining_paid_tiers
    from public.course_pricing_tiers
    where course_id = old.course_id
      and id != old.id
      and is_free = false;

    -- prevent deletion if this would leave zero paid tiers
    if remaining_paid_tiers = 0 then
      raise exception 'cannot delete the last paid tier for a paid course (course_id=%)', old.course_id;
    end if;
  end if;
  
  return old;
end;
$$ 
language plpgsql
set search_path = '';

-- trigger to prevent deletion of last paid tier
create trigger trg_prevent_last_paid_tier_deletion
before delete on public.course_pricing_tiers
for each row
execute function public.trg_prevent_deleting_last_paid_tier();

-- ============================================================================
-- row level security (rls) configuration
-- ============================================================================

-- enable rls to ensure users can only access pricing tiers for courses they have permission to view
alter table public.course_pricing_tiers enable row level security;

-- ============================================================================
-- rls policies for fine-grained access control
-- ============================================================================

-- read access: users can view pricing tiers for courses they have any level of access to
-- this includes course admins, editors, viewers, and course creators
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

-- create access: only course admins, editors, and creators can add new pricing tiers
-- viewers cannot create pricing tiers as this could affect course monetization
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

-- update access: same permissions as create - admins, editors, and creators only
-- requires both using and with check clauses for complete protection
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

-- delete access: same permissions as create/update
-- deletion of pricing tiers is a sensitive operation that affects course monetization
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

-- ============================================================================
-- automated course setup functions
-- ============================================================================

-- automatically creates a default free tier when a new course is created
-- this ensures every course has a basic pricing structure from the start
-- simplifies course creation workflow and provides consistent defaults
create or replace function public.add_default_free_pricing_tier()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- insert a basic free tier for every new course
  -- uses course creator as both creator and updater for audit trail
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
    new.id,              -- the newly created course
    true,                -- free tier
    0,                   -- no cost
    'USD',               -- default currency
    new.created_by,      -- course creator
    new.created_by,      -- course creator
    'monthly',           -- default frequency
    'free tier'          -- descriptive name
  );

  return new;
end;
$$;

-- trigger to automatically add free tier to new courses
-- executes after course creation to ensure course exists before adding pricing tier
create trigger trg_add_default_free_pricing_tier
after insert on public.courses
for each row
execute function public.add_default_free_pricing_tier();

-- ============================================================================
-- course conversion functions (rpc endpoints)
-- ============================================================================

-- converts a paid course to free by removing all paid tiers and adding a free tier
-- this is a complete conversion operation that handles the transition safely
-- includes permission checks and bypass mechanisms for business rule triggers
create or replace function public.set_course_free(p_course_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$ 
declare
  has_access boolean;
  has_paid_tiers boolean;
begin
  -- verify user has permission to modify course pricing
  -- only course admins, editors, and creators can change pricing models
  select exists (
    select 1 from public.courses c
    where c.id = p_course_id
      and (
        public.is_course_admin(c.id, p_user_id)
        or public.is_course_editor(c.id, p_user_id)
        or c.created_by = p_user_id
      )
  ) into has_access;

  if not has_access then
    raise exception 'permission denied: you do not have access to modify this course (course_id=%)', p_course_id
      using errcode = '42501'; -- insufficient_privilege
  end if;

  -- check if course actually has paid tiers to convert
  -- prevents unnecessary operations on already-free courses
  select exists (
    select 1 from public.course_pricing_tiers
    where course_id = p_course_id
      and is_free = false
  ) into has_paid_tiers;

  if not has_paid_tiers then
    raise exception 'course (id=%) is already free.', p_course_id
      using errcode = 'p0001';
  end if;

  -- temporarily bypass business rule triggers during conversion
  -- this allows us to delete all tiers without triggering the "last paid tier" protection
  perform set_config('app.converting_course_pricing', 'true', true);

  -- remove all existing pricing tiers (both free and paid)
  -- this ensures a clean slate for the new free tier
  delete from public.course_pricing_tiers
  where course_id = p_course_id;

  -- re-enable business rule triggers
  perform set_config('app.converting_course_pricing', 'false', true);

  -- create new free tier with standard configuration
  insert into public.course_pricing_tiers (
    course_id, 
    is_free, 
    price, 
    currency_code, 
    created_by, 
    updated_by,
    payment_frequency, 
    tier_name,
    is_active
  ) values (
    p_course_id, 
    true,           -- free tier
    0,              -- no cost
    'KES',          -- local currency default
    p_user_id,      -- conversion performer
    p_user_id,      -- conversion performer
    'monthly',      -- default frequency
    'free tier',    -- standard name
    true            -- active tier
  );
end;
$$;

-- converts a free course to paid by creating a default paid pricing tier
-- this handles the transition from free to paid model with sensible defaults
-- includes validation to prevent accidental conversions
create or replace function public.set_course_paid(p_course_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  has_access boolean;
  paid_tiers_count integer;
begin
  -- verify user permissions for course pricing changes
  select exists (
    select 1 from public.courses c
    where c.id = p_course_id
      and (
        public.is_course_admin(c.id, p_user_id)
        or public.is_course_editor(c.id, p_user_id)
        or c.created_by = p_user_id
      )
  ) into has_access;

  if not has_access then
    raise exception 'permission denied: you do not have access to modify this course (course_id=%)', p_course_id
      using errcode = '42501'; -- insufficient_privilege
  end if;

  -- check if course already has paid tiers
  -- prevents accidental re-conversion of already-paid courses
  select count(*) into paid_tiers_count
  from public.course_pricing_tiers
  where course_id = p_course_id
    and is_free = false;

  if paid_tiers_count > 0 then
    raise exception 'course (id=%) already has a paid tier and is considered paid.', p_course_id
      using errcode = 'p0001';
  end if;

  -- temporarily bypass business rule triggers for clean conversion
  perform set_config('app.converting_course_pricing', 'true', true);

  -- remove all existing tiers to avoid constraint conflicts
  -- this ensures we start with a clean pricing structure
  delete from public.course_pricing_tiers
  where course_id = p_course_id;

  -- re-enable business rule enforcement
  perform set_config('app.converting_course_pricing', 'false', true);

  -- create default paid tier with reasonable starter pricing
  insert into public.course_pricing_tiers (
    course_id,
    is_free,
    price,
    currency_code,
    created_by,
    updated_by,
    payment_frequency,
    tier_name,
    tier_description,
    is_active
  ) values (
    p_course_id,
    false,                                                      -- paid tier
    100.00,                                                     -- starter price in local currency
    'KES',                                                      -- local currency
    p_user_id,                                                  -- conversion performer
    p_user_id,                                                  -- conversion performer
    'monthly',                                                  -- most common frequency
    'standard plan',                                            -- professional name
    'automatically added paid tier. you can update this.',     -- helpful description
    true                                                        -- active tier
  );

end;
$$;