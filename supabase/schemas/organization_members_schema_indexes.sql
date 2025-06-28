-- ===================================================
-- TYPE: public.org_role
-- ===================================================
-- Defines role types available within an organization.
-- Used for assigning permissions and scoping access to features,
-- dashboards, and content management functions.
-- ===================================================
create type org_role as enum (
  'owner',           -- Full access, can manage billing and transfer ownership
  'admin',           -- Manage members, courses, settings (except owner actions)
  'editor',          -- Manage courses and lessons platform-wide
  'instructor',      -- Manage assigned course content only
  'analyst',         -- Read-only access to analytics and reports
  'support',         -- Manage student interactions and course support
  'collaborator',    -- Scoped guest contributor for limited tasks
  'ai_collaborator'  -- AI assistant with restricted generation rights
);

-- ===================================================
-- TABLE: public.organization_members
-- ===================================================
-- Stores mapping of users to organizations with a defined role.
-- Supports permission scoping, onboarding metadata, and auditing.
-- Each user can belong to multiple organizations.
-- ===================================================
create table organization_members (
  id uuid primary key default gen_random_uuid(),

  -- Relationships
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role org_role not null,

  -- Invitation and audit
  invited_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Constraints
  unique (organization_id, user_id) -- One active role per user per org
);
