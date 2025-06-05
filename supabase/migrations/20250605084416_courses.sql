-- ====================================================================================
-- ENUM TYPES
-- ====================================================================================

-- Defines pricing models for courses
create type course_pricing as enum ('free', 'paid');

-- Defines course access levels
create type course_access as enum ('public', 'private');

-- ====================================================================================
-- COURSES TABLE
-- ====================================================================================

create table public.courses (
  id uuid default uuid_generate_v4() primary key,

  -- Foreign keys
  pathway_id uuid null references pathways(id) on delete set null,
  category_id uuid null references course_categories(id) on delete set null,
  subcategory_id uuid null references course_sub_categories(id) on delete set null,

  -- Metadata
  name text not null,
  description text null,
  image_url text null, -- URL of the course image
  blur_hash text null,

  -- Pricing
  pricing_model course_pricing not null default 'free',
  monthly_subscription_price numeric(19,4) null, -- Used only when pricing_model is 'paid'

  -- Access control
  visibility course_access not null default 'public',

  -- Timestamps
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_published timestamptz null,

  -- Ownership
  created_by uuid not null references profiles(id) on delete restrict,
  updated_by uuid not null references profiles(id) on delete restrict,

  -- Constraints
  constraint check_paid_courses_subscription_price check (
    pricing_model = 'free'
    or (pricing_model = 'paid' and monthly_subscription_price is not null and monthly_subscription_price > 0)
  )
);

-- ====================================================================================
-- INDEXES
-- ====================================================================================

create index idx_courses_created_by on public.courses (created_by);
create index idx_courses_updated_by on public.courses (updated_by);
create index idx_courses_pathway_id on public.courses (pathway_id);
create index idx_courses_category_id on public.courses (category_id);
create index idx_courses_subcategory_id on public.courses (subcategory_id);
create index idx_courses_visibility on public.courses (visibility);

-- ====================================================================================
-- COMMENTS
-- ====================================================================================

comment on table public.courses is 'Stores all course-related metadata and relationships';
comment on column public.courses.image_url is 'URL of the course thumbnail';
comment on column public.courses.monthly_subscription_price is 'Price for monthly access, applicable when course is paid';

-- ====================================================================================
-- TRIGGERS
-- ====================================================================================

-- Automatically update `updated_at` on update
create or replace trigger trg_courses_set_updated_at
before update on public.courses
for each row
execute function update_updated_at_column();