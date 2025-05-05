-- Migration: Optimize RLS policies by reducing per-row evaluation of auth.uid()

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "allow company members to view all staff in their company" ON public.staff_members;
DROP POLICY IF EXISTS "allow su and admin to create staff members" ON public.staff_members;
DROP POLICY IF EXISTS "allow only su to update staff members" ON public.staff_members;
DROP POLICY IF EXISTS "allow only su to delete staff members except when company_id = staff_id" ON public.staff_members;

-- Create optimized policies using (SELECT auth.uid())

CREATE POLICY "allow company members to view all staff in their company"
ON public.staff_members
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT * FROM public.get_user_companies((SELECT auth.uid()))
  )
);

CREATE POLICY "allow su and admin to create staff members"
ON public.staff_members
FOR INSERT
TO authenticated
WITH CHECK (
  public.check_user_role((SELECT auth.uid()), ARRAY['su', 'admin'])
);

CREATE POLICY "allow only su to update staff members"
ON public.staff_members
FOR UPDATE
TO authenticated
USING (
  public.check_user_role((SELECT auth.uid()), ARRAY['su'])
);

CREATE POLICY "allow only su to delete staff members except when company_id = staff_id"
ON public.staff_members
FOR DELETE
TO authenticated
USING (
  public.check_user_role((SELECT auth.uid()), ARRAY['su'])
  AND company_id <> staff_id
);

-- Ensure row-level security is enabled
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
