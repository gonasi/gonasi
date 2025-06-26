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

-- ===================================================
-- RLS POLICIES FOR: public.organization_members
-- ===================================================

alter table public.organization_members enable row level security;

-- Allow members to see other members in their organization
create policy "Members can view members of their organization"
  on public.organization_members
  for select
  to authenticated
  using (
    exists (
      select 1 from organization_members om
      where om.organization_id = organization_members.organization_id
        and om.user_id = auth.uid()
    )
  );

-- Allow role updates only by authorized admins
create policy "Admins can update roles within their organization"
  on public.organization_members
  for update
  to authenticated
  using (
    exists (
      select 1 from organization_members om
      where om.organization_id = organization_members.organization_id
        and om.user_id = auth.uid()
        and om.role in ('owner', 'admin')
    )
  )
  with check (true);

-- Allow owners and admins to add members
create policy "Owners and admins can add members"
  on public.organization_members
  for insert
  to authenticated
  with check (
    exists (
      select 1 from organization_members om
      where om.organization_id = organization_members.organization_id
        and om.user_id = auth.uid()
        and om.role in ('owner', 'admin')
    )
  );

-- Allow owners and admins to remove members
create policy "Owners and admins can delete members"
  on public.organization_members
  for delete
  to authenticated
  using (
    exists (
      select 1 from organization_members om
      where om.organization_id = organization_members.organization_id
        and om.user_id = auth.uid()
        and om.role in ('owner', 'admin')
    )
  );
