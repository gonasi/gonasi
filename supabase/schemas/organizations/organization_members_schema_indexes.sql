-- ================================================
-- ENUM TYPE: public.org_role
-- -----------------------------------------------
-- Defines the roles a user can have in an org
-- ================================================
create type public.org_role as enum (
  'owner',           -- Full access, can manage billing and transfer ownership
  'admin',           -- Manage members, courses, and settings (except owner actions)
  'editor'           -- Create and update courses/lessons
);

-- ================================================
-- TABLE: public.organization_members
-- -----------------------------------------------
-- Links users to organizations with a role
-- ================================================
create table public.organization_members (
  id uuid primary key default gen_random_uuid(),          -- Unique membership ID

  organization_id uuid not null                           -- Linked organization
    references public.organizations(id) on delete cascade,

  user_id uuid not null                                   -- Linked user (auth)
    references auth.users(id) on delete cascade,

  role public.org_role not null,                          -- Member role within org

  invited_by uuid                                         -- Who invited this user
    references auth.users(id),

  created_at timestamptz not null default timezone('utc', now()), -- Member added time
  updated_at timestamptz not null default timezone('utc', now()), -- Last updated time

  unique (organization_id, user_id)                       -- One membership per user/org
);

-- ================================================
-- FOREIGN KEY: user_id → profiles.id
-- -----------------------------------------------
-- Enables Supabase foreign key join in selects
-- ================================================
alter table public.organization_members
add constraint organization_members_user_id_fkey_profiles
foreign key (user_id)
references public.profiles(id)
on delete cascade;

-- ================================================
-- INDEXES: Foreign keys
-- ================================================
create index idx_organization_members_org_id on public.organization_members (organization_id);
create index idx_organization_members_user_id on public.organization_members (user_id);
create index idx_organization_members_invited_by on public.organization_members (invited_by);

-- ================================================
-- UNIQUE INDEX: One owner per organization
-- -----------------------------------------------
-- Ensures each org has only one owner
-- ================================================
create unique index one_owner_per_organization
on public.organization_members (organization_id)
where role = 'owner';
