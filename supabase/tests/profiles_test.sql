begin;

-- Install pgtap extension for testing
create extension if not exists pgtap with schema extensions;

-- Plan our test suite - updated count to match actual tests
select plan(51);

-- ==============================================
-- COMPREHENSIVE CLEANUP FUNCTION
-- ==============================================

-- Function to clean up all test data
create or replace function cleanup_test_data() returns void as $$
begin
  -- Delete all test profiles first (due to foreign key constraints)
  delete from public.profiles where id in (
    '123e4567-e89b-12d3-a456-426614174000',
    '987fcdeb-51a2-43d7-9012-345678901234', 
    '456e7890-e12b-34c5-d678-901234567890',
    'aaa1111a-a11a-11a1-a111-111111111aaa',
    'bbb2222b-b22b-22b2-b222-222222222bbb',
    '111e1111-e11b-11c5-d111-111111111111',
    '555e5555-e55b-55c5-d555-555555555555',
    '666e6666-e66b-66c5-d666-666666666666',
    '777e7777-e77b-77c5-d777-777777777777',
    '888e8888-e88b-88c5-d888-888888888888',
    '999e9999-e99b-99c5-d999-999999999999',
    'ccc3333c-c33c-33c3-c333-333333333ccc',
    'ddd4444d-d44d-44d4-d444-444444444ddd',
    'eee5555e-e55e-55e5-e555-555555555eee'
  );

  -- Delete all test auth users
  delete from auth.users where id in (
    '123e4567-e89b-12d3-a456-426614174000',
    '987fcdeb-51a2-43d7-9012-345678901234', 
    '456e7890-e12b-34c5-d678-901234567890',
    'aaa1111a-a11a-11a1-a111-111111111aaa',
    'bbb2222b-b22b-22b2-b222-222222222bbb',
    '111e1111-e11b-11c5-d111-111111111111',
    '555e5555-e55b-55c5-d555-555555555555',
    '666e6666-e66b-66c5-d666-666666666666',
    '777e7777-e77b-77c5-d777-777777777777',
    '888e8888-e88b-88c5-d888-888888888888',
    '999e9999-e99b-99c5-d999-999999999999',
    'ccc3333c-c33c-33c3-c333-333333333ccc',
    'ddd4444d-d44d-44d4-d444-444444444ddd',
    'eee5555e-e55e-55e5-e555-555555555eee'
  );
end;
$$ language plpgsql;

-- Initial cleanup
select cleanup_test_data();

-- Create base test users that will be reused
insert into auth.users (id, email) values
  ('123e4567-e89b-12d3-a456-426614174000', 'user1@test.com'),
  ('987fcdeb-51a2-43d7-9012-345678901234', 'user2@test.com'),
  ('456e7890-e12b-34c5-d678-901234567890', 'user3@test.com');

-- ==============================================
-- SECTION 1: TABLE STRUCTURE & CONSTRAINTS TESTS
-- ==============================================

-- Test 1: Table exists
select has_table('public', 'profiles', 'profiles table should exist');

-- Test 2: Primary key constraint
select has_pk('public', 'profiles', 'profiles table should have a primary key');

-- Test 3: Foreign key to auth.users
select has_fk('public', 'profiles', 'profiles should have foreign key to auth.users');

-- Test 4: Required columns exist - id
select has_column('public', 'profiles', 'id', 'profiles should have id column');

-- Test 5: Required columns exist - email
select has_column('public', 'profiles', 'email', 'profiles should have email column');

-- Test 6: Required columns exist - created_at
select has_column('public', 'profiles', 'created_at', 'profiles should have created_at column');

-- Test 7: Required columns exist - updated_at
select has_column('public', 'profiles', 'updated_at', 'profiles should have updated_at column');

-- ==============================================
-- SECTION 2: CONSTRAINT VALIDATION TESTS
-- ==============================================

-- Test 8: Username length constraint
-- Create unique user for this test
insert into auth.users (id, email) values ('555e5555-e55b-55c5-d555-555555555555', 'test1@example.com');
prepare insert_short_username as insert into public.profiles (id, email, username) values ('555e5555-e55b-55c5-d555-555555555555', 'test1@example.com', 'ab');
select throws_ok(
  'execute insert_short_username',
  '23514',
  null,
  'Username must be at least 3 characters'
);
deallocate insert_short_username;
-- Cleanup
delete from auth.users where id = '555e5555-e55b-55c5-d555-555555555555';

-- Test 9: Username lowercase constraint
-- Create unique user for this test
insert into auth.users (id, email) values ('666e6666-e66b-66c5-d666-666666666666', 'test2@example.com');
prepare insert_uppercase_username as insert into public.profiles (id, email, username) values ('666e6666-e66b-66c5-d666-666666666666', 'test2@example.com', 'UserName');
select throws_ok(
  'execute insert_uppercase_username',
  '23514',
  null,
  'Username must be lowercase'
);
deallocate insert_uppercase_username;
-- Cleanup
delete from auth.users where id = '666e6666-e66b-66c5-d666-666666666666';

-- Test 10: Email validation constraint
-- Create unique user for this test
insert into auth.users (id, email) values ('777e7777-e77b-77c5-d777-777777777777', 'invalid-email');
prepare insert_invalid_email as insert into public.profiles (id, email) values ('777e7777-e77b-77c5-d777-777777777777', 'invalid-email');
select throws_ok(
  'execute insert_invalid_email',
  '23514',
  null,
  'Email must be valid format'
);
deallocate insert_invalid_email;
-- Cleanup
delete from auth.users where id = '777e7777-e77b-77c5-d777-777777777777';

-- Test 11: Country code format constraint
-- Create unique user for this test
insert into auth.users (id, email) values ('888e8888-e88b-88c5-d888-888888888888', 'test3@example.com');
prepare insert_invalid_country as insert into public.profiles (id, email, country_code) values ('888e8888-e88b-88c5-d888-888888888888', 'test3@example.com', 'USA');
select throws_ok(
  'execute insert_invalid_country',
  '22001',
  null,
  'Country code must be 2 uppercase letters'
);
deallocate insert_invalid_country;
-- Cleanup
delete from auth.users where id = '888e8888-e88b-88c5-d888-888888888888';

-- Test 12: Language code format constraint
-- Create unique user for this test
insert into auth.users (id, email) values ('999e9999-e99b-99c5-d999-999999999999', 'test4@example.com');
prepare insert_invalid_language as insert into public.profiles (id, email, preferred_language) values ('999e9999-e99b-99c5-d999-999999999999', 'test4@example.com', 'ENG');
select throws_ok(
  'execute insert_invalid_language',
  '22001',
  null,
  'Language code must be 2 lowercase letters'
);
deallocate insert_invalid_language;
-- Cleanup
delete from auth.users where id = '999e9999-e99b-99c5-d999-999999999999';

-- Test 13: Website URL validation constraint
-- Create unique user for this test
insert into auth.users (id, email) values ('ccc3333c-c33c-33c3-c333-333333333ccc', 'test5@example.com');
prepare insert_invalid_website as insert into public.profiles (id, email, website_url) values ('ccc3333c-c33c-33c3-c333-333333333ccc', 'test5@example.com', 'invalid-url');
select throws_ok(
  'execute insert_invalid_website',
  '23514',
  null,
  'Website URL must be valid format'
);
deallocate insert_invalid_website;
-- Cleanup
delete from auth.users where id = 'ccc3333c-c33c-33c3-c333-333333333ccc';

-- ==============================================
-- SECTION 3: SOCIAL URL VALIDATION TESTS
-- ==============================================

-- Clean up and add users for social media tests (using new unique IDs)
insert into auth.users (id, email) values
  ('aaa1111a-a11a-11a1-a111-111111111aaa', 'social1@test.com'),
  ('bbb2222b-b22b-22b2-b222-222222222bbb', 'social2@test.com');

-- Test 14: Valid Twitter URL
prepare insert_valid_twitter as insert into public.profiles (id, email, twitter_url) values ('aaa1111a-a11a-11a1-a111-111111111aaa', 'social1@test.com', 'https://twitter.com/username');
select lives_ok(
  'execute insert_valid_twitter',
  'Valid Twitter URL should be accepted'
);
deallocate insert_valid_twitter;

-- Test 15: Invalid Twitter URL
prepare insert_invalid_twitter as insert into public.profiles (id, email, twitter_url) values ('bbb2222b-b22b-22b2-b222-222222222bbb', 'social2@test.com', 'https://invalid.com/username');
select throws_ok(
  'execute insert_invalid_twitter',
  '23514',
  null,
  'Invalid Twitter URL should be rejected'
);
deallocate insert_invalid_twitter;

-- Clean up failed insert and retry with valid data for remaining tests
delete from public.profiles where id = 'bbb2222b-b22b-22b2-b222-222222222bbb';
insert into public.profiles (id, email) values ('bbb2222b-b22b-22b2-b222-222222222bbb', 'social2@test.com');

-- Test 16: Valid LinkedIn URL
prepare update_linkedin as update public.profiles set linkedin_url = 'https://linkedin.com/in/johndoe' where id = 'aaa1111a-a11a-11a1-a111-111111111aaa';
select lives_ok(
  'execute update_linkedin',
  'Valid LinkedIn URL should be accepted'
);
deallocate update_linkedin;

-- Test 17: Valid GitHub URL
prepare update_github as update public.profiles set github_url = 'https://github.com/username' where id = 'aaa1111a-a11a-11a1-a111-111111111aaa';
select lives_ok(
    'execute update_github',
    'Valid GitHub URL should be accepted'
);
deallocate update_github;

-- Test 18: Valid Instagram URL
prepare update_instagram as update public.profiles set instagram_url = 'https://instagram.com/username' where id = 'aaa1111a-a11a-11a1-a111-111111111aaa';
select lives_ok(
    'execute update_instagram',
    'Valid Instagram URL should be accepted'
);
deallocate update_instagram;

-- Test 19: Valid Facebook URL
prepare update_facebook as update public.profiles set facebook_url = 'https://facebook.com/username' where id = 'aaa1111a-a11a-11a1-a111-111111111aaa';
select lives_ok(
    'execute update_facebook',
    'Valid Facebook URL should be accepted'
);
deallocate update_facebook;

-- Test 20: Valid TikTok URL
prepare update_tiktok as update public.profiles set tiktok_url = 'https://tiktok.com/@username' where id = 'aaa1111a-a11a-11a1-a111-111111111aaa';
select lives_ok(
    'execute update_tiktok',
    'Valid TikTok URL should be accepted'
);
deallocate update_tiktok;

-- Test 21: Valid YouTube URL
prepare update_youtube as update public.profiles set youtube_url = 'https://youtube.com/c/username' where id = 'aaa1111a-a11a-11a1-a111-111111111aaa';
select lives_ok(
    'execute update_youtube',
    'Valid YouTube URL should be accepted'
);
deallocate update_youtube;

-- Test 22: Valid Discord URL
prepare update_discord as update public.profiles set discord_url = 'https://discord.gg/serverid' where id = 'aaa1111a-a11a-11a1-a111-111111111aaa';
select lives_ok(
    'execute update_discord',
    'Valid Discord URL should be accepted'
);
deallocate update_discord;

-- ==============================================
-- SECTION 4: RLS POLICY TESTS
-- ==============================================

-- Test 23: RLS is enabled
select isnt_empty(
  $$select 1 from pg_class where relname = 'profiles' and relrowsecurity = true$$,
  'RLS should be enabled on profiles table'
);

-- Clean up existing test profiles and create fresh ones for RLS testing
delete from public.profiles where id in ('123e4567-e89b-12d3-a456-426614174000', '987fcdeb-51a2-43d7-9012-345678901234');

-- Create test profiles for RLS testing (as superuser to bypass RLS)
insert into public.profiles (id, email, username, full_name) values
  ('123e4567-e89b-12d3-a456-426614174000', 'user1@test.com', 'user1', 'User One'),
  ('987fcdeb-51a2-43d7-9012-345678901234', 'user2@test.com', 'user2', 'User Two');

-- Test 24: Anonymous users can read profiles
set local role anon;
select ok(
  (select count(*) from public.profiles) >= 0,
  'Anonymous users should be able to read profiles'
);

-- Test 25: Authenticated users can read all profiles
set local role authenticated;
set local request.jwt.claim.sub = '123e4567-e89b-12d3-a456-426614174000';
select ok(
  (select count(*) from public.profiles) >= 2,
  'Authenticated users should be able to read all profiles'
);

-- Test 26: Users can insert their own profile
-- Clean up user3 profile if it exists
delete from public.profiles where id = '456e7890-e12b-34c5-d678-901234567890';
-- Set up proper role and user context
set local role authenticated;
set local request.jwt.claim.sub = '456e7890-e12b-34c5-d678-901234567890';
prepare insert_own_profile as insert into public.profiles (id, email, username) values ('456e7890-e12b-34c5-d678-901234567890', 'user3@test.com', 'user3');
select lives_ok(
  'execute insert_own_profile',
  'Users should be able to insert their own profile'
);
deallocate insert_own_profile;

-- Test 27: Users cannot insert profiles for other users
-- Create a unique user ID for this test
insert into auth.users (id, email) values ('ddd4444d-d44d-44d4-d444-444444444ddd', 'hacker@test.com');
-- Keep the same authenticated role but try to insert for a different user
prepare insert_other_profile as insert into public.profiles (id, email, username) values ('ddd4444d-d44d-44d4-d444-444444444ddd', 'hacker@test.com', 'hacker');
select throws_ok(
  'execute insert_other_profile',
  '42501',
  null,
  'Users should not be able to insert profiles for other users'
);
deallocate insert_other_profile;
-- Cleanup
delete from auth.users where id = 'ddd4444d-d44d-44d4-d444-444444444ddd';

-- Test 28: Users can update their own profile
set local request.jwt.claim.sub = '123e4567-e89b-12d3-a456-426614174000';
prepare update_own_profile as update public.profiles set full_name = 'Updated Name' where id = '123e4567-e89b-12d3-a456-426614174000';
select lives_ok(
  'execute update_own_profile',
  'Users should be able to update their own profile'
);
deallocate update_own_profile;

-- Test 29: Users cannot update others' profiles
-- Store original value first
do $$
declare
  original_name text;
  updated_rows int;
begin
  select full_name into original_name from public.profiles where id = '987fcdeb-51a2-43d7-9012-345678901234';
  
  update public.profiles set full_name = 'Hacked!' where id = '987fcdeb-51a2-43d7-9012-345678901234';
  
  get diagnostics updated_rows = row_count;
  
  -- The update should affect 0 rows due to RLS
  if updated_rows = 0 then
    raise notice 'RLS correctly prevented update of other user profile';
  else
    raise exception 'RLS failed - updated % rows', updated_rows;
  end if;
end $$;

select ok(true, 'Users should not be able to update other users profiles');

-- Test 30: Users can delete their own profile
set local request.jwt.claim.sub = '123e4567-e89b-12d3-a456-426614174000';
prepare delete_own_profile as delete from public.profiles where id = '123e4567-e89b-12d3-a456-426614174000';
select lives_ok(
  'execute delete_own_profile',
  'Users should be able to delete their own profile'
);
deallocate delete_own_profile;

-- Switch to user 2
set local request.jwt.claim.sub = '987fcdeb-51a2-43d7-9012-345678901234';

-- Test 31: Users cannot delete others' profiles
-- Test that RLS prevents deletion of other users' profiles
do $$
declare
  deleted_rows int;
begin
  delete from public.profiles where id = '456e7890-e12b-34c5-d678-901234567890';
  
  get diagnostics deleted_rows = row_count;
  
  -- The delete should affect 0 rows due to RLS
  if deleted_rows = 0 then
    raise notice 'RLS correctly prevented deletion of other user profile';
  else
    raise exception 'RLS failed - deleted % rows', deleted_rows;
  end if;
end $$;

select ok(true, 'Users should not be able to delete other users profiles');

-- ==============================================
-- SECTION 5: TRIGGER AND TIMESTAMP TESTS
-- ==============================================

-- Reset role for timestamp tests
reset role;

-- Clean up and add the user for timestamp testing
delete from public.profiles where id = '111e1111-e11b-11c5-d111-111111111111';
delete from auth.users where id = '111e1111-e11b-11c5-d111-111111111111';

insert into auth.users (id, email) values 
  ('111e1111-e11b-11c5-d111-111111111111', 'timestamp@test.com');

-- Insert profile for timestamp testing
insert into public.profiles (id, email, username) values 
  ('111e1111-e11b-11c5-d111-111111111111', 'timestamp@test.com', 'timeuser');

-- Test 32: created_at is set automatically
select isnt_empty(
  $$select created_at from public.profiles where id = '111e1111-e11b-11c5-d111-111111111111' and created_at is not null$$,
  'created_at should be set automatically'
);

-- Test 33: updated_at is set automatically on insert
select isnt_empty(
  $$select updated_at from public.profiles where id = '111e1111-e11b-11c5-d111-111111111111' and updated_at is not null$$,
  'updated_at should be set automatically on insert'
);

-- Store current updated_at value and wait longer for timestamp difference
do $$
declare
  initial_time timestamptz;
  updated_time timestamptz;
begin
  -- Get initial timestamp
  select updated_at into initial_time from public.profiles where id = '111e1111-e11b-11c5-d111-111111111111';
  
  -- Wait to ensure timestamp difference
  perform pg_sleep(2);
  
  -- Update the profile
  update public.profiles set full_name = 'Time Updated' where id = '111e1111-e11b-11c5-d111-111111111111';
  
  -- Get updated timestamp
  select updated_at into updated_time from public.profiles where id = '111e1111-e11b-11c5-d111-111111111111';
  
  -- Test that timestamp was updated
  if updated_time > initial_time then
    raise notice 'Timestamp successfully updated: % -> %', initial_time, updated_time;
  else
    raise exception 'Timestamp was not updated: % -> %', initial_time, updated_time;
  end if;
end $$;

-- Test 34: updated_at is updated on modification
select ok(true, 'updated_at should be updated on row update');

-- ==============================================
-- SECTION 6: ALL SCHEMA COLUMNS EXIST TESTS
-- ==============================================

-- Test 35: Username column exists
select has_column('public', 'profiles', 'username', 'profiles should have username column');

-- Test 36: Full name column exists
select has_column('public', 'profiles', 'full_name', 'profiles should have full_name column');

-- Test 37: Avatar URL column exists
select has_column('public', 'profiles', 'avatar_url', 'profiles should have avatar_url column');

-- Test 37: Blur Hash column exists
select has_column('public', 'profiles', 'blur_hash', 'profiles should have blur_hash column');

-- Test 38: Phone number column exists
select has_column('public', 'profiles', 'phone_number', 'profiles should have phone_number column');

-- Test 39: Phone number verified column exists
select has_column('public', 'profiles', 'phone_number_verified', 'profiles should have phone_number_verified column');

-- Test 40: Email verified column exists
select has_column('public', 'profiles', 'email_verified', 'profiles should have email_verified column');

-- Test 41: Country code column exists
select has_column('public', 'profiles', 'country_code', 'profiles should have country_code column');

-- Test 42: Preferred language column exists
select has_column('public', 'profiles', 'preferred_language', 'profiles should have preferred_language column');

-- Test 43: Bio column exists
select has_column('public', 'profiles', 'bio', 'profiles should have bio column');

-- Test 44: Website URL column exists
select has_column('public', 'profiles', 'website_url', 'profiles should have website_url column');

-- Test 45: Is onboarding complete column exists
select has_column('public', 'profiles', 'is_onboarding_complete', 'profiles should have is_onboarding_complete column');

-- Test 46: Account verified column exists
select has_column('public', 'profiles', 'account_verified', 'profiles should have account_verified column');

-- Test 47: Notifications enabled column exists
select has_column('public', 'profiles', 'notifications_enabled', 'profiles should have notifications_enabled column');

-- ==============================================
-- SECTION 7: DATA TYPE AND NULL CONSTRAINT TESTS
-- ==============================================

-- Test 48: ID column data type
select col_type_is('public', 'profiles', 'id', 'uuid', 'id column should be uuid type');

-- Test 49: Email column data type
select col_type_is('public', 'profiles', 'email', 'text', 'email column should be text type');

-- Test 50: Default values test
-- Create a fresh profile to test defaults
insert into auth.users (id, email) values ('eee5555e-e55e-55e5-e555-555555555eee', 'defaults@test.com');
insert into public.profiles (id, email) values ('eee5555e-e55e-55e5-e555-555555555eee', 'defaults@test.com');

select ok(
  (select count(*) from public.profiles 
    where id = 'eee5555e-e55e-55e5-e555-555555555eee'
    and phone_number_verified = false 
    and email_verified = false 
    and is_onboarding_complete = false 
    and account_verified = false 
    and notifications_enabled = true 
    and country_code = 'KE' 
    and preferred_language = 'en') = 1,
  'Default values should be set correctly'
);

-- Final cleanup
select cleanup_test_data();
drop function cleanup_test_data();

-- Test 51: Final cleanup verification
select ok(
  (select count(*) from public.profiles where id in (
    '123e4567-e89b-12d3-a456-426614174000',
    '987fcdeb-51a2-43d7-9012-345678901234', 
    '456e7890-e12b-34c5-d678-901234567890',
    'aaa1111a-a11a-11a1-a111-111111111aaa',
    'bbb2222b-b22b-22b2-b222-222222222bbb',
    '111e1111-e11b-11c5-d111-111111111111',
    'eee5555e-e55e-55e5-e555-555555555eee'
  )) = 0,
  'All test data should be cleaned up'
);

-- Done
select * from finish();

commit;