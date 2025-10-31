-- ====================================================================================
-- table: course_enrollments
-- description: records user enrollment in published courses, with expiration and completion metadata
-- ====================================================================================
create table public.course_enrollments (
  id uuid primary key default gen_random_uuid(),                   -- Unique enrollment ID

  user_id uuid not null,                                           -- FK: Enrolled user
  published_course_id uuid not null,                               -- FK: Published course
  organization_id uuid not null,                                   -- Redundant but useful for RLS and analytics

  enrolled_at timestamptz not null default timezone('utc', now()), -- Timestamp of initial enrollment (UTC)
  expires_at timestamptz,                                          -- Enrollment expiration (updated on renewal)
  completed_at timestamptz,                                        -- Timestamp when course was completed
  is_active boolean not null default true,                         -- Logical flag for active enrollment

  created_at timestamptz not null default timezone('utc', now()),  -- Record creation time (UTC)
  updated_at timestamptz not null default timezone('utc', now()),  -- Record creation time (UTC)

  -- Constraints
  constraint uq_user_course unique (user_id, published_course_id), -- Prevent duplicate enrollments per course

  -- Foreign key constraints
  foreign key (user_id) references public.profiles(id) on delete cascade,
  foreign key (published_course_id) references public.published_courses(id) on delete cascade,
  foreign key (organization_id) references public.organizations(id) on delete cascade
);

-- ====================================================================================
-- indexes
-- ====================================================================================

-- index foreign keys for faster joins and filtering
create index idx_course_enrollments_user_id on public.course_enrollments(user_id);
create index idx_course_enrollments_published_course_id on public.course_enrollments(published_course_id);
create index idx_course_enrollments_organization_id on public.course_enrollments(organization_id);

-- index date and status fields for efficient querying and reporting
create index idx_course_enrollments_enrolled_at on public.course_enrollments(enrolled_at);
create index idx_course_enrollments_expires_at on public.course_enrollments(expires_at);
create index idx_course_enrollments_completed_at on public.course_enrollments(completed_at);
create index idx_course_enrollments_is_active on public.course_enrollments(is_active);
