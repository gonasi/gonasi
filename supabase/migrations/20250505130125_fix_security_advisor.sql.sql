CREATE OR REPLACE FUNCTION public.accept_staff_invitation(
  p_user_id UUID,
  p_invite_id UUID,
  p_company_id UUID
) 
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, extensions  -- Adjust as needed for your environment
AS $$
DECLARE
  v_created_by UUID;
BEGIN
  -- Retrieve the invited_by (created_by) from the invite
  SELECT invited_by INTO v_created_by
  FROM staff_invites
  WHERE id = p_invite_id;

  -- Mark the invitation as confirmed
  UPDATE staff_invites
  SET 
    is_confirmed = true,
    confirmed_at = now(),
    staff_id = p_user_id
  WHERE id = p_invite_id;

  -- Add the user to staff_members table if not already present
  INSERT INTO staff_members (staff_id, company_id, staff_role, created_by)
  VALUES (p_user_id, p_company_id, 'user', v_created_by)
  ON CONFLICT (staff_id, company_id) DO NOTHING;

  -- Delete other pending invites for this user to this company
  DELETE FROM staff_invites
  WHERE 
    company_id = p_company_id AND 
    (staff_id = p_user_id OR invited_email IN (
      SELECT email FROM profiles WHERE id = p_user_id
    )) AND 
    id != p_invite_id AND
    is_confirmed = false;
END;
$$;


CREATE OR REPLACE FUNCTION public.delete_invite_on_member_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public  -- Set to specific schema(s) used in the function
AS $$
BEGIN
  -- Delete the invite corresponding to the deleted staff member from staff_invites
  DELETE FROM staff_invites
  WHERE staff_id = OLD.staff_id 
    AND company_id = OLD.company_id;

  -- Return the deleted row as required for DELETE triggers
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_companies(user_id uuid)
RETURNS SETOF uuid 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY 
  SELECT company_id 
  FROM public.staff_members 
  WHERE staff_id = user_id;
END;
$$;


CREATE OR REPLACE FUNCTION public.check_user_role(user_id uuid, allowed_roles text[])
RETURNS boolean 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.staff_members 
    WHERE staff_id = user_id 
    AND staff_role = ANY(allowed_roles)
  );
END;
$$;

