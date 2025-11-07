-- ====================================================================================
-- TABLE: courses
-- Stores course metadata, category hierarchy, organizational ownership,
-- access control settings, timestamps, and audit trail data.
-- ====================================================================================
create table public.courses (
  id uuid primary key default uuid_generate_v4(), -- Unique ID for each course

  -- =========================
  -- Foreign key relationships
  -- =========================
  category_id uuid
    references public.course_categories(id)
    on delete set null,                         -- Top-level category
  subcategory_id uuid
    references public.course_sub_categories(id)
    on delete set null,                         -- Subcategory within the category

  -- =========================
  -- Organizational ownership
  -- =========================
  organization_id uuid
    references public.organizations(id)
    on delete cascade,                          -- Organization that owns the course

  -- =========================
  -- Course metadata
  -- =========================
  name text not null,                           -- Display title of the course
  description text,                             -- Optional long-form description
  image_url text,                               -- Thumbnail or banner image URL
  blur_hash text,                               -- Hash used for low-res image placeholders

  -- =========================
  -- Access control
  -- =========================
  visibility course_access not null default 'public',
        -- Controls whether the course is public, private, unlisted, etc.

  -- =========================
  -- Timestamps
  -- =========================
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_published timestamptz,                   -- When course was last published

  -- =========================
  -- Audit trail
  -- =========================
  created_by uuid references public.profiles(id) on delete set null,
        -- User who created the course (nullable for system inserts)
  updated_by uuid references public.profiles(id) on delete set null,
        -- User who last updated the course

  -- =========================
  -- Constraints
  -- =========================
  unique (organization_id, name)                -- Enforce unique course names per org
);

-- ====================================================================================
-- TRIGGER FUNCTION: Validate subcategory-category relationship
-- Ensures that the selected subcategory belongs to the selected category.
-- Prevents mismatched category/subcategory assignments.
-- ====================================================================================
create or replace function public.validate_subcategory_belongs_to_category()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if NEW.category_id is not null
    and NEW.subcategory_id is not null then

    -- Check if the subcategory belongs to the declared category
    if not exists (
      select 1
      from public.course_sub_categories
      where id = NEW.subcategory_id
        and category_id = NEW.category_id
    ) then
      raise exception
        'Subcategory % does not belong to category %',
        NEW.subcategory_id,
        NEW.category_id;
    end if;

  end if;

  return NEW;
end;
$$;

-- ====================================================================================
-- TRIGGER: Enforce category-subcategory consistency
-- Fires BEFORE insert/update to validate hierarchical integrity.
-- ====================================================================================
create trigger trg_validate_subcategory
before insert or update on public.courses
for each row
execute function public.validate_subcategory_belongs_to_category();


-- ====================================================================================
-- INDEXES: Improve query performance and filtering across key columns
-- ====================================================================================
create index idx_courses_created_by      on public.courses (created_by);
create index idx_courses_updated_by      on public.courses (updated_by);
create index idx_courses_category_id     on public.courses (category_id);
create index idx_courses_subcategory_id  on public.courses (subcategory_id);
create index idx_courses_visibility      on public.courses (visibility);
create index idx_courses_organization_id on public.courses (organization_id);


-- ====================================================================================
-- COMMENTS: Human-readable documentation embedded into Postgres
-- ====================================================================================
comment on table public.courses
  is 'Stores metadata, ownership structure, visibility rules, timestamps, and audit details for each course.';

comment on column public.courses.organization_id
  is 'The organization that owns this course. Used for access control and billing context.';

comment on column public.courses.visibility
  is 'Access control level for the course: public, private, unlisted, or org-only depending on course_access enum.';

comment on column public.courses.blur_hash
  is 'Low-resolution hash for blurred image placeholders while loading thumbnails.';

comment on column public.courses.last_published
  is 'Timestamp of the most recent course publication event.';
