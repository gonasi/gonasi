-- Defines the available permission types in the system.
-- These are tied to specific resource actions (insert, update, delete).
create type public.app_permission as enum (
  'course_categories.insert',
  'course_categories.update',
  'course_categories.delete',
  'course_sub_categories.insert',
  'course_sub_categories.update',
  'course_sub_categories.delete',
  'featured_courses_pricing.insert',
  'featured_courses_pricing.update',
  'featured_courses_pricing.delete',
  'lesson_types.insert',
  'lesson_types.update',
  'lesson_types.delete'
);

-- Defines the application-level roles that users can be assigned.
-- These determine access levels and capabilities.
create type public.app_role as enum (
  'go_su',     -- Superuser: full access across all resources.
  'go_admin',  -- Admin: high-level management access.
  'go_staff',  -- Staff: internal team with limited admin rights.
  'user'       -- Regular user: minimal permissions.
);

-- Stores the role(s) assigned to each user.
-- A user can hold multiple roles, but each role can only appear once per user.
create table public.user_roles (
  id        uuid primary key default uuid_generate_v4() not null,
  user_id   uuid not null references public.profiles on delete cascade,
  role      app_role not null,
  unique (user_id, role)
);
comment on table public.user_roles is 'Stores one or more application roles for each user.';

create index idx_user_roles_user_id on public.user_roles(user_id);

-- Enables RLS (Row-Level Security) on user_roles to restrict access to rows.
alter table public.user_roles enable row level security;

-- Maps a given role to specific permissions.
-- This determines what actions each role is authorized to perform.
create table public.role_permissions (
  id         uuid primary key default uuid_generate_v4() not null,
  role       app_role not null,
  permission app_permission not null,
  unique (role, permission)
);
comment on table public.role_permissions is 'Defines which permissions are granted to each application role.';

alter table public.role_permissions enable row level security;

-- Create a single comprehensive SELECT policy
create policy "role_permissions_select_policy" 
  on public.role_permissions
  as permissive for select
  to authenticated
  using (
    -- Allow system-wide read access for authorization functions
    true
    -- Alternative: If you want to restrict SELECT access, use this instead:
    -- exists (
    --   select 1 from public.user_roles ur 
    --   where ur.user_id = (select auth.uid()) 
    --   and ur.role in ('go_su', 'go_admin')
    -- )
  );

-- Create separate policies for INSERT, UPDATE, DELETE operations
create policy "role_permissions_insert_policy" 
  on public.role_permissions
  as permissive for insert
  to authenticated
  with check (
    exists (
      select 1 from public.user_roles ur 
      where ur.user_id = (select auth.uid())  
      and ur.role = 'go_su'
    )
  );

create policy "role_permissions_update_policy" 
  on public.role_permissions
  as permissive for update
  to authenticated
  using (
    exists (
      select 1 from public.user_roles ur 
      where ur.user_id = (select auth.uid()) 
      and ur.role = 'go_su'
    )
  )
  with check (
    exists (
      select 1 from public.user_roles ur 
      where ur.user_id = (select auth.uid())  
      and ur.role = 'go_su'
    )
  );

create policy "role_permissions_delete_policy" 
  on public.role_permissions
  as permissive for delete
  to authenticated
  using (
    exists (
      select 1 from public.user_roles ur 
      where ur.user_id = (select auth.uid()) 
      and ur.role = 'go_su'
    )
  );

-- Trigger function called automatically when a new user signs up.
-- Initializes profile, staff record, company link, and assigns default role.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Insert into profiles table with proper error handling
  begin
    insert into public.profiles (
      id, 
      username, 
      email, 
      full_name, 
      avatar_url,
      email_verified
    ) 
    values (
      new.id,
      new.raw_user_meta_data->>'username',
      new.email,
      coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
      new.raw_user_meta_data->>'avatar_url',
      (new.email_confirmed_at is not null)
    );
  exception
    when others then
      raise notice 'Error inserting profile for user %: %', new.id, sqlerrm;
      raise;  -- re-raise error to abort
  end;

  -- Assign roles based on email
  begin
    if new.email = 'gonasiapp@gmail.com' then
      insert into public.user_roles (user_id, role) values (new.id, 'go_su');
    elsif new.email ilike '%@gonasi.com' then
      insert into public.user_roles (user_id, role) values (new.id, 'go_staff');
    else
      insert into public.user_roles (user_id, role) values (new.id, 'user');
    end if;
  exception
    when others then
      raise notice 'Error inserting user role for user %: %', new.id, sqlerrm;
      raise;
  end;

  return null;  -- AFTER triggers return NULL
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_user();

comment on trigger on_auth_user_created on auth.users is 
  'Automatically creates profile and assigns role when a new user signs up via Supabase Auth';


-- Authorization function to determine if the current user has a specific permission.
-- Extracts the user's role from the JWT and checks role-permission mapping.
create or replace function public.authorize(
  requested_permission app_permission
)
returns boolean as $$
declare
  has_permission int;
  user_role public.app_role;
begin
  -- Retrieve user's role from JWT custom claim
  select (auth.jwt() ->> 'user_role')::public.app_role into user_role;

  -- Count matching role-permission entries
  select count(*) into has_permission
  from public.role_permissions
  where role = user_role
    and permission = requested_permission;

  -- Return true if at least one match found
  return has_permission > 0;
end;
$$ language plpgsql stable security definer set search_path = '';

-- Custom Supabase Auth hook to inject user role into JWT claims on sign-in.
-- This role is then used for access control decisions.
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''  -- Added security definer and secure search_path
as $$
declare
  claims jsonb;
  user_role public.app_role;
begin
  -- Look up the user's role from the database
  select role into user_role from public.user_roles
  where user_id = (event->>'user_id')::uuid;

  claims := event->'claims';

  -- Add the user_role claim (or null if no role is found)
  if user_role is not null then
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  else
    claims := jsonb_set(claims, '{user_role}', 'null');
  end if;

  -- Return updated JWT claims object
  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

-- Grants access to the Supabase Auth Admin system to manage JWT claims and roles
grant usage on schema public to supabase_auth_admin;

grant execute
  on function public.custom_access_token_hook
  to supabase_auth_admin;

revoke execute
  on function public.custom_access_token_hook
  from authenticated, anon, public;

grant all
  on table public.user_roles
  to supabase_auth_admin;

revoke all 
  on table public.user_roles
  from authenticated, anon, public;

-- Policy allowing Supabase Auth Admin to read user roles (used for JWT population)
create policy "Allow auth admin to read user roles" 
  on public.user_roles
  as permissive for select
  to supabase_auth_admin
  using (true);
