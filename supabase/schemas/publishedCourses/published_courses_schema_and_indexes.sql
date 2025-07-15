-- ====================================================================================
-- TABLE: published_courses
-- Purpose:
--   Stores immutable snapshots of a course at the time of publication.
--   Useful for versioning, pricing history, and performance stats.
-- ====================================================================================
create table public.published_courses (
  -- Primary key (matches original course ID)
  id uuid primary key references public.courses(id) on delete cascade,

  -- Ownership and categorization
  organization_id uuid not null references public.organizations(id) on delete cascade,
  category_id uuid references public.course_categories(id) on delete set null,
  subcategory_id uuid references public.course_sub_categories(id) on delete set null,

  -- Versioning
  version integer not null default 1,
  is_active boolean not null default true,

  -- Snapshot of course metadata
  name text not null,
  description text not null,
  image_url text not null,
  blur_hash text,
  visibility course_access not null default 'public',

  -- Snapshot of full course structure (chapters, lessons, blocks)
  course_structure_overview jsonb not null,
  course_structure_content jsonb not null, 
  -- Derived structure metrics
  total_chapters integer not null check (total_chapters > 0),
  total_lessons integer not null check (total_lessons > 0),
  total_blocks integer not null check (total_blocks > 0),

  -- Snapshot of pricing tiers at publication
  pricing_tiers jsonb not null default '[]'::jsonb,

  -- Derived pricing data (denormalized externally)
  has_free_tier boolean,
  min_price numeric,

  -- Publication metadata
  published_at timestamptz not null default timezone('utc', now()),
  published_by uuid not null references public.profiles(id) on delete cascade,

  -- Public interaction stats (mutable)
  total_enrollments integer not null default 0,
  active_enrollments integer not null default 0,
  completion_rate numeric(5,2) default 0.00,
  average_rating numeric(3,2),
  total_reviews integer not null default 0,

  -- Audit timestamps
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  -- Constraints
  constraint chk_completion_rate check (completion_rate >= 0 and completion_rate <= 100),
  constraint chk_average_rating check (average_rating >= 1 and average_rating <= 5),
  constraint chk_version_positive check (version > 0),

  -- Enforce only one active version per course
  constraint uq_one_active_published_course unique (id, is_active) deferrable initially deferred
);

-- ====================================================================================
-- INDEXES: published_courses
-- Purpose:
--   Optimize lookup, filtering, sorting, and deep structure querying.
-- ====================================================================================

-- ----------------------------------------
-- 🔑 Foreign key indexes (join performance)
-- ----------------------------------------
create index idx_published_courses_org_id on public.published_courses(organization_id);
create index idx_published_courses_published_by on public.published_courses(published_by);
create index idx_published_courses_category_id on public.published_courses(category_id);
create index idx_published_courses_subcategory_id on public.published_courses(subcategory_id);

-- ----------------------------------------------------
-- 🔍 Common filters (used in dashboards and listings)
-- ----------------------------------------------------
create index idx_published_courses_is_active on public.published_courses(is_active) where is_active = true;
create index idx_published_courses_visibility on public.published_courses(visibility);
create index idx_published_courses_published_at on public.published_courses(published_at);

-- --------------------------------------------------------------------
-- 📦 Versioning and access (for latest version lookups, visibility)
-- --------------------------------------------------------------------
create index idx_published_courses_id_version on public.published_courses(id, version desc); -- latest version per course
create index idx_published_courses_org_active on public.published_courses(organization_id, is_active);

-- -------------------------------------------
-- 💵 Pricing-related (filtering/sorting tiers)
-- -------------------------------------------
create index idx_published_courses_has_free on public.published_courses(has_free_tier);
create index idx_published_courses_min_price on public.published_courses(min_price);

-- ---------------------------------------------------------------------
-- 🧱 Structure JSONB (efficient querying inside course_structure blobs)
-- ---------------------------------------------------------------------
create index idx_published_courses_structure_content_gin
  on public.published_courses
  using gin (course_structure_content jsonb_path_ops);

create index idx_published_courses_structure_overview_gin
  on public.published_courses
  using gin (course_structure_overview jsonb_path_ops);

-- ------------------------------------------------
-- 📈 Stats sorting (e.g. trending, top rated, etc.)
-- ------------------------------------------------
create index idx_published_courses_enrollments on public.published_courses(total_enrollments);
create index idx_published_courses_rating on public.published_courses(average_rating) where average_rating is not null;


-- ====================================================================================
-- FUNCTION: ensure_incremented_course_version
-- Purpose:
--   Automatically increments the version when a new publication is made
--   or if course content changes on update.
-- ====================================================================================
create or replace function public.ensure_incremented_course_version()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  latest_version int;
  content_changed boolean := false;
begin
  -- Get the current max version for this course
  select coalesce(max(version), 0)
  into latest_version
  from public.published_courses
  where id = NEW.id;

  if TG_OP = 'INSERT' then
    -- On insert, bump version if not explicitly set higher
    if NEW.version is null or NEW.version <= latest_version then
      NEW.version := latest_version + 1;
    end if;
    NEW.published_at := timezone('utc', now());

  elsif TG_OP = 'UPDATE' then
    -- Detect meaningful content changes
    content_changed := (
      NEW.name IS DISTINCT FROM OLD.name OR
      NEW.description IS DISTINCT FROM OLD.description OR
      NEW.image_url IS DISTINCT FROM OLD.image_url OR
      NEW.blur_hash IS DISTINCT FROM OLD.blur_hash OR
      NEW.visibility IS DISTINCT FROM OLD.visibility OR
      NEW.course_structure IS DISTINCT FROM OLD.course_structure OR
      NEW.pricing_tiers IS DISTINCT FROM OLD.pricing_tiers
    );

    -- If changed, bump version and update published_at
    if content_changed then
      NEW.version := greatest(OLD.version + 1, latest_version + 1);
      NEW.published_at := timezone('utc', now());
    else
      -- Otherwise, keep old version & published_at (only stats were updated)
      NEW.version := OLD.version;
      NEW.published_at := OLD.published_at;
    end if;
  end if;

  return NEW;
end;
$$;


-- Trigger: Set course version before INSERT
create trigger trg_set_published_course_version
  before insert on public.published_courses
  for each row
  execute function public.ensure_incremented_course_version();

-- Trigger: Conditionally bump version on UPDATE
create trigger trg_update_published_course_version
  before update on public.published_courses
  for each row
  execute function public.ensure_incremented_course_version();

-- Trigger: Auto-update updated_at timestamp
create trigger trg_published_courses_set_updated_at
  before update on public.published_courses
  for each row
  execute function public.update_updated_at_column();
