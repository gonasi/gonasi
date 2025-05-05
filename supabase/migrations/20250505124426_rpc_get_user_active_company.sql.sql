-- Create an RPC function to fetch active company details in a single query
CREATE OR REPLACE FUNCTION public.get_user_active_company()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result jsonb;
BEGIN
    -- Get the authenticated user ID
    DECLARE
        auth_user_id uuid := auth.uid();
    BEGIN
        -- Execute a single query that joins all the required tables
        SELECT 
            jsonb_build_object(
                'id', uac.id,
                'user_id', uac.user_id,
                'company_id', uac.company_id,
                'staff_role', sm.staff_role,
                'profiles', jsonb_build_object(
                    'id', p.id,
                    'username', p.username,
                    'full_name', p.full_name,
                    'avatar_url', p.avatar_url
                )
            ) INTO result
        FROM 
            public.user_active_companies uac
        JOIN 
            public.staff_members sm ON sm.staff_id = uac.user_id AND sm.company_id = uac.company_id
        JOIN 
            public.profiles p ON p.id = uac.company_id
        WHERE 
            uac.user_id = auth_user_id;

        -- Return null if no record was found
        IF result IS NULL THEN
            RETURN NULL;
        END IF;

        RETURN result;
    END;
END;
$$;