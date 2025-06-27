import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { signInWithEmailAndPassword, signUpWithEmailAndPassword } from '../../auth';
import { getUserProfile, updatePersonalInformation } from '../../profile';
import { setupTestDatabase, TestCleanupManager, testSupabase } from '../setup/test-helpers';
import { getTestUser } from '../utils/getTestUser';

const userOne = getTestUser('user', 'user1');
const userTwo = getTestUser('user', 'user2');
const TEST_USERS = [userOne, userTwo];

describe('Profile', () => {
  setupTestDatabase();

  describe('Profile Management', () => {
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

      // Log in userOne for initial test context
      const { error: signInError } = await signInWithEmailAndPassword(testSupabase, {
        email: userOne.email,
        password: userOne.password,
      });

      if (signInError) {
        console.warn(
          `[beforeEach] Failed to sign in user ${userOne.email}: ${signInError.message}`,
        );
      }
    });

    afterEach(async () => {
      await TestCleanupManager.signOutAllClients();
      await TestCleanupManager.performFullCleanup();
    });

    describe('Profile fetching', () => {
      it('should fetch profile with correct credentials', async () => {
        const { user } = await getUserProfile(testSupabase);

        expect(user?.email).toBe(userOne.email);
        expect(user?.id).toBeDefined();
      });

      it('should return null for unauthenticated user', async () => {
        // Ensure user is signed out
        await TestCleanupManager.signOutAllClients();

        const { user } = await getUserProfile(testSupabase);

        expect(user).toBeNull();
      });

      it('should have default values for new profile', async () => {
        const { user } = await getUserProfile(testSupabase);

        expect(user?.country_code).toBe('KE'); // Default value
        expect(user?.preferred_language).toBe('en'); // Default value
        expect(user?.phone_number_verified).toBe(false); // Default value
        expect(user?.email_verified).toBe(false); // Default value
        expect(user?.account_verified).toBe(false); // Default value
        expect(user?.notifications_enabled).toBe(true); // Default value
        expect(user?.created_at).toBeDefined();
        expect(user?.updated_at).toBeDefined();
      });
    });

    describe('Profile updates', () => {
      it('should update username successfully', async () => {
        const newUsername = 'testuser123';
        const newFullName = 'Test User';

        const { data, success } = await updatePersonalInformation(testSupabase, {
          username: newUsername,
          fullName: newFullName,
          updateType: 'personal-information',
        });

        expect(success).toBe(true);
        expect(data?.username).toBe(newUsername);
        expect(data?.full_name).toBe(newFullName);

        // Verify the update persisted
        const { user } = await getUserProfile(testSupabase);
        expect(user?.username).toBe(newUsername);
        expect(user?.full_name).toBe(newFullName);
      });

      // it('should update avatar URL successfully', async () => {
      //   const newAvatarUrl = 'https://example.com/avatar.jpg';

      //   const { data, error } = await updateUserProfile(testSupabase, {
      //     avatar_url: newAvatarUrl,
      //   });

      //   expect(error).toBeNull();
      //   expect(data?.avatar_url).toBe(newAvatarUrl);
      // });

      // it('should update blur hash successfully', async () => {
      //   const newBlurHash = 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.';

      //   const { data, error } = await updateUserProfile(testSupabase, {
      //     blur_hash: newBlurHash,
      //   });

      //   expect(error).toBeNull();
      //   expect(data?.blur_hash).toBe(newBlurHash);
      // });

      it('should update the updated_at timestamp', async () => {
        // Get initial timestamp
        const { user: initialUser } = await getUserProfile(testSupabase);
        const initialUpdatedAt = initialUser?.updated_at;

        // Wait a moment to ensure timestamp difference
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Update profile
        await updatePersonalInformation(testSupabase, {
          fullName: 'Timestamp Test User',
          username: 'new_username',
          updateType: 'personal-information',
        });

        // Check updated timestamp
        const { user: updatedUser } = await getUserProfile(testSupabase);
        const newUpdatedAt = updatedUser?.updated_at;

        expect(newUpdatedAt).not.toBe(initialUpdatedAt);
        expect(new Date(newUpdatedAt!).getTime()).toBeGreaterThan(
          new Date(initialUpdatedAt!).getTime(),
        );
      });
    });
  });
});
