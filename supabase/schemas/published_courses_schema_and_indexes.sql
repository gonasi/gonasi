-- ====================================================================================
-- TABLE: published_courses (immutable snapshots of published course versions)
-- ====================================================================================

create table public.published_courses (
    -- same as the course_id; reused to indicate the published version of a specific course
    id uuid primary key,                     -- same as course_id

    -- timestamp when this version was published
    published_at timestamptz not null default now(),

    -- version number of the published course
    version integer not null default 1,

    -- course metadata
    name text not null,
    description text,
    image_url text,
    blur_hash text,

    -- category references for discovery
    course_category_id uuid not null,        -- main category id
    course_sub_category_id uuid not null,    -- subcategory id

    -- denormalized metadata for display
    course_categories jsonb,                 -- array of { id, name, slug, icon }
    course_sub_categories jsonb,             -- same structure

    -- optional learning pathway reference
    pathway_id uuid not null,
    pathways jsonb,                          -- array of { id, name, slug }

    -- pricing plans or tiers at the time of publishing
    pricing_data jsonb,

    chapters_count integer not null default 0,
    lessons_count integer not null default 0,

    -- course structure at the time of publishing
    course_chapters jsonb,                   -- chapters with nested lessons
    lessons_with_blocks jsonb,               -- optional: full lessons with content blocks

    -- audit metadata
    created_by uuid not null,                -- user who created the snapshot
    updated_by uuid not null,                -- user who last updated the snapshot
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),

    -- foreign key constraints enforcing relational integrity
    foreign key (id) references public.courses(id) on delete cascade,
    foreign key (course_category_id) references public.course_categories(id) on delete restrict,
    foreign key (course_sub_category_id) references public.course_sub_categories(id) on delete restrict,
    foreign key (pathway_id) references public.pathways(id) on delete restrict,
    foreign key (created_by) references public.profiles(id) on delete restrict,
    foreign key (updated_by) references public.profiles(id) on delete restrict
);

-- ====================================================================================
-- INDEXES: for performance on foreign keys and common queries
-- ====================================================================================

-- Course identity and publish time
create index idx_published_courses_id on public.published_courses(id);
create index idx_published_courses_published_at on public.published_courses(published_at);

-- Category filters
create index idx_published_courses_category_id on public.published_courses(course_category_id);
create index idx_published_courses_course_sub_category_id on public.published_courses(course_sub_category_id);

-- Pathway filter
create index idx_published_courses_pathway_id on public.published_courses(pathway_id);

-- Audit filter indexes
create index idx_published_courses_created_by on public.published_courses(created_by);
create index idx_published_courses_updated_by on public.published_courses(updated_by);

-- Indexes for JSONB fields (GIN for fast key/element access)
create index idx_published_courses_categories_jsonb on public.published_courses using gin(course_categories);
create index idx_published_courses_sub_categories_jsonb on public.published_courses using gin(course_sub_categories);
