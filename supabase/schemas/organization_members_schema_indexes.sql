-- ===================================================
-- TYPE: public.org_role
-- ===================================================
-- Defines role types available within an organization
create type public.org_role as enum (
  'owner',           -- Full access, can manage billing and transfer ownership
  'admin',           -- Manage members, courses, and settings (except owner actions)
  'editor'           -- Create and update courses/lessons
);

-- ===================================================
-- TABLE: public.organization_members
-- ===================================================
-- Stores member assignments to organizations with roles and audit info
create table public.organization_members (
  id uuid primary key default gen_random_uuid(),          -- Unique membership ID

  organization_id uuid not null                           -- Linked organization
    references public.organizations(id) on delete cascade,

  user_id uuid not null                                   -- Linked user
    references auth.users(id) on delete cascade,

  role public.org_role not null,                          -- Member role within org

  invited_by uuid                                         -- Who invited this user
    references auth.users(id),

  created_at timestamptz not null default now(),          -- When member was added
  updated_at timestamptz not null default now(),          -- When member was last updated

  unique (organization_id, user_id)                       -- One membership per user/org
);

-- ===================================================
-- INDEXES: Foreign key indexes for efficient joins
-- ===================================================
create index on public.organization_members (organization_id);
create index on public.organization_members (user_id);
create index on public.organization_members (invited_by);

-- ===================================================
-- UNIQUE INDEX: One owner per organization
-- ===================================================
-- Ensures that each organization can only have one user
-- with the role 'owner' at any time.
create unique index one_owner_per_organization
on public.organization_members (organization_id)
where role = 'owner';
