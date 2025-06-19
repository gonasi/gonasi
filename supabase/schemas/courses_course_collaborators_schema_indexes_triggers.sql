-- ====================================================================================
-- ENUM TYPE: course_role
-- Defines the role of a collaborator within a course
-- ====================================================================================
create type course_role as enum ('admin', 'editor', 'viewer');

-- ====================================================================================
-- TABLE: course_collaborators
-- Links users to courses with roles, manages invitations and acceptance status
-- ====================================================================================
create table course_collaborators (
  id uuid primary key default gen_random_uuid(),

  course_id uuid not null references courses(id) on delete cascade,
  user_id   uuid not null references profiles(id) on delete cascade,

  role course_role not null default 'viewer',

  created_by  uuid references profiles(id),
  invited_at  timestamptz not null default timezone('utc', now()),

  is_accepted boolean default false,
  accepted_at timestamptz,

  created_at  timestamptz not null default timezone('utc', now()),
  updated_at  timestamptz not null default timezone('utc', now()),

  unique (course_id, user_id)
);

-- ====================================================================================
-- INDEXES
-- ====================================================================================
create index idx_course_collaborators_course_id  on course_collaborators(course_id);
create index idx_course_collaborators_user_id    on course_collaborators(user_id);
create index idx_course_collaborators_created_by on course_collaborators(created_by);
create index idx_course_collaborators_is_accepted on course_collaborators(is_accepted);

-- ====================================================================================
-- COMMENTS
-- ====================================================================================
comment on table public.course_collaborators is
  'Links users to courses with specific roles. Handles invitations and acceptance status.';

-- ====================================================================================
-- TRIGGERS
-- Automatically updates updated_at on row update
-- ====================================================================================
create or replace trigger trg_course_collaborators_set_updated_at
before update on public.course_collaborators
for each row
execute function update_updated_at_column();

-- ====================================================================================
-- ROW LEVEL SECURITY
-- ====================================================================================
alter table public.course_collaborators enable row level security;

-- ====================================================================================
-- COMMIT TABLE CREATION BEFORE FUNCTIONS
-- ====================================================================================
-- If running in a transaction, commit here or run the functions separately

-- ====================================================================================
-- Functions: Role checks for accepted collaborators on a course
-- ====================================================================================
create or replace function is_course_admin(course_id uuid, user_id uuid) returns boolean
  language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.course_collaborators
    where public.course_collaborators.course_id = $1
      and public.course_collaborators.user_id = $2
      and public.course_collaborators.role = 'admin'
      and public.course_collaborators.is_accepted = true
  );
$$;

create or replace function is_course_editor(course_id uuid, user_id uuid) returns boolean
  language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.course_collaborators
    where public.course_collaborators.course_id = $1
      and public.course_collaborators.user_id = $2
      and public.course_collaborators.role = 'editor'
      and public.course_collaborators.is_accepted = true
  );
$$;

create or replace function is_course_viewer(course_id uuid, user_id uuid) returns boolean
  language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.course_collaborators
    where public.course_collaborators.course_id = $1
      and public.course_collaborators.user_id = $2
      and public.course_collaborators.role = 'viewer'
      and public.course_collaborators.is_accepted = true
  );
$$;

-- ====================================================================================
-- RLS POLICIES
-- ====================================================================================
create policy "RLS: Select if course admin or self"
on public.course_collaborators
for select
to authenticated
using (
  is_course_admin(course_id, (select auth.uid()))
  or user_id = (select auth.uid())
);

create policy "RLS: Insert if course admin or created_by self"
on public.course_collaborators
for insert
to authenticated
with check (
  is_course_admin(course_id, (select auth.uid()))
  or (select auth.uid()) = created_by
);

create policy "RLS: Update if course admin or created_by self"
on public.course_collaborators
for update
to authenticated
using ( 
  is_course_admin(course_id, (select auth.uid()))
  or (select auth.uid()) = created_by
)
with check (
  is_course_admin(course_id, (select auth.uid()))
  or (select auth.uid()) = created_by
);

create policy "RLS: Delete if course admin or self"
on public.course_collaborators
for delete
to authenticated
using (
  is_course_admin(course_id, (select auth.uid()))
  or user_id = (select auth.uid())
);