-- ============================================================================
-- FUNCTION: can_user_edit_course
-- DESCRIPTION:
--   Determines if the currently authenticated user has permission to edit
--   a specific course, based on their organization role, course editor assignment,
--   and the organization's subscription tier.
--
--   Editing rights are granted to:
--     1. Organization 'owner' or 'admin'
--     2. Assigned course editors (via course_editors table)
--
--   Restriction:
--     - If the organization's tier is 'temp', no editing is allowed for anyone.
--
-- PARAMETERS:
--   arg_course_id uuid – The ID of the course to check.
--
-- RETURNS:
--   boolean – TRUE if the user can edit the course; FALSE otherwise.
--
-- USAGE:
--   select public.can_user_edit_course('course-uuid-here');
--
-- SECURITY:
--   - SECURITY DEFINER: Ensures function runs with its own privileges.
--   - search_path set to '' to prevent privilege escalation via malicious objects.
-- ============================================================================
create or replace function public.can_user_edit_course(arg_course_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select coalesce(
    (
      -- Step 1: Fetch course and organization info
      with course_org as (
        select c.id as course_id, c.organization_id
        from public.courses c
        where c.id = arg_course_id
      )
      select
        -- Step 2: Check org subscription tier
        case
          -- If the org is in 'temp' tier, editing is disallowed
          when public.get_org_tier(co.organization_id) = 'temp' then false
          
          -- Step 3: Otherwise, check normal permissions
          else (
            -- User is an owner or admin in the organization
            public.get_user_org_role(co.organization_id, (select auth.uid())) in ('owner', 'admin')
            -- OR user is explicitly assigned as a course editor
            or exists (
              select 1
              from public.course_editors ce
              where ce.course_id = co.course_id
                and ce.user_id = (select auth.uid())
            )
          )
        end
      from course_org co
    ),
    -- Step 4: Default to false if course does not exist
    false
  )
$$;
