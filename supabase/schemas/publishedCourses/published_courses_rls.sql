-- ====================================================================================
-- rls and privileges for: public.published_courses
-- ====================================================================================
-- this script configures row-level security (rls) and column-level privileges
-- for the `published_courses` table. it ensures appropriate access for:
--   - organization admins, owners, and editors
--   - users enrolled in a course
--   - public users (based on course visibility)
-- ====================================================================================

-- step 1: enable rls
alter table public.published_courses enable row level security;

-- ====================================================================================
-- step 2: column-level privileges
-- ====================================================================================
-- by default, supabase grants full select to "authenticated"
-- revoke that and grant access only to safe public columns

revoke select on public.published_courses from authenticated;
grant select (
  id,
  organization_id,
  category_id,
  subcategory_id,
  version,
  is_active,
  name,
  description,
  image_url,
  blur_hash,
  visibility,
  course_structure_overview,
  total_chapters,
  total_lessons,
  total_blocks,
  pricing_tiers,
  has_free_tier,
  min_price,
  published_at,
  published_by,
  total_enrollments,
  active_enrollments,
  completion_rate,
  average_rating,
  total_reviews,
  created_at,
  updated_at
) on public.published_courses to authenticated;

-- explicitly revoke access to sensitive content
revoke select (course_structure_content) on public.published_courses from authenticated;

-- allow anon limited access (for visibility = 'public')
grant select (
  id,
  organization_id,
  category_id,
  subcategory_id,
  version,
  is_active,
  name,
  description,
  image_url,
  blur_hash,
  visibility,
  course_structure_overview,
  total_chapters,
  total_lessons,
  total_blocks,
  pricing_tiers,
  has_free_tier,
  min_price,
  published_at,
  published_by,
  total_enrollments,
  active_enrollments,
  completion_rate,
  average_rating,
  total_reviews,
  created_at,
  updated_at
) on public.published_courses to anon;

-- ====================================================================================
-- step 3: select policies
-- ====================================================================================

-- drop older multiple select policies if they exist
drop policy if exists "select: enrolled users can view their courses" on public.published_courses;
drop policy if exists "select: org members can view all published courses" on public.published_courses;

-- combined select policy for authenticated users (org role OR enrolled)
create policy "select: allowed if enrolled or org member"
on public.published_courses
for select
to authenticated
using (
  public.get_user_org_role(organization_id, (select auth.uid())) is not null
  or exists (
    select 1
    from public.course_enrollments ce
    where ce.published_course_id = published_courses.id
      and ce.user_id = (select auth.uid())
      and ce.is_active = true
      and (ce.expires_at is null or ce.expires_at > now())
  )
);

-- allow anon users to view public courses
create policy "select: public can view public courses"
on public.published_courses
for select
to anon
using (
  visibility = 'public'
);

-- ====================================================================================
-- step 4: insert policy
-- ====================================================================================
-- allow course publishing by org owners, admins, and editors

create policy "insert: org members can publish courses"
on public.published_courses
for insert
with check (
  public.get_user_org_role(organization_id, (select auth.uid())) is not null
);

-- ====================================================================================
-- step 5: update policy
-- ====================================================================================
-- allow:
--   - org owners and admins to update any course
--   - editors to update only what they published

create policy "update: admins or publishing editors can update"
on public.published_courses
for update
using (
  public.get_user_org_role(organization_id, (select auth.uid())) in ('owner', 'admin')
  or (
    public.get_user_org_role(organization_id, (select auth.uid())) = 'editor'
    and published_by = (select auth.uid())
  )
);

-- ====================================================================================
-- step 6: delete policy
-- ====================================================================================
-- restrict deletion to org owners and admins only

create policy "delete: only owners/admins can delete published courses"
on public.published_courses
for delete
using (
  public.get_user_org_role(organization_id, (select auth.uid())) in ('owner', 'admin')
);
