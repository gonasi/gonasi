-- ====================================================================================
-- RLS policies for: public.published_courses
-- ====================================================================================
-- This script configures optimized row-level security (RLS) for the `published_courses` table.
-- Goals:
--   ✅ Allow public users (anon) to view public courses.
--   ✅ Allow authenticated users to:
--      - View public courses
--      - View courses they’re enrolled in (and enrollment is active)
--      - View courses from their own organization
--   ✅ Allow insert by org editors/admins/owners.
--   ✅ Allow update:
--        - For owners/admins: any course in their org
--        - For editors: only the courses they published
--   ✅ Allow delete: only by org owners/admins
-- ====================================================================================

-- STEP 1: Enable Row-Level Security
alter table public.published_courses enable row level security;

-- ====================================================================================
-- STEP 2: SELECT policy (VIEWING courses)
-- ====================================================================================
-- This policy applies to both anon and authenticated users.
-- ✅ Public users (anon): can view courses with visibility = 'public'
-- ✅ Authenticated users: can view if:
--     - course is public
--     - OR they belong to the same organization
--     - OR they are actively enrolled in the course

create policy "select: public, enrolled, or org member"
on public.published_courses
for select
to public
using (
  visibility = 'public'

  or (
    (select auth.role()) = 'authenticated' and (
      -- Enrolled user
      exists (
        select 1
        from public.course_enrollments ce
        where ce.published_course_id = published_courses.id
          and ce.user_id = (select auth.uid())
          and ce.is_active = true
          and (ce.expires_at is null or ce.expires_at > now())
      )

      -- OR org member
      or public.get_user_org_role(organization_id, (select auth.uid())) is not null
    )
  )
);


-- ====================================================================================
-- STEP 3: INSERT policy (PUBLISHING courses)
-- ====================================================================================
-- ✅ Only users with a role in the organization can publish courses

create policy "insert: org members can publish"
on public.published_courses
for insert
to authenticated
with check (
  public.get_user_org_role(organization_id, (select auth.uid())) is not null
);

-- ====================================================================================
-- STEP 4: UPDATE policy (EDITING courses)
-- ====================================================================================
-- ✅ Owners/admins: can update any course in the org
-- ✅ Editors: can update only if they originally published the course

create policy "update: org admins or publishing editors"
on public.published_courses
for update
to authenticated
using (
  -- Org owners and admins can update any course in the org
  public.get_user_org_role(organization_id, (select auth.uid())) in ('owner', 'admin')

  -- Editors can only update what they published
  or (
    public.get_user_org_role(organization_id, (select auth.uid())) = 'editor'
    and published_by = (select auth.uid())
  )
);

-- ====================================================================================
-- STEP 5: DELETE policy (DELETING courses)
-- ====================================================================================
-- ✅ Only owners and admins can delete courses

create policy "delete: only org owners/admins"
on public.published_courses
for delete
to authenticated
using (
  public.get_user_org_role(organization_id, (select auth.uid())) in ('owner', 'admin')
);
