-- ====================================================================================
-- TABLE: course_editors
-- Stores additional editors for a course. Only organization members can be editors.
-- ====================================================================================
create table public.course_editors (
  id uuid primary key default uuid_generate_v4(),

  -- Course the editor belongs to
  course_id uuid not null
    references public.courses(id) on delete cascade,

  -- The user who becomes an editor for the course
  user_id uuid not null
    references public.profiles(id) on delete cascade,

  -- Audit: who added this editor
  -- NOTE: must be nullable because FK uses ON DELETE SET NULL
  added_by uuid
    references public.profiles(id) on delete set null,

  added_at timestamptz not null default timezone('utc', now()),

  -- Prevent duplicate editor assignments
  unique (course_id, user_id)
);

-- ====================================================================================
-- TRIGGER FUNCTION: ensure_editor_is_org_member
-- Ensures the editor being added is a member of the organization that owns the course.
-- ====================================================================================

create or replace function public.ensure_editor_is_org_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.courses c
    join public.organization_members m
      on m.organization_id = c.organization_id
      and m.user_id = new.user_id
    where c.id = new.course_id
  ) then
    raise exception
      'User % is not a member of the organization that owns course %',
      new.user_id, new.course_id
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

-- ====================================================================================
-- TRIGGER: attach membership enforcement to insert/update
-- ====================================================================================

create trigger trg_ensure_editor_is_org_member
before insert or update on public.course_editors
for each row
execute function public.ensure_editor_is_org_member();

-- ====================================================================================
-- INDEXES
-- ====================================================================================

-- Index for course lookups
create index idx_course_editors_course_id 
  on public.course_editors (course_id);

-- Index for editor lookups
create index idx_course_editors_user_id
  on public.course_editors (user_id);

-- ✅ FIX: Add missing index for added_by foreign key
create index idx_course_editors_added_by
  on public.course_editors (added_by);
