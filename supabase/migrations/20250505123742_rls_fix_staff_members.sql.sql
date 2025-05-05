-- Alternative solution that doesn't require dropping the view
-- First, temporarily disable RLS to break potential loops
ALTER TABLE public.staff_members DISABLE ROW LEVEL SECURITY;

-- Create helper functions to check permissions without triggering RLS
CREATE OR REPLACE FUNCTION public.get_user_companies(user_id uuid)
RETURNS SETOF uuid AS $$
BEGIN
  -- Direct query with security definer to bypass RLS
  RETURN QUERY SELECT company_id FROM public.staff_members WHERE staff_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_user_role(user_id uuid, allowed_roles text[])
RETURNS boolean AS $$
BEGIN
  -- Direct check with security definer to bypass RLS
  RETURN EXISTS (
    SELECT 1 FROM public.staff_members 
    WHERE staff_id = user_id 
    AND staff_role = ANY(allowed_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies
DROP POLICY IF EXISTS "allow company members to view all staff in their company" ON public.staff_members;
DROP POLICY IF EXISTS "allow su and admin to create staff members" ON public.staff_members;
DROP POLICY IF EXISTS "allow only su to update staff members" ON public.staff_members;
DROP POLICY IF EXISTS "allow only su to delete staff members except when company_id = staff_id" ON public.staff_members;

-- Create new policies that don't reference the problematic view
CREATE POLICY "allow company members to view all staff in their company"
ON public.staff_members
FOR SELECT
TO authenticated
USING (
  company_id IN (SELECT * FROM public.get_user_companies(auth.uid()))
);

CREATE POLICY "allow su and admin to create staff members"
ON public.staff_members
FOR INSERT
TO authenticated
WITH CHECK (
  public.check_user_role(auth.uid(), ARRAY['su', 'admin'])
);

CREATE POLICY "allow only su to update staff members"
ON public.staff_members
FOR UPDATE
TO authenticated
USING (
  public.check_user_role(auth.uid(), ARRAY['su'])
);

CREATE POLICY "allow only su to delete staff members except when company_id = staff_id"
ON public.staff_members
FOR DELETE
TO authenticated
USING (
  public.check_user_role(auth.uid(), ARRAY['su'])
  AND company_id <> staff_id
);

-- Re-enable RLS with the new policies
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;