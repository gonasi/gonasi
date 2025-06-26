import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { signInWithEmailAndPassword, signUpWithEmailAndPassword } from '../../auth';
import { getUserProfile } from '../../profile';
import { setupTestDatabase, TestCleanupManager, testSupabase } from '../setup/test-helpers';
import { getTestUser } from '../utils/getTestUser';

const userOne = getTestUser('user', 'user1');
const userTwo = getTestUser('user', 'user2');
const userThree = getTestUser('user', 'user3');
const userFour = getTestUser('user', 'user4');

const TEST_USERS = [userOne, userTwo, userThree, userFour];

describe('Profile RLS Policies', () => {
  setupTestDatabase();

  describe('Row Level Security', () => {
    beforeEach(async () => {
      await TestCleanupManager.performFullCleanup();

      // Sign up each test user
      for (const testUser of TEST_USERS) {
        if (!testUser.email || !testUser.password) {
          console.warn(`[beforeEach] Missing email or password for ${JSON.stringify(testUser)}`);
          continue;
        }

        const { error } = await signUpWithEmailAndPassword(testSupabase, {
          email: testUser.email,
          password: testUser.password,
          fullName: testUser.fullName,
        });

        if (error) {
          console.warn(`[beforeEach] Failed to sign up user ${testUser.email}: ${error.message}`);
        }
      }
    });

    afterEach(async () => {
      await TestCleanupManager.signOutAllClients();
      await TestCleanupManager.performFullCleanup();
    });

    describe('Public read access policy', () => {
      it('should allow authenticated users to read all profiles', async () => {
        // Sign in as userOne
        await signInWithEmailAndPassword(testSupabase, {
          email: userOne.email,
          password: userOne.password,
        });

        // Should be able to read all profiles
        const { data, error } = await testSupabase.from('profiles').select('*');

        expect(error).toBeNull();
        expect(data).toBeInstanceOf(Array);
        expect(data?.length).toEqual(4);

        // Should include both test users' profiles
        const emails = data?.map((profile) => profile.email) || [];
        expect(emails).toContain(userOne.email);
        expect(emails).toContain(userTwo.email);
        expect(emails).toContain(userThree.email);
        expect(emails).toContain(userFour.email);
      });

      it('should allow anonymous users to read all profiles', async () => {
        await TestCleanupManager.signOutAllClients();

        const {
          data: { session },
        } = await testSupabase.auth.getSession();
        expect(session).toBeNull(); // Confirm anonymous

        const { data, error } = await testSupabase.from('profiles').select('*');

        expect(error).toBeNull();
        expect(Array.isArray(data)).toBe(true);
        expect(data?.length).toBeGreaterThan(0);
      });

      it('should allow reading specific profile by id', async () => {
        // Sign in to get user ID
        await signInWithEmailAndPassword(testSupabase, {
          email: userOne.email,
          password: userOne.password,
        });

        const { user } = await getUserProfile(testSupabase);
        const userId = user?.id ?? '';

        // Sign out and try to read specific profile
        await TestCleanupManager.signOutAllClients();

        const { data, error } = await testSupabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        expect(error).toBeNull();
        expect(data?.id).toBe(userId);
        expect(data?.email).toBe(userOne.email);
      });
    });

    describe('Create own profile policy', () => {
      it('should allow authenticated user to create their own profile', async () => {
        // Sign in as userOne
        await signInWithEmailAndPassword(testSupabase, {
          email: userOne.email,
          password: userOne.password,
        });

        const {
          data: { user },
        } = await testSupabase.auth.getUser();
        const userId = user?.id ?? '';

        // Try to insert a profile record (this would typically be done via trigger)
        const { data, error } = await testSupabase
          .from('profiles')
          .insert({
            id: userId,
            email: userOne.email,
            full_name: 'Test Profile Creation',
            username: 'testcreate123',
          })
          .select()
          .single();

        // This might fail if profile already exists from signup trigger
        // In that case, we expect a specific error about duplicate key
        if (error) {
          expect(error.message).toMatch(/duplicate key|already exists/i);
        } else {
          expect(data?.id).toBe(userId);
          expect(data?.email).toBe(userOne.email);
        }
      });

      it('should prevent authenticated user from creating profile for another user', async () => {
        // Sign in as userOne
        await signInWithEmailAndPassword(testSupabase, {
          email: userOne.email,
          password: userOne.password,
        });

        // Get userTwo's ID
        await TestCleanupManager.signOutAllClients();
        await signInWithEmailAndPassword(testSupabase, {
          email: userTwo.email,
          password: userTwo.password,
        });

        const { user: userTwoProfile } = await getUserProfile(testSupabase);
        const userTwoId = userTwoProfile?.id ?? '';

        // Sign back in as userOne
        await TestCleanupManager.signOutAllClients();
        await signInWithEmailAndPassword(testSupabase, {
          email: userOne.email,
          password: userOne.password,
        });

        // Try to create profile for userTwo (should fail)
        const { data, error } = await testSupabase
          .from('profiles')
          .insert({
            id: userTwoId,
            email: 'fake@example.com',
            full_name: 'Fake Profile',
            username: 'fakecreate123',
          })
          .select();

        expect(data).toBeNull();
        expect(error).not.toBeNull();
        expect(error?.message).toMatch(/policy|permission|check constraint/i);
      });

      it('should prevent anonymous users from creating profiles', async () => {
        await TestCleanupManager.signOutAllClients();

        const {
          data: { session },
        } = await testSupabase.auth.getSession();
        expect(session).toBeNull(); // Confirm anonymous

        // Try to create a profile as anonymous user
        const { data, error } = await testSupabase
          .from('profiles')
          .insert({
            id: 'b4e3f1d8-7c3b-4b12-9a57-1a5c6a2d2e1f',
            email: 'anonymous@example.com',
            full_name: 'Anonymous User',
            username: 'anonuser123',
          })
          .select();

        expect(data).toBeNull();
        expect(error).not.toBeNull();
        expect(error?.message).toMatch(/policy|permission|authentication/i);
      });
    });

    describe('Update own profile policy', () => {
      it('should allow user to update their own profile', async () => {
        // Sign in as userOne
        await signInWithEmailAndPassword(testSupabase, {
          email: userOne.email,
          password: userOne.password,
        });

        const { user } = await getUserProfile(testSupabase);
        const userId = user?.id ?? '';

        // Update own profile
        const { data, error } = await testSupabase
          .from('profiles')
          .update({
            full_name: 'Updated by Owner',
            username: 'updatedowner123',
          })
          .eq('id', userId)
          .select()
          .single();

        expect(error).toBeNull();
        expect(data?.full_name).toBe('Updated by Owner');
        expect(data?.username).toBe('updatedowner123');
      });

      it("should prevent user from updating another user's profile", async () => {
        // Sign in as userOne and get profile
        await signInWithEmailAndPassword(testSupabase, {
          email: userOne.email,
          password: userOne.password,
        });

        const { user: userOneProfile } = await getUserProfile(testSupabase);
        const userOneId = userOneProfile?.id ?? '';

        // Sign in as userTwo and get profile
        await TestCleanupManager.signOutAllClients();
        await signInWithEmailAndPassword(testSupabase, {
          email: userTwo.email,
          password: userTwo.password,
        });

        await getUserProfile(testSupabase);

        // Try to update userOne's profile while signed in as userTwo
        const { data, error } = await testSupabase
          .from('profiles')
          .update({
            full_name: 'Malicious Update',
            username: 'hacked123',
          })
          .eq('id', userOneId)
          .select();

        expect(data).toEqual([]); // Should return empty array due to RLS
        expect(error).toBeNull(); // RLS doesn't throw error, just filters results

        // Verify userOne's profile wasn't actually updated
        await TestCleanupManager.signOutAllClients();
        await signInWithEmailAndPassword(testSupabase, {
          email: userOne.email,
          password: userOne.password,
        });

        const { user: verifyProfile } = await getUserProfile(testSupabase);
        expect(verifyProfile?.full_name).not.toBe('Malicious Update');
        expect(verifyProfile?.username).not.toBe('hacked123');
      });

      it('should prevent anonymous users from updating profiles', async () => {
        // Sign in to get a user ID first
        await signInWithEmailAndPassword(testSupabase, {
          email: userOne.email,
          password: userOne.password,
        });

        const { user } = await getUserProfile(testSupabase);
        const userId = user?.id ?? '';

        // Sign out and try to update as anonymous user
        await TestCleanupManager.signOutAllClients();

        const { data, error } = await testSupabase
          .from('profiles')
          .update({
            full_name: 'Anonymous Update',
          })
          .eq('id', userId)
          .select();

        expect(data).toEqual([]); // Should return empty array due to RLS
        expect(error).toBeNull(); // RLS doesn't throw error, just filters results
      });
    });

    describe('Delete own profile policy', () => {
      it('should allow user to delete their own profile', async () => {
        // Sign in as userOne
        await signInWithEmailAndPassword(testSupabase, {
          email: userOne.email,
          password: userOne.password,
        });

        const { user } = await getUserProfile(testSupabase);
        const userId = user?.id ?? '';

        // Delete own profile
        const { data, error } = await testSupabase
          .from('profiles')
          .delete()
          .eq('id', userId)
          .select();

        expect(error).toBeNull();
        expect(data).toBeInstanceOf(Array);
        expect(data?.length).toBe(1);
        expect(data?.[0]?.id).toBe(userId);

        // Verify profile is deleted
        const { user: deletedUser } = await getUserProfile(testSupabase);
        expect(deletedUser).toBeNull();
      });

      it("should prevent user from deleting another user's profile", async () => {
        // Sign in as userOne and get ID
        await signInWithEmailAndPassword(testSupabase, {
          email: userOne.email,
          password: userOne.password,
        });

        const { user: userOneProfile } = await getUserProfile(testSupabase);
        const userOneId = userOneProfile?.id ?? '';

        // Sign in as userTwo
        await TestCleanupManager.signOutAllClients();
        await signInWithEmailAndPassword(testSupabase, {
          email: userTwo.email,
          password: userTwo.password,
        });

        // Try to delete userOne's profile while signed in as userTwo
        const { data, error } = await testSupabase
          .from('profiles')
          .delete()
          .eq('id', userOneId)
          .select();

        expect(data).toEqual([]); // Should return empty array due to RLS
        expect(error).toBeNull(); // RLS doesn't throw error, just filters results

        // Verify userOne's profile still exists
        await TestCleanupManager.signOutAllClients();
        await signInWithEmailAndPassword(testSupabase, {
          email: userOne.email,
          password: userOne.password,
        });

        const { user: verifyProfile } = await getUserProfile(testSupabase);
        expect(verifyProfile).not.toBeNull();
        expect(verifyProfile?.id).toBe(userOneId);
      });

      it('should prevent anonymous users from deleting profiles', async () => {
        // Sign in to get a user ID first
        await signInWithEmailAndPassword(testSupabase, {
          email: userOne.email,
          password: userOne.password,
        });

        const { user } = await getUserProfile(testSupabase);
        const userId = user?.id ?? '';

        // Sign out and try to delete as anonymous user
        await TestCleanupManager.signOutAllClients();

        const { data, error } = await testSupabase
          .from('profiles')
          .delete()
          .eq('id', userId)
          .select();

        expect(data).toEqual([]); // Should return empty array due to RLS
        expect(error).toBeNull(); // RLS doesn't throw error, just filters results

        // Verify profile still exists
        await signInWithEmailAndPassword(testSupabase, {
          email: userOne.email,
          password: userOne.password,
        });

        const { user: verifyProfile } = await getUserProfile(testSupabase);
        expect(verifyProfile).not.toBeNull();
        expect(verifyProfile?.id).toBe(userId);
      });
    });

    describe('Cross-user access patterns', () => {
      it("should allow reading other users' profiles but not modifying them", async () => {
        // Sign in as userOne
        await signInWithEmailAndPassword(testSupabase, {
          email: userOne.email,
          password: userOne.password,
        });

        // Get userTwo's profile data
        const { data: allProfiles } = await testSupabase.from('profiles').select('*');

        const userTwoProfile = allProfiles?.find((p) => p.email === userTwo.email);
        expect(userTwoProfile).toBeDefined();

        // Should be able to read userTwo's profile
        const { data: readProfile, error: readError } = await testSupabase
          .from('profiles')
          .select('*')
          .eq('id', userTwoProfile?.id ?? '')
          .single();

        expect(readError).toBeNull();
        expect(readProfile?.email).toBe(userTwo.email);

        // Should NOT be able to update userTwo's profile
        const { data: updateData, error: updateError } = await testSupabase
          .from('profiles')
          .update({ full_name: 'Unauthorized Update' })
          .eq('id', userTwoProfile?.id ?? '')
          .select();

        expect(updateData).toEqual([]);
        expect(updateError).toBeNull();

        // Should NOT be able to delete userTwo's profile
        const { data: deleteData, error: deleteError } = await testSupabase
          .from('profiles')
          .delete()
          .eq('id', userTwoProfile?.id ?? '')
          .select();

        expect(deleteData).toEqual([]);
        expect(deleteError).toBeNull();
      });

      it('should maintain data isolation between users for write operations', async () => {
        // Set up initial data for both users
        await signInWithEmailAndPassword(testSupabase, {
          email: userOne.email,
          password: userOne.password,
        });

        await testSupabase
          .from('profiles')
          .update({ username: 'userone123', full_name: 'User One' })
          .eq('id', (await getUserProfile(testSupabase)).user?.id ?? '');

        await TestCleanupManager.signOutAllClients();
        await signInWithEmailAndPassword(testSupabase, {
          email: userTwo.email,
          password: userTwo.password,
        });

        await testSupabase
          .from('profiles')
          .update({ username: 'usertwo123', full_name: 'User Two' })
          .eq('id', (await getUserProfile(testSupabase)).user?.id ?? '');

        // Verify each user can only see their own data in update operations
        const { data: userTwoUpdates } = await testSupabase
          .from('profiles')
          .update({ full_name: 'User Two Updated' })
          .eq('username', 'userone123') // Try to update userOne's record
          .select();

        expect(userTwoUpdates).toEqual([]); // Should not be able to update

        // But should be able to update own record
        const { data: ownUpdate } = await testSupabase
          .from('profiles')
          .update({ full_name: 'User Two Self Updated' })
          .eq('username', 'usertwo123')
          .select();

        expect(ownUpdate).toHaveLength(1);
        expect(ownUpdate?.[0]?.full_name).toBe('User Two Self Updated');
      });
    });
  });
});
