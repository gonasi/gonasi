create table public.course_enrollment_activities (
  id uuid primary key default uuid_generate_v4(),

  enrollment_id uuid not null references course_enrollments(id) on delete cascade,

  tier_name text,
  tier_description text,
  payment_frequency public.payment_frequency not null,
  currency_code public.currency_code not null,

  -- pricing details
  is_free boolean not null,
  price_paid numeric(19,4) not null default 0,
  promotional_price numeric(19,4),
  was_promotional boolean not null default false,

  -- access window
  access_start timestamptz not null,
  access_end timestamptz not null,

  -- audit fields
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid not null references profiles(id) on delete set null
);


-- ====================================================================================
-- Indexes
-- ====================================================================================

create index idx_enrollment_activities_enrollment_id on public.course_enrollment_activities (enrollment_id);
create index idx_enrollment_activities_access_window on public.course_enrollment_activities (access_start, access_end);
create index idx_enrollment_activities_created_by on public.course_enrollment_activities (created_by);
create index idx_enrollment_activities_created_at on public.course_enrollment_activities (created_at);
