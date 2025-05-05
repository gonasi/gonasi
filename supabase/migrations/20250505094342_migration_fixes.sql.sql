create or replace view public.company_memberships
with (security_invoker = on) as
select 
  staff_id,  
  company_id, 
  staff_role
from public.staff_members;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

-- Create the auth hook function with a fixed search path
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path = 'public'
AS $$
DECLARE
  claims jsonb;
  user_role public.app_role;
BEGIN
  -- Fetch the user role in the user_roles table
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = (event->>'user_id')::uuid;

  claims := event->'claims';

  IF user_role IS NOT NULL THEN
    -- Set the claim
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  ELSE
    claims := jsonb_set(claims, '{user_role}', 'null');
  END IF;

  -- Update the 'claims' object in the original event
  event := jsonb_set(event, '{claims}', claims);

  -- Return the modified or original event
  RETURN event;
END;
$$;
