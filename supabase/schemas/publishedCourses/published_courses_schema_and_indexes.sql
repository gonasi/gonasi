-- ====================================================================================
-- TABLE: published_courses
-- Description:
--   Stores immutable snapshots of courses at the moment of publication.
--   Each row represents a specific published version of a course. This allows:
--     - learners to interact with stable course versions
--     - course editors to make changes to drafts without affecting live content
-- ====================================================================================

create table public.published_courses (
  -- Primary key also serves as the original course ID
  id uuid primary key references public.courses(id) on delete cascade, -- Matches course.id (shared ID)

  organization_id uuid not null references public.organizations(id) on delete cascade, -- Owning org

  -- Versioning
  version integer not null default 1,                   -- Incrementing publication version
  is_active boolean not null default true,              -- Whether this is the active version

  -- Course metadata snapshot (from the original course)
  name text not null,                                   -- Name at time of publication
  description text,                                     -- Description at time of publication
  image_url text,                                       -- Image URL at publication
  blur_hash text,                                       -- Blurhash of image
  visibility course_access not null default 'public',   -- Visibility at publication

  -- Immutable course structure snapshot
  course_structure jsonb not null,                      -- Full JSON course hierarchy (chapters, lessons, blocks)

  -- Pricing tiers snapshot
  pricing_tiers jsonb not null default '[]'::jsonb,     -- Immutable snapshot of pricing tiers

  -- Publication metadata
  published_at timestamptz not null default timezone('utc', now()), -- Time of publication
  published_by uuid not null references public.profiles(id) on delete cascade, -- Publisher

  -- Interaction stats (may be updated)
  total_enrollments integer not null default 0,
  active_enrollments integer not null default 0,
  completion_rate numeric(5,2) default 0.00,            -- Percent (0.00 - 100.00)
  average_rating numeric(3,2),                          -- Average user rating (1.00 - 5.00)
  total_reviews integer not null default 0,

  -- Audit
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  -- Constraints
  constraint chk_completion_rate check (completion_rate >= 0 and completion_rate <= 100),
  constraint chk_average_rating check (average_rating >= 1 and average_rating <= 5),
  constraint chk_version_positive check (version > 0),

  -- Ensure only one active published version per course
  constraint uq_one_active_published_course unique (id, is_active) deferrable initially deferred
);


-- Foreign key indexes
create index idx_published_courses_org_id on public.published_courses(organization_id);
create index idx_published_courses_published_by on public.published_courses(published_by);

-- Query optimization
create index idx_published_courses_is_active on public.published_courses(is_active) where is_active = true;
create index idx_published_courses_visibility on public.published_courses(visibility);
create index idx_published_courses_published_at on public.published_courses(published_at);
create index idx_published_courses_version on public.published_courses(id, version);

-- Statistics and analytics
create index idx_published_courses_enrollments on public.published_courses(total_enrollments);
create index idx_published_courses_rating on public.published_courses(average_rating) where average_rating is not null;

-- Composite access patterns
create index idx_published_courses_org_active on public.published_courses(organization_id, is_active);
create index idx_published_courses_id_version on public.published_courses(id, version desc);

-- JSONB indexes for course_structure
create index idx_published_courses_structure_gin on public.published_courses using gin(course_structure);
create index idx_published_courses_chapters on public.published_courses using gin((course_structure->'chapters'));
create index idx_published_courses_lessons on public.published_courses using gin((course_structure->'lessons'));


-- Function to auto-increment version number
create or replace function public.set_published_course_version()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if NEW.version is null or NEW.version = 0 then
    select coalesce(max(version), 0) + 1
    into NEW.version
    from public.published_courses
    where course_id = NEW.course_id;
  end if;
  return NEW;
end;
$$;

-- Trigger to set version number
create trigger trg_set_published_course_version
  before insert on public.published_courses
  for each row
  execute function public.set_published_course_version();

-- Auto-update updated_at timestamp
create or replace trigger trg_published_courses_set_updated_at
  before update on public.published_courses
  for each row
  execute function update_updated_at_column();