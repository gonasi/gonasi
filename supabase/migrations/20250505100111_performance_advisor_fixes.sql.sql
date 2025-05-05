-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.profiles;

-- Recreate SELECT policy using (SELECT auth.role())
CREATE POLICY "Authenticated users can read profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.role()) = 'authenticated');

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Recreate INSERT policy using (SELECT auth.uid())
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

-- Drop existing UPDATE policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Recreate UPDATE policy using (SELECT auth.uid())
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id);


-- Migration: Update RLS policies on public.user_active_companies to use SELECT-wrapped auth functions

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Allow user_active_companies insert access" ON public.user_active_companies;

-- Recreate INSERT policy using (SELECT auth.uid())
CREATE POLICY "Allow user_active_companies insert access"
  ON public.user_active_companies
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Drop existing UPDATE policy
DROP POLICY IF EXISTS "Allow user_active_companies update access" ON public.user_active_companies;

-- Recreate UPDATE policy using (SELECT auth.uid())
CREATE POLICY "Allow user_active_companies update access"
  ON public.user_active_companies
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Allow user_active_companies select access" ON public.user_active_companies;

-- Recreate SELECT policy using (SELECT auth.role())
CREATE POLICY "Allow user_active_companies select access"
  ON public.user_active_companies
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.role()) = 'authenticated');

-- Drop existing DELETE policy
DROP POLICY IF EXISTS "Allow user_active_companies delete access" ON public.user_active_companies;

-- Recreate DELETE policy using (SELECT auth.uid())
CREATE POLICY "Allow user_active_companies delete access"
  ON public.user_active_companies
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);


-- Migration: Update RLS policies on public.staff_members to use SELECT-wrapped auth functions

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "allow company members to view all staff in their company" ON public.staff_members;

-- Recreate SELECT policy using (SELECT auth.uid())
CREATE POLICY "allow company members to view all staff in their company"
  ON public.staff_members
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id
      FROM public.company_memberships
      WHERE staff_id = (SELECT auth.uid())
    )
  );

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "allow su and admin to create staff members" ON public.staff_members;

-- Recreate INSERT policy using (SELECT auth.uid())
CREATE POLICY "allow su and admin to create staff members"
  ON public.staff_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.company_memberships
      WHERE staff_id = (SELECT auth.uid())
        AND staff_role IN ('su', 'admin')
    )
  );

-- Drop existing UPDATE policy
DROP POLICY IF EXISTS "allow only su to update staff members" ON public.staff_members;

-- Recreate UPDATE policy using (SELECT auth.uid())
CREATE POLICY "allow only su to update staff members"
  ON public.staff_members
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.company_memberships
      WHERE staff_id = (SELECT auth.uid())
        AND staff_role = 'su'
    )
  );

-- Drop existing DELETE policy
DROP POLICY IF EXISTS "allow only su to delete staff members except when company_id = staff_id" ON public.staff_members;

-- Recreate DELETE policy using (SELECT auth.uid())
CREATE POLICY "allow only su to delete staff members except when company_id = staff_id"
  ON public.staff_members
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.company_memberships
      WHERE staff_id = (SELECT auth.uid())
        AND staff_role = 'su'
    )
    AND company_id <> staff_id
  );



-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Authenticated users can read course categories" ON public.course_categories;

-- Recreate SELECT policy using (SELECT auth.role())
CREATE POLICY "Authenticated users can read course categories"
  ON public.course_categories
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.role()) = 'authenticated');

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Authenticated users can read course sub-categories" ON public.course_sub_categories;

-- Recreate SELECT policy using (SELECT auth.role())
CREATE POLICY "Authenticated users can read course sub-categories"
  ON public.course_sub_categories
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.role()) = 'authenticated');


-- Create index for course_categories_created_by_fkey (on created_by column in course_categories table)
CREATE INDEX IF NOT EXISTS course_categories_created_by_idx ON public.course_categories(created_by);

-- Create index for course_categories_updated_by_fkey (on updated_by column in course_categories table)
CREATE INDEX IF NOT EXISTS course_categories_updated_by_idx ON public.course_categories(updated_by);

-- Create index for course_sub_categories_category_id_fkey (on category_id column in course_sub_categories table)
CREATE INDEX IF NOT EXISTS course_sub_categories_category_id_idx ON public.course_sub_categories(category_id);

-- Create index for course_sub_categories_created_by_fkey (on created_by column in course_sub_categories table)
CREATE INDEX IF NOT EXISTS course_sub_categories_created_by_idx ON public.course_sub_categories(created_by);

-- Create index for course_sub_categories_updated_by_fkey (on updated_by column in course_sub_categories table)
CREATE INDEX IF NOT EXISTS course_sub_categories_updated_by_idx ON public.course_sub_categories(updated_by);

-- Create index for staff_members_updated_by_fkey (on updated_by column in staff_members table)
CREATE INDEX IF NOT EXISTS staff_members_updated_by_idx ON public.staff_members(updated_by);

-- Drop unused index idx_staff_members_created_at if not being used
DROP INDEX IF EXISTS idx_staff_members_created_at;
