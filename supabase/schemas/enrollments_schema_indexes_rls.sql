create table public.published_course_enrollments (
  id uuid primary key default uuid_generate_v4(),

  user_id uuid not null references profiles(id) on delete cascade,
  published_course_id uuid not null references published_courses(id) on delete cascade,

  -- access state
  enrolled_at timestamptz default timezone('utc', now()) not null,       -- timestamp of first enrollment
  expires_at timestamptz not null,                                       -- timestamp when access expires
  is_active boolean not null default true,                               -- if false, enrollment is considered inactive (soft delete)

  constraint uq_user_course unique (user_id, published_course_id)
);

-- ====================================================================================
-- indexes
-- ====================================================================================

create index idx_enrollments_user_id on public.published_course_enrollments (user_id);
create index idx_enrollments_course_id on public.published_course_enrollments (published_course_id);
create index idx_enrollments_is_active on public.published_course_enrollments (is_active);
create index idx_enrollments_expires_at on public.published_course_enrollments (expires_at);

-- ====================================================================================
-- comments
-- ====================================================================================

comment on table public.published_course_enrollments is 'tracks enrollment of users in published courses, including access status and expiry';

-- ====================================================================================
-- row-level security policies
-- ====================================================================================

alter table public.published_course_enrollments enable row level security;

-- Allow users to read only their own enrollments or those they have a course role in
create policy "select: users with course roles (admin/editor/viewer) or owners"
on public.published_course_enrollments
for select
to authenticated
using (
  -- cache auth.uid() to avoid per-row evaluation
  user_id = (select auth.uid())

  -- OR the user has a role on the corresponding course
  OR exists (
    select 1
    from public.courses c
    where c.id = published_course_enrollments.published_course_id
      and (
        is_course_admin(c.id, (select auth.uid())) OR
        is_course_editor(c.id, (select auth.uid())) OR
        is_course_viewer(c.id, (select auth.uid())) OR
        c.created_by = (select auth.uid())
      )
  )
);

-- Allow users to insert their own enrollments
create policy "Allow authenticated users to insert their enrollments"
on public.published_course_enrollments
for insert
to authenticated
with check (user_id = (select auth.uid())); 

-- Allow users to update their own enrollments
create policy "Allow authenticated users to update their enrollments"
on public.published_course_enrollments
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
