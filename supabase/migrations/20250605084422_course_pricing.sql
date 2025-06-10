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
  is_free boolean not null default false,

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
-- triggers
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
