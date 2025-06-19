-- ====================================================================================
-- defines course access levels
-- ====================================================================================
create type course_access as enum ('public', 'private');

-- ====================================================================================
-- TRIGGER FUNCTION TO CHECK SUBCATEGORY BELONGS TO CATEGORY
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
-- courses table
-- ====================================================================================
create table public.courses (
  id uuid default uuid_generate_v4() primary key,

  -- foreign key references
  pathway_id uuid null references pathways(id) on delete set null,
  category_id uuid null references course_categories(id) on delete set null,
  subcategory_id uuid null references course_sub_categories(id) on delete set null,

  -- course metadata
  name text not null,
  description text null,
  image_url text null,         -- thumbnail image URL for the course
  blur_hash text null,         -- image blur hash for placeholder rendering

  -- access control
  visibility course_access not null default 'public', -- course visibility level

  -- timestamps
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_published timestamptz null, -- last time the course was published

  -- ownership tracking
  created_by uuid not null references profiles(id) on delete cascade,
  updated_by uuid not null references profiles(id) on delete cascade
);

-- ====================================================================================
-- trigger to validate subcategory-category relationship
-- ====================================================================================
create trigger trg_validate_subcategory
before insert or update on public.courses
for each row
execute function public.validate_subcategory_belongs_to_category();

-- ====================================================================================
-- comments for documentation
-- ====================================================================================
comment on table public.courses is 'Stores metadata, ownership, and structure details for each course.';
comment on column public.courses.image_url is 'Thumbnail image URL for the course.';

-- ====================================================================================
-- indexes for query optimization
-- ====================================================================================
create index idx_courses_created_by on public.courses (created_by);
create index idx_courses_updated_by on public.courses (updated_by);
create index idx_courses_pathway_id on public.courses (pathway_id);
create index idx_courses_category_id on public.courses (category_id);
create index idx_courses_subcategory_id on public.courses (subcategory_id);
create index idx_courses_visibility on public.courses (visibility);
