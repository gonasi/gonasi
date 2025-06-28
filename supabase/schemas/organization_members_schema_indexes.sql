-- ===================================================
-- TYPE: public.org_role
-- ===================================================
create type org_role as enum (
  'owner',
  'admin',
  'editor',
  'instructor',
  'analyst',
  'support',
  'collaborator',
  'ai_collaborator'
);

-- ===================================================
-- TABLE: public.organization_members
-- ===================================================
create table public.organization_members (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role org_role not null,

  invited_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (organization_id, user_id)
);

-- ✅ Indexes for foreign keys (covering indexes)
create index on public.organization_members (organization_id);
create index on public.organization_members (user_id);
create index on public.organization_members (invited_by);
