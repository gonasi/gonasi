-- ====================================================================================
-- TYPE: course_access (defines course visibility options)
-- ====================================================================================
create type public.course_access as enum ('public', 'private');

-- ====================================================================================
-- TABLE: courses
-- Stores course metadata, category structure, ownership (org/user), access control,
-- audit trail, and organizational constraints.
-- ====================================================================================
create table public.courses (
  id uuid primary key default uuid_generate_v4(), -- Unique ID for each course

  -- =========================
  -- Foreign key relationships
  -- =========================
  category_id uuid references public.course_categories(id) on delete set null,
  subcategory_id uuid references public.course_sub_categories(id) on delete set null,

  -- =========================
  -- Ownership
  -- =========================
  organization_id uuid references public.organizations(id) on delete cascade, -- Owning organization (if applicable)
  owned_by uuid null references public.profiles(id) on delete set null,        -- Owning user (can be null if removed)

  -- Must have at least one owner (organization or user)
  constraint chk_course_owner check (
    organization_id is not null or owned_by is not null
  ),

  -- =========================
  -- Course metadata
  -- =========================
  name text not null,                          -- Display title of the course
  description text,                            -- Optional detailed description
  image_url text,                              -- Thumbnail image URL
  blur_hash text,                              -- Placeholder hash for progressive image loading

  -- =========================
  -- Access control
  -- =========================
  visibility course_access not null default 'public', -- Publicly visible or private

  -- =========================
  -- Timestamps
  -- =========================
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_published timestamptz,                 -- Last time the course was published

  -- =========================
  -- Audit trail
  -- =========================
  created_by uuid null references public.profiles(id) on delete set null,
  updated_by uuid null references public.profiles(id) on delete set null,

  -- =========================
  -- Constraints
  -- =========================
  unique (organization_id, name) -- Optional: enforce unique course name within org
);

-- ====================================================================================
-- TRIGGER FUNCTION: Validates that subcategory belongs to selected category
-- ====================================================================================
create or replace function public.validate_subcategory_belongs_to_category()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if NEW.category_id is not null and NEW.subcategory_id is not null then
    if not exists (
      select 1
      from public.course_sub_categories
      where id = NEW.subcategory_id
        and category_id = NEW.category_id
    ) then
      raise exception 'Subcategory % does not belong to category %', NEW.subcategory_id, NEW.category_id;
    end if;
  end if;
  return NEW;
end;
$$;

-- ====================================================================================
-- TRIGGER: Enforces subcategory-category relationship integrity
-- ====================================================================================
create trigger trg_validate_subcategory
before insert or update on public.courses
for each row
execute function public.validate_subcategory_belongs_to_category();

-- ====================================================================================
-- TRIGGER FUNCTION: Validates that owned_by user is part of organization (if both set)
-- ====================================================================================
create or replace function public.validate_course_owner_in_org()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if NEW.organization_id is not null and NEW.owned_by is not null then
    if not exists (
      select 1
      from public.organization_members
      where organization_id = NEW.organization_id
        and user_id = NEW.owned_by
    ) then
      raise exception 'User % must be a member of organization %', NEW.owned_by, NEW.organization_id;
    end if;
  end if;
  return NEW;
end;
$$;


-- ====================================================================================
-- TRIGGER: Enforces owned_by ∈ organization_id if both are present
-- ====================================================================================
create trigger trg_validate_course_owner
before insert or update on public.courses
for each row
execute function public.validate_course_owner_in_org();

-- ====================================================================================
-- INDEXES: For performance optimization
-- ====================================================================================
create index idx_courses_created_by on public.courses (created_by);
create index idx_courses_updated_by on public.courses (updated_by);
create index idx_courses_category_id on public.courses (category_id);
create index idx_courses_subcategory_id on public.courses (subcategory_id);
create index idx_courses_visibility on public.courses (visibility);
create index idx_courses_organization_id on public.courses (organization_id);
create index idx_courses_owned_by on public.courses (owned_by);

-- ====================================================================================
-- COMMENTS: Documentation for table and important columns
-- ====================================================================================
comment on table public.courses is 'Stores metadata, ownership, visibility, and structure details for each course.';
comment on column public.courses.organization_id is 'The organization this course belongs to, if any.';
comment on column public.courses.owned_by is 'The profile (user) who owns this course, if any. Must belong to org if organization_id is set.';
comment on column public.courses.visibility is 'Controls whether a course is publicly visible or private.';
comment on column public.courses.blur_hash is 'Low-res image hash used for placeholder rendering.';
comment on column public.courses.last_published is 'Timestamp of the last time this course was published.';
