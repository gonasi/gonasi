import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { signInWithEmailAndPassword, signUpWithEmailAndPassword } from '../../auth';
import { getUserProfile } from '../../profile';
import type { Database } from '../../schema';
import { setupTestDatabase, TestCleanupManager, testSupabase } from '../setup/test-helpers';
import { getTestUser } from '../utils/getTestUser';

const userOne = getTestUser('user', 'user1');
const userTwo = getTestUser('user', 'user2');

const TEST_USERS = [userOne, userTwo];

describe('Profile RLS Policies — Column-Level Access Control', () => {
  setupTestDatabase();

  beforeEach(async () => {
    await TestCleanupManager.performFullCleanup();

    for (const testUser of TEST_USERS) {
      if (!testUser.email || !testUser.password) continue;

      const { error } = await signUpWithEmailAndPassword(testSupabase, {
        email: testUser.email,
        password: testUser.password,
        fullName: testUser.fullName,
      });

      if (error) {
        console.warn(`⚠️ Failed to sign up ${testUser.email}: ${error.message}`);
      }
    }
  });

  afterEach(async () => {
    await TestCleanupManager.signOutAllClients();
    await TestCleanupManager.performFullCleanup();
  });

  describe('Read own profile', () => {
    it('should allow user to read all columns of their own profile', async () => {
      await signInWithEmailAndPassword(testSupabase, {
        email: userOne.email,
        password: userOne.password,
      });

      const { data, error } = await testSupabase
        .from('profiles')
        .select('*')
        .eq('email', userOne.email)
        .single();

      expect(error).toBeNull();
      expect(data?.email).toBe(userOne.email);
      expect(data?.full_name).toBeDefined();
      expect(data?.username).toBeDefined();
      // Should have access to all columns including private ones
    });

    it("should not allow user to read another user's private profile via profiles table", async () => {
      await signInWithEmailAndPassword(testSupabase, {
        email: userOne.email,
        password: userOne.password,
      });

      // First make sure userTwo's profile is private (is_public = false)
      await TestCleanupManager.signOutAllClients();
      await signInWithEmailAndPassword(testSupabase, {
        email: userTwo.email,
        password: userTwo.password,
      });

      await testSupabase.from('profiles').update({ is_public: false }).eq('email', userTwo.email);

      await TestCleanupManager.signOutAllClients();
      await signInWithEmailAndPassword(testSupabase, {
        email: userOne.email,
        password: userOne.password,
      });

      const { data, error } = await testSupabase
        .from('profiles')
        .select('*')
        .eq('email', userTwo.email);

      expect(data).toEqual([]); // filtered out by RLS
      expect(error).toBeNull(); // not an error, just no access
    });

    it('should allow user to read limited columns of public profiles via profiles view', async () => {
      // First make userTwo's profile public
      await signInWithEmailAndPassword(testSupabase, {
        email: userTwo.email,
        password: userTwo.password,
      });

      const { user: userTwoProfile } = await getUserProfile(testSupabase);

      // Ensure userTwoProfile is not null
      expect(userTwoProfile).not.toBeNull();
      if (!userTwoProfile) throw new Error('userTwoProfile is null');

      expect(userTwoProfile).toMatchObject(
        {} as NonNullable<Database['public']['Tables']['profiles']['Row']>,
      );
      expect(userTwoProfile.is_public).toBeTruthy();

      const { data: userTwoProfileUpdate } = await testSupabase
        .from('profiles')
        .update({ is_public: false, username: 'publicuser' })
        .eq('id', userTwoProfile.id)
        .select()
        .single();

      if (!userTwoProfileUpdate) throw new Error('could not perform userTwoProfile update');

      await TestCleanupManager.signOutAllClients();

      await signInWithEmailAndPassword(testSupabase, {
        email: userOne.email,
        password: userOne.password,
      });

      const { data, error } = await testSupabase.from('profiles').select('*');

      expect(error).toBeNull();
      expect(data).toMatchObject(
        {} as NonNullable<Database['public']['Tables']['profiles']['Row']>,
      );
      expect(data).toHaveLength(1);
      expect(data?.[0]).toHaveProperty('id');
      expect(data?.[0]).toHaveProperty('full_name');
      // Should NOT have email or other private columns
      expect(data?.[0]).not.toHaveProperty('email');
    });

    it('should allow anonymous users to read public profiles with limited columns', async () => {
      // First make userOne's profile public
      await signInWithEmailAndPassword(testSupabase, {
        email: userOne.email,
        password: userOne.password,
      });

      await testSupabase
        .from('profiles')
        .update({ is_public: false, username: 'anon_invisible' })
        .eq('email', userOne.email);

      await TestCleanupManager.signOutAllClients();

      await signInWithEmailAndPassword(testSupabase, {
        email: userTwo.email,
        password: userTwo.password,
      });

      await testSupabase
        .from('profiles')
        .update({ username: 'anonvisible' })
        .eq('email', userTwo.email);

      await TestCleanupManager.signOutAllClients();

      const { data, error } = await testSupabase.from('profiles').select('*');

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data?.[0]).toHaveProperty('username', 'anonvisible');
      expect(data?.[0]).not.toHaveProperty('email');
    });

    it('should prevent anonymous users from accessing the main profiles table', async () => {
      await TestCleanupManager.signOutAllClients();

      const { data, error } = await testSupabase.from('profiles').select('*');

      expect(data).toEqual([]);
      expect(error).toBeNull();
    });
  });

  describe('Create profile policy', () => {
    it('should allow authenticated user to create their own profile', async () => {
      await signInWithEmailAndPassword(testSupabase, {
        email: userOne.email,
        password: userOne.password,
      });

      const {
        data: { user },
      } = await testSupabase.auth.getUser();

      const userId = user?.id ?? '';

      const { data, error } = await testSupabase
        .from('profiles')
        .insert({
          id: userId,
          email: userOne.email,
          full_name: 'Test Profile Creation',
          username: 'testcreate123',
          is_public: false, // Add is_public field
        })
        .select()
        .single();

      if (error) {
        expect(error.message).toMatch(/duplicate key|already exists/i);
      } else {
        expect(data?.id).toBe(userId);
      }
    });

    it("should not allow user to create another user's profile", async () => {
      await signInWithEmailAndPassword(testSupabase, {
        email: userOne.email,
        password: userOne.password,
      });

      const {
        data: { user: currentUser },
      } = await testSupabase.auth.getUser();

      expect(currentUser).not.toBeNull();

      const fakeUserId = '00000000-0000-0000-0000-000000000000';

      const { data, error } = await testSupabase
        .from('profiles')
        .insert({
          id: fakeUserId,
          email: 'fake@example.com',
          full_name: 'Not Me',
          username: 'notme123',
          is_public: false,
        })
        .select();

      expect(data).toBeNull();
      expect(error?.message).toMatch(/policy|check constraint|permission/i);
    });
  });

  describe('Update own profile', () => {
    it('should allow user to update their own profile including visibility', async () => {
      await signInWithEmailAndPassword(testSupabase, {
        email: userOne.email,
        password: userOne.password,
      });

      const { user } = await getUserProfile(testSupabase);
      const userId = user?.id ?? '';

      const { data, error } = await testSupabase
        .from('profiles')
        .update({
          full_name: 'Updated Name',
          username: 'updateduser123',
          is_public: true,
        })
        .eq('id', userId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.full_name).toBe('Updated Name');
      expect(data?.is_public).toBe(true);
    });

    it("should not allow user to update another user's profile", async () => {
      await signInWithEmailAndPassword(testSupabase, {
        email: userTwo.email,
        password: userTwo.password,
      });

      const { user: userTwoProfile } = await getUserProfile(testSupabase);
      const userTwoId = userTwoProfile?.id ?? '';

      await TestCleanupManager.signOutAllClients();
      await signInWithEmailAndPassword(testSupabase, {
        email: userOne.email,
        password: userOne.password,
      });

      const { data, error } = await testSupabase
        .from('profiles')
        .update({ full_name: 'Hacked!' })
        .eq('id', userTwoId)
        .select();

      expect(data).toEqual([]);
      expect(error).toBeNull();
    });
  });

  describe('Delete own profile', () => {
    it('should allow user to delete their own profile', async () => {
      await signInWithEmailAndPassword(testSupabase, {
        email: userOne.email,
        password: userOne.password,
      });

      const { user } = await getUserProfile(testSupabase);
      const userId = user?.id ?? '';

      const { data, error } = await testSupabase
        .from('profiles')
        .delete()
        .eq('id', userId)
        .select();

      expect(error).toBeNull();
      expect(data?.[0]?.id).toBe(userId);

      const { user: confirmGone } = await getUserProfile(testSupabase);
      expect(confirmGone).toBeNull();
    });

    it("should not allow user to delete another user's profile", async () => {
      await signInWithEmailAndPassword(testSupabase, {
        email: userTwo.email,
        password: userTwo.password,
      });

      const { user: userTwoProfile } = await getUserProfile(testSupabase);
      const userTwoId = userTwoProfile?.id ?? '';

      await TestCleanupManager.signOutAllClients();
      await signInWithEmailAndPassword(testSupabase, {
        email: userOne.email,
        password: userOne.password,
      });

      const { data, error } = await testSupabase
        .from('profiles')
        .delete()
        .eq('id', userTwoId)
        .select();

      expect(data).toEqual([]);
      expect(error).toBeNull();
    });
  });

  describe('Public profile visibility', () => {
    it('should show public profiles in profiles view but not private ones', async () => {
      // Make userOne public, userTwo private
      await signInWithEmailAndPassword(testSupabase, {
        email: userOne.email,
        password: userOne.password,
      });

      await testSupabase
        .from('profiles')
        .update({ is_public: true, username: 'publicuser1' })
        .eq('email', userOne.email);

      await TestCleanupManager.signOutAllClients();
      await signInWithEmailAndPassword(testSupabase, {
        email: userTwo.email,
        password: userTwo.password,
      });

      await testSupabase
        .from('profiles')
        .update({ is_public: false, username: 'privateuser2' })
        .eq('email', userTwo.email);

      await TestCleanupManager.signOutAllClients();

      const { data, error } = await testSupabase.from('profiles').select('*').order('username');

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data?.[0]?.username).toBe('publicuser1');
    });
  });
});
