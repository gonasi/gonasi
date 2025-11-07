-- ====================================================================================
-- TABLE: course_editors
-- Stores additional editors for a course. Only organization members can be editors.
-- ====================================================================================
create table public.course_editors (
  id uuid primary key default uuid_generate_v4(),

  -- Course the editor belongs to
  course_id uuid not null
    references public.courses(id) on delete cascade,

  -- Denormalized organization_id (must match the course's organization)
  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  -- Editor user
  user_id uuid not null
    references public.profiles(id) on delete cascade,

  -- Audit
  added_by uuid
    references public.profiles(id) on delete set null,

  added_at timestamptz not null default timezone('utc', now()),

  -- Prevent duplicate editors per course
  unique (course_id, user_id)
);

-- ====================================================================================
-- TRIGGER FUNCTION: ensure_editor_is_valid
-- Ensures:
--   1. course_id exists
--   2. organization_id matches course.organization_id
--   3. user is a member of that organization
-- ====================================================================================
create or replace function public.ensure_editor_is_valid()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  course_org uuid;
begin
  -- ✅ Fetch course organization_id (and confirm course exists)
  select c.organization_id into course_org
  from public.courses c
  where c.id = new.course_id;

  if course_org is null then
    raise exception
      'Invalid course_id: course % does not exist', new.course_id
      using errcode = 'P0001';
  end if;

  -- ✅ Ensure the editor's organization_id matches the course's org
  if new.organization_id <> course_org then
    raise exception
      'organization_id % does not match course''s organization_id % for course %',
      new.organization_id, course_org, new.course_id
      using errcode = 'P0001';
  end if;

  -- ✅ Ensure the user is a member of this organization
  if not exists (
    select 1
    from public.organization_members m
    where m.organization_id = course_org
      and m.user_id = new.user_id
  ) then
    raise exception
      'User % is not a member of organization % (course %)',
      new.user_id, course_org, new.course_id
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

-- ====================================================================================
-- TRIGGER
-- ====================================================================================
create trigger trg_ensure_editor_is_valid
before insert or update on public.course_editors
for each row
execute function public.ensure_editor_is_valid();

-- ====================================================================================
-- INDEXES
-- ====================================================================================
create index idx_course_editors_course_id 
  on public.course_editors (course_id);

create index idx_course_editors_user_id
  on public.course_editors (user_id);

create index idx_course_editors_added_by
  on public.course_editors (added_by);

create index idx_course_editors_organization_id
  on public.course_editors (organization_id);

create index idx_course_editors_org_user
  on public.course_editors (organization_id, user_id);

create index idx_course_editors_course_user
  on public.course_editors (course_id, user_id);
