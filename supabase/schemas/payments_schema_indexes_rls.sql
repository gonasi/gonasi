create table public.payments (
  id uuid primary key default uuid_generate_v4(),

  -- payer and context
  user_id uuid,
  enrollment_activity_id uuid,
  published_course_id uuid not null,

  -- payment provider metadata
  provider text not null default 'paystack',
  provider_reference text not null,
  status text not null,
  currency_code currency_code not null,

  -- payment amounts
  amount numeric(19, 4) not null check (amount > 0),
  paid_at timestamptz not null default timezone('utc', now()),

  -- audit fields
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid,

  -- unique constraint
  unique (provider, provider_reference),

  -- ============================================================================
  -- FOREIGN KEY CONSTRAINTS
  -- ============================================================================

  foreign key (user_id) references public.profiles(id) on delete set null,
  foreign key (enrollment_activity_id) references public.published_course_enrollment_activities(id) on delete set null,
  foreign key (published_course_id) references public.published_courses(id) on delete restrict,
  foreign key (created_by) references public.profiles(id) on delete set null
);

-- User and course context
create index idx_payments_user_id on public.payments(user_id);
create index idx_payments_enrollment_activity_id on public.payments(enrollment_activity_id);
create index idx_payments_published_course_id on public.payments(published_course_id);

-- Provider and transaction metadata
create index idx_payments_provider on public.payments(provider);
create index idx_payments_status on public.payments(status);
create index idx_payments_paid_at on public.payments(paid_at);

-- Audit
create index idx_payments_created_by on public.payments(created_by);
create index idx_payments_created_at on public.payments(created_at);