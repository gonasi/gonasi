create table public.course_enrollment_activities (
  id uuid primary key default uuid_generate_v4(),

  enrollment_id uuid not null references course_enrollments(id) on delete cascade, -- parent enrollment record

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

create index idx_enrollment_activities_enrollment_id on public.course_enrollment_activities (enrollment_id);
create index idx_enrollment_activities_access_window on public.course_enrollment_activities (access_start, access_end);
create index idx_enrollment_activities_created_by on public.course_enrollment_activities (created_by);
create index idx_enrollment_activities_pricing_tier_id on public.course_enrollment_activities (pricing_tier_id);
create index idx_enrollment_activities_created_at on public.course_enrollment_activities (created_at);
