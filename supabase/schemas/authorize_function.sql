-- Function: public.authorize(requested_permission app_permission)
-- Purpose: Determines if the current user has the required permission
-- based on the role stored in their JWT (JSON Web Token).
create or replace function public.authorize(
  requested_permission app_permission
)
returns boolean as $$
declare
  has_permission int;
  user_role public.app_role;
begin
  -- Extract the user's role from the JWT claims
  select (auth.jwt() ->> 'user_role')::public.app_role
    into user_role;

  -- Check if the role has the requested permission
  select count(*) into has_permission
  from public.role_permissions
  where role = user_role
    and permission = requested_permission;

  -- Return true if the permission is granted
  return has_permission > 0;
end;
$$ language plpgsql
stable
security definer
set search_path = '';  -- Prevents access to unintended schemas


-- Function: public.custom_access_token_hook(event jsonb)
-- Purpose: Adds the user's role to the JWT during authentication
-- This role is used for access control throughout the system.
create or replace function public.custom_access_token_hook(
  event jsonb
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''  -- Prevents function from referencing untrusted objects
as $$
declare
  claims jsonb;
  user_role public.app_role;
begin
  -- Look up user's role from the user_roles table
  select role into user_role
  from public.user_roles
  where user_id = (event->>'user_id')::uuid;

  -- Get current claims from the event
  claims := event->'claims';

  -- Inject user_role into claims (set to null if role is not found)
  if user_role is not null then
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  else
    claims := jsonb_set(claims, '{user_role}', 'null');
  end if;

  -- Return the modified JWT payload
  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;


-- Allow Supabase Auth Admin to access this schema
grant usage on schema public to supabase_auth_admin;

-- Allow Supabase Auth Admin to execute the JWT hook function
grant execute
  on function public.custom_access_token_hook
  to supabase_auth_admin;

-- Revoke public access to JWT hook function
revoke execute
  on function public.custom_access_token_hook
  from authenticated, anon, public;

-- Grant Supabase Auth Admin full access to user_roles table
grant all
  on table public.user_roles
  to supabase_auth_admin;

-- Revoke access to user_roles from general users
revoke all 
  on table public.user_roles
  from authenticated, anon, public;

-- Policy to allow Supabase Auth Admin to read user_roles (for JWT injection)
create policy "Allow auth admin to read user roles"
  on public.user_roles
  as permissive
  for select
  to supabase_auth_admin
  using (true);
