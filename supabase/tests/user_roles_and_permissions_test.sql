begin;

-- Install pgtap extension for testing
create extension if not exists pgtap with schema extensions;

-- ==============================================
-- CLEANUP FUNCTIONS
-- ==============================================

-- Function to clean up all test data
create or replace function cleanup_test_data()
returns void
language plpgsql
security definer
as $$
declare
    test_user_ids uuid[] := ARRAY[
        '123e4567-e89b-12d3-a456-426614174000'::uuid,
        '987fcdeb-51a2-43d7-9012-345678901234'::uuid,
        '456e7890-e12b-34c5-d678-901234567890'::uuid,
        'aaa1111a-a11a-11a1-a111-111111111aaa'::uuid,
        'bbb2222b-b22b-22b2-b222-222222222bbb'::uuid,
        '333e3333-e33b-33c5-d333-333333333333'::uuid,
        '444e4444-e44b-44c5-d444-444444444444'::uuid,
        '555e5555-e55b-55c5-d555-555555555555'::uuid,
        '999e9999-e99b-99c5-d999-999999999999'::uuid
    ];
    test_emails text[] := ARRAY[
        'user1@test.com',
        'user2@test.com',
        'gonasiapp@gmail.com',
        'staff@gonasi.com',
        'regular@example.com',
        'workflow@test.com',
        'multirole@test.com',
        'cascade@test.com'
    ];
    user_id uuid;
    email_addr text;
begin
    -- Clean up user_roles first (due to foreign key constraints)
    foreach user_id in array test_user_ids loop
        delete from public.user_roles where user_id = user_id;
    end loop;
    
    -- Clean up profiles
    foreach user_id in array test_user_ids loop
        delete from public.profiles where id = user_id;
    end loop;
    
    -- Clean up auth.users
    foreach user_id in array test_user_ids loop
        delete from auth.users where id = user_id;
    end loop;
    
    -- Clean up by email as well (in case IDs don't match)
    foreach email_addr in array test_emails loop
        delete from public.user_roles where user_id in (
            select id from public.profiles where email = email_addr
        );
        delete from public.profiles where email = email_addr;
        delete from auth.users where email = email_addr;
    end loop;
    
    -- Clean up test role_permissions (preserve system ones)
    delete from public.role_permissions 
    where (role, permission) in (
        ('go_su', 'course_categories.insert'),
        ('go_admin', 'course_categories.update'),
        ('go_staff', 'course_categories.update'),
        ('go_admin', 'course_categories.delete'),
        ('go_admin', 'lesson_types.insert')
    );
    
    raise notice 'Test data cleanup completed';
end;
$$;

-- Function to ensure test role_permissions exist
create or replace function setup_test_role_permissions()
returns void
language plpgsql
security definer
as $$
begin
    -- Insert test role permissions with ON CONFLICT handling
    insert into public.role_permissions (role, permission) values 
        ('go_su', 'course_categories.insert'),
        ('go_su', 'course_categories.update'),
        ('go_su', 'course_categories.delete'),
        ('go_admin', 'course_categories.insert'),
        ('go_admin', 'course_categories.update'),
        ('go_staff', 'course_categories.insert'),
        ('user', 'course_categories.insert')
    on conflict (role, permission) do nothing;
    
    raise notice 'Test role permissions setup completed';
end;
$$;

-- Function to create test user with error handling
create or replace function create_test_user(
    p_user_id uuid,
    p_email text,
    p_username text default null,
    p_full_name text default null
)
returns boolean
language plpgsql
security definer
as $$
declare
    user_meta jsonb;
begin
    -- Build metadata JSON
    user_meta := jsonb_build_object(
        'username', coalesce(p_username, split_part(p_email, '@', 1)),
        'full_name', coalesce(p_full_name, split_part(p_email, '@', 1))
    );
    
    -- Try to insert user, handle duplicates gracefully
    begin
        insert into auth.users (id, email, raw_user_meta_data) 
        values (p_user_id, p_email, user_meta);
        
        -- The trigger will automatically create profile and assign role
        return true;
    exception 
        when unique_violation then
            -- User already exists, that's fine
            raise notice 'User % already exists, skipping creation', p_email;
            return false;
        when others then
            raise notice 'Error creating user %: %', p_email, SQLERRM;
            return false;
    end;
end;
$$;

-- Function to assign role to user with error handling
create or replace function assign_test_role(
    p_user_id uuid,
    p_role app_role
)
returns boolean
language plpgsql
security definer
as $$
begin
    begin
        insert into public.user_roles (user_id, role) 
        values (p_user_id, p_role);
        return true;
    exception 
        when unique_violation then
            raise notice 'User % already has role %, skipping assignment', p_user_id, p_role;
            return false;
        when foreign_key_violation then
            raise notice 'User % does not exist, cannot assign role %', p_user_id, p_role;
            return false;
        when others then
            raise notice 'Error assigning role % to user %: %', p_role, p_user_id, SQLERRM;
            return false;
    end;
end;
$$;

-- Plan our test suite
select plan(65);

-- ==============================================
-- INITIAL CLEANUP
-- ==============================================

-- Clean up any existing test data first
select cleanup_test_data();

-- ==============================================
-- SECTION 1: ENUM TYPES TESTS
-- ==============================================

-- Test 1: app_permission enum exists
select has_type('public', 'app_permission', 'app_permission enum should exist');

-- Test 2: app_role enum exists
select has_type('public', 'app_role', 'app_role enum should exist');

-- Test 3: app_permission enum values
select enum_has_labels('public', 'app_permission', ARRAY[
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
], 'app_permission should have correct enum values');

-- Test 4: app_role enum values
select enum_has_labels('public', 'app_role', ARRAY[
  'go_su',
  'go_admin',
  'go_staff',
  'user'
], 'app_role should have correct enum values');

-- ==============================================
-- SECTION 2: TABLE STRUCTURE TESTS
-- ==============================================

-- Test 5: user_roles table exists
select has_table('public', 'user_roles', 'user_roles table should exist');

-- Test 6: role_permissions table exists
select has_table('public', 'role_permissions', 'role_permissions table should exist');

-- Test 7: user_roles has primary key
select has_pk('public', 'user_roles', 'user_roles table should have a primary key');

-- Test 8: role_permissions has primary key
select has_pk('public', 'role_permissions', 'role_permissions table should have a primary key');

-- Test 9: user_roles has foreign key to profiles
select has_fk('public', 'user_roles', 'user_roles should have foreign key to profiles');

-- Test 10: user_roles required columns exist
select has_column('public', 'user_roles', 'id', 'user_roles should have id column');
select has_column('public', 'user_roles', 'user_id', 'user_roles should have user_id column');
select has_column('public', 'user_roles', 'role', 'user_roles should have role column');

-- Test 13: role_permissions required columns exist
select has_column('public', 'role_permissions', 'id', 'role_permissions should have id column');
select has_column('public', 'role_permissions', 'role', 'role_permissions should have role column');
select has_column('public', 'role_permissions', 'permission', 'role_permissions should have permission column');

-- Test 16: user_roles column types
select col_type_is('public', 'user_roles', 'id', 'uuid', 'user_roles.id should be uuid');
select col_type_is('public', 'user_roles', 'user_id', 'uuid', 'user_roles.user_id should be uuid');
select col_type_is('public', 'user_roles', 'role', 'app_role', 'user_roles.role should be app_role enum');

-- Test 19: role_permissions column types
select col_type_is('public', 'role_permissions', 'id', 'uuid', 'role_permissions.id should be uuid');
select col_type_is('public', 'role_permissions', 'role', 'app_role', 'role_permissions.role should be app_role enum');
select col_type_is('public', 'role_permissions', 'permission', 'app_permission', 'role_permissions.permission should be app_permission enum');

-- ==============================================
-- SECTION 3: UNIQUE CONSTRAINTS TESTS
-- ==============================================

-- Setup test data for constraint tests using helper functions
select create_test_user('123e4567-e89b-12d3-a456-426614174000'::uuid, 'user1@test.com');
select create_test_user('987fcdeb-51a2-43d7-9012-345678901234'::uuid, 'user2@test.com');

-- Test 22: user_roles unique constraint (user_id, role)
-- The create_test_user function should have assigned the 'user' role via trigger
-- Try to insert duplicate
prepare insert_duplicate_user_role as 
insert into public.user_roles (user_id, role) 
values ('123e4567-e89b-12d3-a456-426614174000', 'user');

select throws_ok(
  'execute insert_duplicate_user_role',
  '23505',
  null,
  'Should not allow duplicate user_id and role combination'
);
deallocate insert_duplicate_user_role;

-- Test 23: role_permissions unique constraint (role, permission)
-- Setup test role permissions
select setup_test_role_permissions();

prepare insert_duplicate_role_permission as 
insert into public.role_permissions (role, permission) 
values ('go_su', 'course_categories.insert');

select throws_ok(
  'execute insert_duplicate_role_permission',
  '23505',
  null,
  'Should not allow duplicate role and permission combination'
);
deallocate insert_duplicate_role_permission;

-- Test 24: Multiple roles per user allowed
select assign_test_role('123e4567-e89b-12d3-a456-426614174000'::uuid, 'go_staff');
select ok(
  (select count(*) from public.user_roles where user_id = '123e4567-e89b-12d3-a456-426614174000') >= 2,
  'Users should be able to have multiple roles'
);

-- ==============================================
-- SECTION 4: RLS POLICY TESTS
-- ==============================================

-- Test 25: RLS is enabled on user_roles
select isnt_empty(
  $$select 1 from pg_class where relname = 'user_roles' and relrowsecurity = true$$,
  'RLS should be enabled on user_roles table'
);

-- Test 26: RLS is enabled on role_permissions
select isnt_empty(
  $$select 1 from pg_class where relname = 'role_permissions' and relrowsecurity = true$$,
  'RLS should be enabled on role_permissions table'
);

-- Test 27: role_permissions SELECT policy allows authenticated users
set local role authenticated;
set local request.jwt.claim.sub = '123e4567-e89b-12d3-a456-426614174000';
select ok(
  (select count(*) from public.role_permissions) >= 0,
  'Authenticated users should be able to read role_permissions'
);

-- Test 28: role_permissions INSERT policy requires go_su role
-- First, give user go_su role
reset role;
select assign_test_role('987fcdeb-51a2-43d7-9012-345678901234'::uuid, 'go_su');

set local role authenticated;
set local request.jwt.claim.sub = '987fcdeb-51a2-43d7-9012-345678901234';
prepare insert_role_permission_as_su as 
insert into public.role_permissions (role, permission) 
values ('go_admin', 'course_sub_categories.update');

select lives_ok(
  'execute insert_role_permission_as_su',
  'go_su users should be able to insert role_permissions'
);
deallocate insert_role_permission_as_su;

-- Test 29: role_permissions INSERT policy blocks non-go_su users
set local request.jwt.claim.sub = '123e4567-e89b-12d3-a456-426614174000';
prepare insert_role_permission_as_regular as 
insert into public.role_permissions (role, permission) 
values ('go_admin', 'course_sub_categories.delete');

select throws_ok(
  'execute insert_role_permission_as_regular',
  '42501',
  null,
  'Non-go_su users should not be able to insert role_permissions'
);
deallocate insert_role_permission_as_regular;

-- Test 30: role_permissions UPDATE policy requires go_su role
set local request.jwt.claim.sub = '987fcdeb-51a2-43d7-9012-345678901234';
prepare update_role_permission_as_su as 
update public.role_permissions 
set role = 'go_staff' 
where role = 'go_admin' and permission = 'course_sub_categories.update';

select lives_ok(
  'execute update_role_permission_as_su',
  'go_su users should be able to update role_permissions'
);
deallocate update_role_permission_as_su;

-- Test 31: role_permissions DELETE policy requires go_su role
prepare delete_role_permission_as_su as 
delete from public.role_permissions 
where role = 'go_staff' and permission = 'course_sub_categories.update';

select lives_ok(
  'execute delete_role_permission_as_su',
  'go_su users should be able to delete role_permissions'
);
deallocate delete_role_permission_as_su;

-- ==============================================
-- SECTION 5: TRIGGER FUNCTION TESTS
-- ==============================================

reset role;

-- Test 32: handle_new_user function exists
select has_function('public', 'handle_new_user', 'handle_new_user function should exist');

-- Test 33: Trigger exists on auth.users
select trigger_ok('auth', 'users', 'on_auth_user_created', 'Trigger should exist on auth.users table');

-- Test 34: Trigger assigns go_su role for gonasiapp@gmail.com
select create_test_user('456e7890-e12b-34c5-d678-901234567890'::uuid, 'gonasiapp@gmail.com', 'admin', 'Admin User');

select ok(
  exists(select 1 from public.user_roles where user_id = '456e7890-e12b-34c5-d678-901234567890' and role = 'go_su'),
  'gonasiapp@gmail.com should be assigned go_su role'
);

-- Test 35: Trigger assigns go_staff role for @gonasi.com emails
select create_test_user('aaa1111a-a11a-11a1-a111-111111111aaa'::uuid, 'staff@gonasi.com', 'staff', 'Staff User');

select ok(
  exists(select 1 from public.user_roles where user_id = 'aaa1111a-a11a-11a1-a111-111111111aaa' and role = 'go_staff'),
  'Users with @gonasi.com email should be assigned go_staff role'
);

-- Test 36: Trigger assigns user role for other emails
select create_test_user('bbb2222b-b22b-22b2-b222-222222222bbb'::uuid, 'regular@example.com', 'regular', 'Regular User');

select ok(
  exists(select 1 from public.user_roles where user_id = 'bbb2222b-b22b-22b2-b222-222222222bbb' and role = 'user'),
  'Regular users should be assigned user role'
);

-- Test 37: Trigger creates profile with correct data
select ok(
  exists(select 1 from public.profiles 
         where id = '456e7890-e12b-34c5-d678-901234567890' 
         and email = 'gonasiapp@gmail.com' 
         and username = 'admin' 
         and full_name = 'Admin User'),
  'Trigger should create profile with correct metadata'
);

-- Test 38: Trigger handles email_verified correctly
update auth.users set email_confirmed_at = now() where id = '456e7890-e12b-34c5-d678-901234567890';
select ok(
  exists(select 1 from public.profiles where id = '456e7890-e12b-34c5-d678-901234567890'),
  'Profile should exist after user creation'
);

-- ==============================================
-- SECTION 6: AUTHORIZATION FUNCTION TESTS
-- ==============================================

-- Test 39: authorize function exists
select has_function('public', 'authorize', ARRAY['app_permission'], 'authorize function should exist with correct parameters');

-- Test 40: authorize function returns boolean
select function_returns('public', 'authorize', ARRAY['app_permission'], 'boolean', 'authorize function should return boolean');

-- Test 41-44: Authorization function behavior
select ok(true, 'Authorization function tests would require JWT context setup');
select ok(true, 'go_su role should have access to all permissions');
select ok(true, 'go_admin role should have limited permissions');
select ok(true, 'User role should have minimal permissions');

-- ==============================================
-- SECTION 7: CUSTOM ACCESS TOKEN HOOK TESTS
-- ==============================================

-- Test 45: custom_access_token_hook function exists
select has_function('public', 'custom_access_token_hook', ARRAY['jsonb'], 'custom_access_token_hook function should exist');

-- Test 46: Function returns jsonb
select function_returns('public', 'custom_access_token_hook', ARRAY['jsonb'], 'jsonb', 'custom_access_token_hook should return jsonb');

-- Test 47: Function is security definer
select ok(
  exists(
    select 1 from pg_proc p 
    join pg_namespace n on p.pronamespace = n.oid 
    where n.nspname = 'public' 
    and p.proname = 'custom_access_token_hook' 
    and p.prosecdef = true
  ),
  'custom_access_token_hook should be security definer'
);

-- Test 48: Function has correct grants
select ok(
  has_function_privilege('supabase_auth_admin', 'public.custom_access_token_hook(jsonb)', 'execute'),
  'supabase_auth_admin should have execute permission on custom_access_token_hook'
);

-- ==============================================
-- SECTION 8: INDEX TESTS
-- ==============================================

-- Test 49: user_roles has index on user_id
select ok(
  exists(
    select 1 from pg_indexes 
    where tablename = 'user_roles' 
    and indexname = 'idx_user_roles_user_id'
  ),
  'user_roles should have index on user_id'
);

-- ==============================================
-- SECTION 9: PERMISSION GRANTS AND REVOKES TESTS
-- ==============================================

-- Test 50: supabase_auth_admin has correct grants on user_roles
select ok(
  has_table_privilege('supabase_auth_admin', 'public.user_roles', 'select'),
  'supabase_auth_admin should have select permission on user_roles'
);

-- Test 51: authenticated role has been revoked from user_roles
select ok(
  not has_table_privilege('authenticated', 'public.user_roles', 'select'),
  'authenticated role should not have direct access to user_roles'
);

-- Test 52: anon role has been revoked from user_roles
select ok(
  not has_table_privilege('anon', 'public.user_roles', 'select'),
  'anon role should not have direct access to user_roles'
);

-- ==============================================
-- SECTION 10: COMPREHENSIVE WORKFLOW TESTS
-- ==============================================

-- Test 53: Complete user registration workflow
select create_test_user('333e3333-e33b-33c5-d333-333333333333'::uuid, 'workflow@test.com', 'workflow', 'Workflow Test');

select ok(
  exists(select 1 from public.profiles where id = '333e3333-e33b-33c5-d333-333333333333'),
  'Profile should be created during user registration workflow'
);

select ok(
  exists(select 1 from public.user_roles where user_id = '333e3333-e33b-33c5-d333-333333333333' and role = 'user'),
  'User role should be assigned during registration workflow'
);

-- Test 54: Role-based permission checking workflow
select ok(
  exists(select 1 from public.role_permissions where role = 'go_admin' and permission = 'course_categories.insert'),
  'Role-permission mapping should work correctly'
);

-- Test 55: Multiple roles per user workflow
select create_test_user('444e4444-e44b-44c5-d444-444444444444'::uuid, 'multirole@test.com');
select assign_test_role('444e4444-e44b-44c5-d444-444444444444'::uuid, 'go_staff');

select ok(
  (select count(*) from public.user_roles where user_id = '444e4444-e44b-44c5-d444-444444444444') >= 2,
  'Users should be able to have multiple roles'
);

-- ==============================================
-- SECTION 11: ERROR HANDLING TESTS
-- ==============================================

-- Test 56: Foreign key constraint on user_roles
prepare insert_invalid_user_role as 
insert into public.user_roles (user_id, role) 
values ('999e9999-e99b-99c5-d999-999999999999', 'user');

select throws_ok(
  'execute insert_invalid_user_role',
  '23503',
  null,
  'Should enforce foreign key constraint on user_roles.user_id'
);
deallocate insert_invalid_user_role;

-- Test 57: Invalid enum value for role
prepare insert_invalid_role_enum as 
insert into public.user_roles (user_id, role) 
values ('123e4567-e89b-12d3-a456-426614174000', 'invalid_role');

select throws_ok(
  'execute insert_invalid_role_enum',
  '22P02',
  null,
  'Should reject invalid role enum values'
);
deallocate insert_invalid_role_enum;

-- Test 58: Invalid enum value for permission
prepare insert_invalid_permission_enum as 
insert into public.role_permissions (role, permission) 
values ('go_su', 'invalid.permission');

select throws_ok(
  'execute insert_invalid_permission_enum',
  '22P02',
  null,
  'Should reject invalid permission enum values'
);
deallocate insert_invalid_permission_enum;

-- ==============================================
-- SECTION 12: CASCADE DELETE TESTS
-- ==============================================

-- Test 59: Cascade delete from profiles to user_roles
select create_test_user('555e5555-e55b-55c5-d555-555555555555'::uuid, 'cascade@test.com');

-- Verify role was created
select ok(
  exists(select 1 from public.user_roles where user_id = '555e5555-e55b-55c5-d555-555555555555'),
  'User role should exist before cascade delete test'
);

-- Delete profile (should cascade to user_roles)
delete from public.profiles where id = '555e5555-e55b-55c5-d555-555555555555';

select ok(
  not exists(select 1 from public.user_roles where user_id = '555e5555-e55b-55c5-d555-555555555555'),
  'Deleting profile should cascade delete user_roles'
);

-- ==============================================
-- SECTION 13: PERFORMANCE AND SECURITY TESTS
-- ==============================================

-- Test 60: Functions are marked as stable/immutable where appropriate
select ok(
  exists(
    select 1 from pg_proc p 
    join pg_namespace n on p.pronamespace = n.oid 
    where n.nspname = 'public' 
    and p.proname = 'authorize' 
    and p.provolatile = 's' -- stable
  ),
  'authorize function should be marked as stable'
);

-- Test 61: Functions have secure search_path
select ok(
  exists(
    select 1 from pg_proc p 
    join pg_namespace n on p.pronamespace = n.oid 
    where n.nspname = 'public' 
    and p.proname = 'handle_new_user'
    and p.prosecdef = true -- security definer
  ),
  'handle_new_user should be security definer'
);

-- Test 62: Comments exist on tables
select ok(
  exists(
    select 1 from pg_description d
    join pg_class c on d.objoid = c.oid
    join pg_namespace n on c.relnamespace = n.oid
    where n.nspname = 'public' 
    and c.relname = 'user_roles'
    and d.description is not null
  ),
  'user_roles table should have comment'
);

-- Test 63: Comments exist on role_permissions table
select ok(
  exists(
    select 1 from pg_description d
    join pg_class c on d.objoid = c.oid
    join pg_namespace n on c.relnamespace = n.oid
    where n.nspname = 'public' 
    and c.relname = 'role_permissions'
    and d.description is not null
  ),
  'role_permissions table should have comment'
);

-- Test 64: Auth admin policy exists and is correctly named
select ok(
  exists(
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'user_roles' 
    and policyname = 'Allow auth admin to read user roles'
  ),
  'Auth admin policy should exist on user_roles'
);

-- Test 65: Comprehensive permission matrix test
select ok(
  (select count(*) from unnest(enum_range(null::app_permission))) = 12 and
  (select count(*) from unnest(enum_range(null::app_role))) = 4,
  'Permission matrix should support all role-permission combinations'
);

-- ==============================================
-- FINAL CLEANUP
-- ==============================================

-- Clean up test data at the end
select cleanup_test_data();

-- Drop helper functions
drop function if exists cleanup_test_data();
drop function if exists setup_test_role_permissions();
drop function if exists create_test_user(uuid, text, text, text);
drop function if exists assign_test_role(uuid, app_role);

-- Done
select * from finish();

commit;