-- ===================================================
-- TABLE: public.organization_students
-- ===================================================
-- Maps users to organizations in a "student" role.
-- Enables course enrollment scoping, onboarding metadata,
-- and auditing at the organization level.
-- Each user can be a student in multiple organizations.
-- ===================================================

create table public.organization_students (
  id uuid primary key default gen_random_uuid(), -- Unique record ID

  -- Foreign keys
  organization_id uuid not null references organizations(id) on delete cascade, -- Associated organization
  user_id uuid not null references auth.users(id) on delete cascade,            -- Student user account

  -- Audit & invitation metadata
  invited_by uuid references auth.users(id),            -- User who invited this student (nullable)
  created_at timestamptz not null default now(),        -- Timestamp when the record was created
  updated_at timestamptz not null default now(),        -- Timestamp when the record was last updated

  -- Constraints
  unique (organization_id, user_id)                     -- Prevent duplicate student entries per organization
);
