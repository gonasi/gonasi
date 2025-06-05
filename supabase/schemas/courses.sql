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

-- ====================================================================================
-- ROW LEVEL SECURITY
-- ====================================================================================

alter table public.courses enable row level security;

-- ====================================================================================
-- RLS POLICIES: COURSES
-- ====================================================================================

-- Allow user to select (read) their own course
create policy "Select: user can read their own course"
on public.courses
for select
to authenticated
using ((select auth.uid()) = id);

-- Allow user to insert a course with their own ID
create policy "Insert: user can create a course under their ID"
on public.courses
for insert
to authenticated
with check ((select auth.uid()) = id);

-- Allow user to update their own course
create policy "Update: user can modify their own course"
on public.courses
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- Allow user to delete their own course (assuming no members assigned)
create policy "Delete: user can remove their own course"
on public.courses
for delete
to authenticated
using ((select auth.uid()) = id);

-- ====================================================================================
-- STORAGE BUCKET: COURSES
-- ====================================================================================

insert into storage.buckets (id, name, public)
values ('courses', 'courses', true)
on conflict (id) do nothing;

-- ====================================================================================
-- RLS POLICIES: STORAGE OBJECTS (Bucket: courses)
-- ====================================================================================

-- Allow public to read course thumbnails
create policy "Select: allow public read access to course thumbnails"
on storage.objects 
for select
using (bucket_id = 'courses');

-- Allow uploads to the course bucket by anyone (or refine as needed)
create policy "Insert: allow uploads to courses bucket"
on storage.objects
for insert
with check (bucket_id = 'courses');

-- Allow only the owner of the object to update their thumbnail
create policy "Update: allow owner to update their own course thumbnail"
on storage.objects
for update
using ((select auth.uid()) = owner)
with check (bucket_id = 'courses');

-- Allow only the owner of the object to delete their thumbnail
create policy "Delete: allow owner to delete their own course thumbnail"
on storage.objects
for delete
using ((select auth.uid()) = owner and bucket_id = 'courses');
