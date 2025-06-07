-- ====================================================================================
-- ENUM TYPES
-- ====================================================================================

-- defines pricing models for courses
create type course_pricing as enum ('free', 'paid');

-- defines course access levels
create type course_access as enum ('public', 'private');

-- ====================================================================================
-- FUNCTION TO CHECK SUBCATEGORY BELONGS TO CATEGORY
-- ====================================================================================

create or replace function public.check_subcategory_belongs_to_category(
  category uuid,
  subcategory uuid
) returns boolean
language plpgsql
stable
set search_path = ''
as $$
begin
  if category is null or subcategory is null then
    return true;
  end if;

  return exists (
    select 1
    from public.course_sub_categories
    where id = subcategory
      and category_id = category
  );
end;
$$;


-- ====================================================================================
-- COURSES TABLE
-- ====================================================================================

create table public.courses (
  id uuid default uuid_generate_v4() primary key,

  -- foreign keys
  pathway_id uuid null references pathways(id) on delete set null,
  category_id uuid null references course_categories(id) on delete set null,
  subcategory_id uuid null references course_sub_categories(id) on delete set null,

  -- metadata
  name text not null,
  description text null,
  image_url text null, -- url of the course image
  blur_hash text null,

  -- pricing
  pricing_model course_pricing not null default 'free',
  monthly_subscription_price numeric(19,4) null, -- used only when pricing_model is 'paid'

  -- access control
  visibility course_access not null default 'public',

  -- timestamps
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_published timestamptz null,

  -- ownership
  created_by uuid not null references profiles(id) on delete restrict,
  updated_by uuid not null references profiles(id) on delete restrict,

  -- constraints
  constraint check_paid_courses_subscription_price check (
    pricing_model = 'free'
    or (pricing_model = 'paid' and monthly_subscription_price is not null and monthly_subscription_price > 0)
  ),

  -- new constraint to ensure subcategory belongs to category
  constraint chk_subcategory_belongs_to_category check (
    public.check_subcategory_belongs_to_category(category_id, subcategory_id)
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

comment on table public.courses is 'stores all course-related metadata and relationships';
comment on column public.courses.image_url is 'url of the course thumbnail';
comment on column public.courses.monthly_subscription_price is 'price for monthly access, applicable when course is paid';
