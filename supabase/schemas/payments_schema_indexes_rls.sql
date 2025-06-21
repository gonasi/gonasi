create table public.payments (
  id uuid primary key default uuid_generate_v4(),

  -- payer and context
  user_id uuid references profiles(id) on delete set null,       -- user may be deleted but payment retained
  enrollment_activity_id uuid references published_course_enrollment_activities(id) on delete set null,
  published_course_id uuid not null references published_courses(id) on delete set null,

  -- paystack transaction metadata
  provider text not null default 'paystack',
  provider_reference text unique not null,
  status text not null,                                          -- 'success', 'failed', etc.
  currency_code currency_code not null,

  -- payment amounts
  amount numeric(19, 4) not null,
  paid_at timestamptz not null default timezone('utc', now()),

  -- audit fields
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid references profiles(id) on delete set null     -- admin or user who initiated it
);
