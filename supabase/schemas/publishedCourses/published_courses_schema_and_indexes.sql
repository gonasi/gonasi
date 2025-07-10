-- ====================================================================================
-- PUBLISHED COURSES TABLE
-- ====================================================================================
-- Single table containing complete published course data as JSON
-- This serves as a materialized view of courses for customer interaction
-- Optimized for search, discovery, and fast retrieval

-- ====================================================================================
-- TYPE: published_course_status
-- ====================================================================================
create type public.published_course_status as enum ('active', 'archived', 'maintenance');

-- ====================================================================================
-- TABLE: published_courses
-- ====================================================================================
create table public.published_courses (
  id uuid primary key default uuid_generate_v4(),           -- unique published course ID
  
  -- references to original data
  original_course_id uuid not null,                         -- reference to source course
  organization_id uuid not null,                            -- owning organization
  
  -- course metadata for search and display
  name text not null,                                       -- course title
  description text,                                         -- course description
  image_url text,                                           -- course thumbnail
  blur_hash text,                                           -- image placeholder
  
  -- categorization (denormalized for search)
  category_id uuid,
  category_name text,
  subcategory_id uuid,
  subcategory_name text,
  
  -- search and discovery fields
  tags text[],                                              -- searchable tags array
  difficulty_level text,                                    -- beginner, intermediate, advanced
  estimated_duration_minutes integer,                       -- total course duration
  language text default 'en',                              -- course language
  
  -- pricing (denormalized for quick access)
  is_free boolean not null default false,
  price_tiers jsonb not null default '[]'::jsonb,          -- array of pricing options
  
  -- complete course structure as JSON
  course_data jsonb not null default '{}'::jsonb,          -- full course content
  
  -- publication metadata
  version integer not null default 1,                      -- version number
  status published_course_status not null default 'active',
  
  -- analytics/metrics (for search ranking)
  view_count integer not null default 0,
  enrollment_count integer not null default 0,
  rating_average decimal(3,2),                              -- average rating 0-5
  rating_count integer not null default 0,
  
  -- timestamps
  published_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz,                                   -- optional expiration
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  
  -- audit trail
  published_by uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  
  -- foreign key constraints
  foreign key (original_course_id) references public.courses(id) on delete cascade,
  foreign key (organization_id) references public.organizations(id) on delete cascade
);

-- ====================================================================================
-- UNIQUE CONSTRAINT FOR ACTIVE COURSES
-- ====================================================================================
-- Ensure only one active version per original course
-- Using partial unique index instead of exclusion constraint
create unique index idx_published_courses_unique_active 
on public.published_courses(original_course_id) 
where (status = 'active');

-- ====================================================================================
-- INDEXES FOR SEARCH AND PERFORMANCE
-- ====================================================================================

-- Basic lookup indexes
create index idx_published_courses_org_id on public.published_courses(organization_id);
create index idx_published_courses_original_id on public.published_courses(original_course_id);
create index idx_published_courses_status on public.published_courses(status);

-- Search and discovery indexes
create index idx_published_courses_category on public.published_courses(category_id) where status = 'active';
create index idx_published_courses_subcategory on public.published_courses(subcategory_id) where status = 'active';
create index idx_published_courses_difficulty on public.published_courses(difficulty_level) where status = 'active';
create index idx_published_courses_language on public.published_courses(language) where status = 'active';
create index idx_published_courses_free on public.published_courses(is_free) where status = 'active';

-- Full-text search index
create index idx_published_courses_search on public.published_courses 
using gin(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(category_name, '') || ' ' || coalesce(subcategory_name, '')))
where status = 'active';

-- Tags search index
create index idx_published_courses_tags on public.published_courses using gin(tags)
where status = 'active';

-- Ranking indexes (for popular/trending courses)
create index idx_published_courses_rating on public.published_courses(rating_average desc, rating_count desc) where status = 'active';
create index idx_published_courses_enrollment on public.published_courses(enrollment_count desc) where status = 'active';
create index idx_published_courses_published_at on public.published_courses(published_at desc) where status = 'active';

-- Duration-based search
create index idx_published_courses_duration on public.published_courses(estimated_duration_minutes) where status = 'active';

-- JSON indexes for course structure queries
create index idx_published_courses_chapters on public.published_courses 
using gin((course_data->'chapters')) where status = 'active';

-- Create index using the helper function (after function is created)
create index idx_published_courses_content_search 
on public.published_courses 
using gin (
  to_tsvector(
    'english',
    public.extract_course_content_text(course_data::jsonb)
  )
)
where status = 'active';

-- ====================================================================================
-- COMMENTS
-- ====================================================================================

comment on table public.published_courses is 
'Complete published course data optimized for customer discovery and interaction';

comment on column public.published_courses.course_data is 
'Complete course structure including chapters, lessons, blocks, and files as JSON';

comment on column public.published_courses.price_tiers is 
'Array of pricing options: [{"name": "Basic", "price": 99.00, "currency": "USD", "billing_period": "one-time"}]';

comment on column public.published_courses.tags is 
'Array of searchable tags for course discovery';

comment on column public.published_courses.version is 
'Incremental version number for each publication of the same course';

-- ====================================================================================
-- TRIGGERS
-- ====================================================================================

-- Auto-update updated_at timestamp
create trigger trg_published_courses_updated_at
before update on public.published_courses
for each row
execute function public.update_updated_at_column();

-- Auto-increment version on re-publication
create or replace function public.increment_published_course_version()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'INSERT' then
    -- Set version based on existing publications of the same course
    select coalesce(max(version), 0) + 1
    into new.version
    from public.published_courses
    where original_course_id = new.original_course_id;
  end if;
  return new;
end;
$$;

create trigger trg_published_courses_version
before insert on public.published_courses
for each row
execute function public.increment_published_course_version();