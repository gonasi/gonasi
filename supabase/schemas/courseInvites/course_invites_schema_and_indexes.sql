-- ===================================================
-- TABLE: course_invites
-- ===================================================
-- Purpose: Manage student invitations to courses
-- Pattern: Similar to organization_invites but for course enrollment
-- Business Rules:
--   - temp tier: Cannot send invites (can't create courses)
--   - launch tier: Can only send invites for PAID courses
--   - scale/impact tiers: Can send invites for both free and paid courses
--   - pricing_tier_id: Required when creating invites, nullable after tier deletion
--   - cohort_id: Optional when creating invites
-- ===================================================

create table if not exists public.course_invites (
  id uuid primary key default gen_random_uuid(),

  -- Course and organization context
  published_course_id uuid not null
    references public.published_courses(id) on delete cascade,
  organization_id uuid not null
    references public.organizations(id) on delete cascade,
  cohort_id uuid
    references public.cohorts(id) on delete set null,
  pricing_tier_id uuid
    references public.course_pricing_tiers(id) on delete set null,

  -- Invitee information
  email text not null,  -- No user_id until accepted

  -- Invite metadata
  invited_by uuid not null
    references auth.users(id),
  token text not null unique,  -- Secure token (rotate on resend)

  -- Email delivery tracking
  resend_count integer not null default 0,
  last_sent_at timestamptz not null default now(),
  delivery_status public.invite_delivery_status not null default 'pending',
  delivery_logs jsonb not null default '[]',

  -- Expiration and acceptance
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id),

  -- Revocation
  revoked_at timestamptz,

  -- Audit timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ===================================================
-- INDEXES
-- ===================================================

-- Foreign key indexes for joins
create index if not exists idx_course_invites_published_course_id
  on public.course_invites(published_course_id);
create index if not exists idx_course_invites_organization_id
  on public.course_invites(organization_id);
create index if not exists idx_course_invites_cohort_id
  on public.course_invites(cohort_id);
create index if not exists idx_course_invites_pricing_tier_id
  on public.course_invites(pricing_tier_id);
create index if not exists idx_course_invites_invited_by
  on public.course_invites(invited_by);
create index if not exists idx_course_invites_accepted_by
  on public.course_invites(accepted_by);

-- Lookup indexes
create index if not exists idx_course_invites_token
  on public.course_invites(token);
create index if not exists idx_course_invites_email
  on public.course_invites(email);
create index if not exists idx_course_invites_expires_at
  on public.course_invites(expires_at);

-- Composite indexes for common queries
create index if not exists idx_course_invites_course_cohort
  on public.course_invites(published_course_id, cohort_id);
create index if not exists idx_course_invites_org_course
  on public.course_invites(organization_id, published_course_id);

-- Only one pending invite per email per course
create unique index if not exists unique_pending_course_invite_per_user
  on public.course_invites(published_course_id, email)
  where accepted_at is null and revoked_at is null;

-- Trigger for updated_at
create trigger trg_course_invites_updated_at
  before update on public.course_invites
  for each row
  execute function public.update_updated_at_column();
