-- enum types
create type course_status as enum ('draft', 'published');
create type course_pricing as enum ('free', 'paid');
create type course_access as enum ('public', 'private');
create type course_approval_status as enum ('pending', 'approved', 'rejected');

-- courses table\
create table public.courses (
  id uuid default uuid_generate_v4() primary key,
  pathway_id uuid null references pathways(id) on delete set null,
  category_id uuid null references course_categories(id) on delete set null,
  subcategory_id uuid null references course_sub_categories(id) on delete set null,
  name text not null,
  description text null,
  image_url text null, -- url of the course image
  validation_complete boolean not null default false, -- if the course passed validation check

  -- pricing
  pricing_model course_pricing not null default 'free',
  monthly_subscription_price numeric(19,4) null, -- monthly subscription price for paid courses

  -- access control
  visibility course_access not null default 'private',

  -- approval status
  approval_status course_approval_status not null default 'pending',
  last_approved_by uuid null references profiles(id) on delete set null,
  last_rejected_by uuid null references profiles(id) on delete set null,
  last_approved_at timestamptz null,
  last_rejected_at timestamptz null,

  -- status & timestamps
  status course_status not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  -- relationships
  company_id uuid not null references profiles(id) on delete restrict,
  created_by uuid not null references profiles(id) on delete restrict,
  updated_by uuid not null references profiles(id) on delete restrict,
  approved_by uuid null references profiles(id) on delete restrict,

  -- constraints
  constraint check_paid_courses_subscription_price check (
    pricing_model = 'free' 
    or (pricing_model = 'paid' and monthly_subscription_price is not null and monthly_subscription_price > 0)
  ),
  
  constraint check_public_courses_need_approval check (
    visibility = 'private' or approval_status != 'pending'
  ),

  constraint check_approval_timestamps check (
    (approval_status = 'approved' and last_approved_at is not null and last_rejected_at is null)
    or (approval_status = 'rejected' and last_rejected_at is not null and last_approved_at is null)
    or (approval_status = 'pending' and last_approved_at is null and last_rejected_at is null)
  )
);

-- indexes
create index idx_courses_company_id on public.courses (company_id);
create index idx_courses_created_by on public.courses (created_by);
create index idx_courses_updated_by on public.courses (updated_by);
create index idx_courses_pathway_id on public.courses (pathway_id);
create index idx_courses_category_id on public.courses (category_id);
create index idx_courses_subcategory_id on public.courses (subcategory_id);
create index idx_courses_approval_status on public.courses (approval_status);
create index idx_courses_approved_by on public.courses (approved_by);
create index idx_courses_approved_at on public.courses (last_approved_at);
create index idx_courses_rejected_at on public.courses (last_rejected_at);
create index idx_courses_visibility on public.courses (visibility);
create index idx_courses_status on public.courses (status);

-- comments
comment on table public.courses is 'table containing all courses';
comment on column public.courses.image_url is 'url of the course image';
comment on column public.courses.monthly_subscription_price is 'monthly subscription price for the course, with accurate currency precision';

-- function to update the updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

-- trigger to update the updated_at column before any update
create trigger set_updated_at
before update on public.courses
for each row
execute function update_updated_at_column();

-- assigned courses to members
create table public.assigned_courses_to_members (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references public.staff_members(id) on delete cascade,
  assigned_by uuid null references public.staff_members(id) on delete set null,
  assigned_at timestamptz not null default timezone('utc', now())::timestamptz,
  constraint unique_course_user unique (course_id, user_id)
);

-- Add separate indexes for `course_id` and `user_id` for performance
create index idx_assigned_courses_to_members_course_id on public.assigned_courses_to_members(course_id);
create index idx_assigned_courses_to_members_user_id on public.assigned_courses_to_members(user_id);

-- enable row-level security
alter table public.courses enable row level security;
alter table public.assigned_courses_to_members enable row level security;

-- RLS POLICIES
-- policies for access control

-- Superusers (su) and admins can select all courses in their company.
-- Signed-in users can view all published public courses that have passed validation.
-- Users can also view published courses assigned to them.

create policy "allow admin and su, others on public, published, or assigned courses"
on public.courses
for select
using (
  -- Allow access if the user is an admin or superuser in the same company
  company_id in (
    select company_id 
    from public.company_memberships
    where staff_id = auth.uid()
    and staff_role in ('su', 'admin')
  )

  -- Allow access to courses that are public, published, and validated
  or (validation_complete = true and status = 'published' and visibility = 'public')

  -- Allow access to published and validated courses assigned to the user
  or (
    validation_complete = true 
    and status = 'published'
    and exists (
      select 1 
      from public.assigned_courses_to_members 
      where course_id = public.courses.id 
      and user_id = auth.uid()
    )
  )
);

-- Allow only superusers (su) and admins to add (insert) courses.
create policy "allow su and admin to add courses"
on public.courses
for insert
with check (
  -- Check if the user exists in the company_memberships table 
  -- and has a role of either 'su' (superuser) or 'admin'.
  exists (
    select 1 
    from public.company_memberships 
    where staff_id = auth.uid() 
    and staff_role in ('su', 'admin')
  )
);

-- Allow only superusers (su) and admins to update courses.
create policy "allow su and admin to update courses"
on public.courses
for update
using (
  -- Check if the user exists in the company_memberships table 
  -- and has a role of either 'su' (superuser) or 'admin'.
  exists (
    select 1 
    from public.company_memberships 
    where staff_id = auth.uid() 
    and staff_role in ('su', 'admin')
  )
);

-- Allow only superusers (su) and admins to delete courses.  
-- A course can only be deleted if it has no assigned members.
create policy "allow su and admin to delete"
on public.courses
for delete
using (
  -- Check if the user exists in the company_memberships table 
  -- and has a role of either 'su' (superuser) or 'admin'.
  exists (
    select 1 
    from public.company_memberships 
    where staff_id = auth.uid() 
    and staff_role in ('su', 'admin')
  )
  -- Ensure the course has no assigned members before allowing deletion.
  and not exists (
    select 1 
    from public.assigned_courses_to_members 
    where course_id = public.courses.id
  )
);


-- Policy to allow members to view only the courses assigned to them
create policy "allow members to view assigned courses"
on public.assigned_courses_to_members
for select
using (
  user_id = auth.uid()  -- Only allow access if the user is the assigned member
);

-- Policy to allow superusers (su) and admins to assign courses to members
create policy "allow su and admin to assign courses"
on public.assigned_courses_to_members
for insert
with check (
  exists (
    select 1 
    from public.company_memberships 
    where staff_id = auth.uid() 
    and staff_role in ('su', 'admin')  -- Only allow users with 'su' or 'admin' roles to assign courses
  )
);

-- Policy to allow superusers (su) and admins to remove course assignments
create policy "allow su and admin to remove assignments"
on public.assigned_courses_to_members
for delete
using (
  exists (
    select 1 
    from public.company_memberships 
    where staff_id = auth.uid() 
    and staff_role in ('su', 'admin')  -- Only allow users with 'su' or 'admin' roles to remove assignments
  )
);

-- Policy to prevent updates to assignments (assignments should be removed and re-added if needed)
create policy "prevent updates to assigned courses"
on public.assigned_courses_to_members
for update
using (false);  -- Disallow any updates to the assignments


-- Insert the courses bucket into the storage.buckets table
insert into storage.buckets (id, name) values ('courses', 'courses');

---------------------------------------------------------------------------------------
-- BUCKET POLICIES ---
---------------------------------------------------------------------------------------

-- Create storage policy allowing anyone to read public course files
create policy "allow anyone to read public course files"
on storage.objects
for select
using (
  bucket_id = 'courses'
  and (
    -- Public, published, and validated courses
    exists (
      select 1
      from public.courses
      where 
        storage.objects.name like (id || '/%')
        and validation_complete = true 
        and status = 'published' 
        and visibility = 'public'
    )
    
    -- Files from courses assigned to user
    or exists (
      select 1
      from public.courses c
      join public.assigned_courses_to_members a on c.id = a.course_id
      where 
        storage.objects.name like (c.id || '/%')
        and c.validation_complete = true 
        and c.status = 'published'
        and a.user_id = auth.uid()
    )
    
    -- User is an admin or superuser in the same company
    or exists (
      select 1
      from public.courses c
      join public.company_memberships m on c.company_id = m.company_id
      where 
        storage.objects.name like (c.id || '/%')
        and m.staff_id = auth.uid()
        and m.staff_role in ('su', 'admin')
    )
  )
);

-- Allow only su and admin to insert files
create policy "allow su and admin to insert files"
on storage.objects
for insert
with check (
  bucket_id = 'courses'
  and exists (
    select 1 
    from public.company_memberships 
    where staff_id = auth.uid() 
    and staff_role in ('su', 'admin')
  )
);

-- Allow only su and admin to update files
create policy "allow su and admin to update files"
on storage.objects
for update
using (
  bucket_id = 'courses'
  and exists (
    select 1 
    from public.company_memberships 
    where staff_id = auth.uid() 
    and staff_role in ('su', 'admin')
  )
);

-- Allow only su and admin to delete files and only if the course has no assigned members
create policy "allow su and admin to delete files"
on storage.objects
for delete
using (
  bucket_id = 'courses'
  and exists (
    select 1 
    from public.company_memberships 
    where staff_id = auth.uid() 
    and staff_role in ('su', 'admin')
  )
  and (
    -- Check if file belongs to a course with no assigned members
    exists (
      select 1
      from public.courses c
      where 
        storage.objects.name like (c.id || '/%')
        and not exists (
          select 1 
          from public.assigned_courses_to_members 
          where course_id = c.id
        )
    )
  )
);