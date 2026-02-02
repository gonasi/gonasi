-- ====================================================================================
-- TABLE: live_session_facilitators
-- Stores additional facilitators for a live session. Only organization members can be facilitators.
-- Similar to course_editors, this allows staff (editor role) to be assigned to specific sessions.
-- ====================================================================================
create table public.live_session_facilitators (
  id uuid primary key default uuid_generate_v4(),

  -- Session the facilitator belongs to
  live_session_id uuid not null
    references public.live_sessions(id) on delete cascade,

  -- Denormalized organization_id (must match the session's organization)
  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  -- Facilitator user
  user_id uuid not null
    references public.profiles(id) on delete cascade,

  -- Audit
  added_by uuid
    references public.profiles(id) on delete set null,

  added_at timestamptz not null default timezone('utc', now()),

  -- Prevent duplicate facilitators per session
  unique (live_session_id, user_id)
);

-- ====================================================================================
-- TRIGGER FUNCTION: ensure_facilitator_is_valid
-- Ensures:
--   1. live_session_id exists
--   2. organization_id matches session.organization_id
--   3. user is a member of that organization
-- ====================================================================================
create or replace function public.ensure_facilitator_is_valid()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  session_org uuid;
begin
  -- ✅ Fetch session organization_id (and confirm session exists)
  select ls.organization_id into session_org
  from public.live_sessions ls
  where ls.id = new.live_session_id;

  if session_org is null then
    raise exception
      'Invalid live_session_id: session % does not exist', new.live_session_id
      using errcode = 'P0001';
  end if;

  -- ✅ Ensure the facilitator's organization_id matches the session's org
  if new.organization_id <> session_org then
    raise exception
      'organization_id % does not match session''s organization_id % for session %',
      new.organization_id, session_org, new.live_session_id
      using errcode = 'P0001';
  end if;

  -- ✅ Ensure the user is a member of this organization
  if not exists (
    select 1
    from public.organization_members m
    where m.organization_id = session_org
      and m.user_id = new.user_id
  ) then
    raise exception
      'User % is not a member of organization % (session %)',
      new.user_id, session_org, new.live_session_id
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

-- ====================================================================================
-- TRIGGER
-- ====================================================================================
create trigger trg_ensure_facilitator_is_valid
before insert or update on public.live_session_facilitators
for each row
execute function public.ensure_facilitator_is_valid();

-- ====================================================================================
-- INDEXES
-- ====================================================================================
create index idx_live_session_facilitators_session_id
  on public.live_session_facilitators (live_session_id);

create index idx_live_session_facilitators_user_id
  on public.live_session_facilitators (user_id);

create index idx_live_session_facilitators_added_by
  on public.live_session_facilitators (added_by);

create index idx_live_session_facilitators_organization_id
  on public.live_session_facilitators (organization_id);

create index idx_live_session_facilitators_org_user
  on public.live_session_facilitators (organization_id, user_id);

create index idx_live_session_facilitators_session_user
  on public.live_session_facilitators (live_session_id, user_id);

-- ====================================================================================
-- COMMENTS
-- ====================================================================================
comment on table public.live_session_facilitators is 'Stores staff members assigned as facilitators for live sessions';
comment on column public.live_session_facilitators.live_session_id is 'The session this facilitator is assigned to';
comment on column public.live_session_facilitators.user_id is 'The user who is a facilitator for this session';
comment on column public.live_session_facilitators.added_by is 'The user who added this facilitator (admin/owner)';
