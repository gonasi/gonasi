-- ====================================================================================
-- Table: published_course_enrollment_activities
-- Description: Logs each access-granting activity (e.g. enrollment, renewal) 
-- tied to a published course enrollment, including pricing snapshot and access period.
-- ====================================================================================

create table public.published_course_enrollment_activities (
  id uuid primary key default uuid_generate_v4(),

  enrollment_id uuid not null references published_course_enrollments(id) on delete cascade, -- parent enrollment record

  -- snapshot of pricing tier at the time of activity
  pricing_tier_id uuid references course_pricing_tiers(id),    -- can be null for legacy enrollments
  tier_name text,                                               -- tier name at time of activity
  tier_description text,                                        -- tier description at time of activity
  payment_frequency payment_frequency not null,                 -- billing cycle (e.g. monthly, annual)
  currency_code currency_code not null,                         -- ISO 4217 code

  -- pricing details
  is_free boolean not null,                                     -- true if access was granted for free
  price_paid numeric(19,4) not null default 0,                  -- final price paid
  promotional_price numeric(19,4),                              -- original promotional price, if any
  was_promotional boolean not null default false,               -- true if a promo price was applied

  -- access window
  access_start timestamptz not null,                            -- access begins
  access_end timestamptz not null,                              -- access ends

  -- audit fields
  created_at timestamptz not null default timezone('utc', now()), -- recorded at
  created_by uuid not null references profiles(id) on delete set null -- user or admin who initiated it
);

-- ====================================================================================
-- Indexes
-- ====================================================================================

create index idx_enrollment_activities_enrollment_id on public.published_course_enrollment_activities (enrollment_id);
create index idx_enrollment_activities_access_window on public.published_course_enrollment_activities (access_start, access_end);
create index idx_enrollment_activities_created_by on public.published_course_enrollment_activities (created_by);
create index idx_enrollment_activities_pricing_tier_id on public.published_course_enrollment_activities (pricing_tier_id);
create index idx_enrollment_activities_created_at on public.published_course_enrollment_activities (created_at);

-- ====================================================================================
-- Comments
-- ====================================================================================

comment on table public.published_course_enrollment_activities is
  'Records every access-granting activity (e.g., initial enrollment, renewal) tied to a published course enrollment. Includes pricing and access window snapshots.';

-- ====================================================================================
-- Row-Level Security Policies
-- ====================================================================================

alter table public.published_course_enrollment_activities enable row level security;

-- Policy: Allow users to view only their own enrollment activities
create policy "Authenticated users can read their enrollment activities"
on public.published_course_enrollment_activities
for select
to authenticated 
using (
  exists (
    select 1 from public.published_course_enrollments e
    where e.id = enrollment_id and e.user_id = auth.uid()
  )
);

-- Policy: Allow users to insert activities tied to their own enrollments
create policy "Authenticated users can insert their enrollment activities"
on public.published_course_enrollment_activities
for insert
to authenticated
with check (
  exists (
    select 1 from public.published_course_enrollments e
    where e.id = enrollment_id and e.user_id = auth.uid()
  )
);

-- Policy: Allow users to update only their own enrollment activities
create policy "Authenticated users can update their enrollment activities"
on public.published_course_enrollment_activities
for update
to authenticated
using (
  exists (
    select 1 from public.published_course_enrollments e
    where e.id = enrollment_id and e.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.published_course_enrollments e
    where e.id = enrollment_id and e.user_id = auth.uid()
  )
);
