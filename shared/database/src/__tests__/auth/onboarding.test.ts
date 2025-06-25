import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { signInWithEmailAndPassword, signUpWithEmailAndPassword } from '../../auth';
import { completeUserOnboarding } from '../../onboarding';
import { getUserProfile } from '../../profile';
import { setupTestDatabase, TestCleanupManager, testSupabase } from '../setup/test-helpers';
import { getTestUser } from '../utils/getTestUser';

const userOne = getTestUser('user', 'user1');
const userTwo = getTestUser('user', 'user2');
const TEST_USERS = [userOne, userTwo];

describe('User Onboarding', () => {
  setupTestDatabase();

  describe('Complete User Onboarding After Sign Up', () => {
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

    it('should complete onboarding with valid data', async () => {
      const result = await completeUserOnboarding(testSupabase, {
        username: userOne.username,
        fullName: userOne.fullName,
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('User profile successfully updated');
    });

    it('should fail onboarding with duplicate username', async () => {
      // User one completes onboarding
      const result1 = await completeUserOnboarding(testSupabase, {
        username: userOne.username,
        fullName: userOne.fullName,
      });

      expect(result1.success).toBe(true);

      // Switch to user two and attempt onboarding with duplicate username
      await TestCleanupManager.signOutAllClients();
      await signInWithEmailAndPassword(testSupabase, {
        email: userTwo.email,
        password: userTwo.password,
      });

      const result2 = await completeUserOnboarding(testSupabase, {
        username: userOne.username,
        fullName: userTwo.fullName,
      });

      expect(result2.success).toBe(false);
      expect(result2.message).toBe('Could not update user profile');
    });

    it('should fail onboarding when not authenticated', async () => {
      await TestCleanupManager.signOutAllClients();

      const result = await completeUserOnboarding(testSupabase, {
        username: 'testuser456',
        fullName: 'Test User',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Could not update user profile');
    });

    it('should fail onboarding with empty username', async () => {
      const result = await completeUserOnboarding(testSupabase, {
        username: '',
        fullName: 'Test User',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Could not update user profile');
    });

    it('should optionally succeed onboarding with empty fullName', async () => {
      const result = await completeUserOnboarding(testSupabase, {
        username: 'testuser789',
        fullName: '',
      });

      // This depends on whether fullName is required in your schema
      expect(result.success).toBe(true);
      expect(result.message).toBe('User profile successfully updated');
    });

    it('should update profile with new username and fullName', async () => {
      const updatedData = {
        username: 'updatedusername',
        fullName: 'Updated Full Name',
      };

      const result = await completeUserOnboarding(testSupabase, updatedData);

      expect(result.success).toBe(true);
      expect(result.message).toBe('User profile successfully updated');

      const { user: updatedProfile } = await getUserProfile(testSupabase);
      expect(updatedProfile?.username).toBe(updatedData.username);
      expect(updatedProfile?.full_name).toBe(updatedData.fullName);
    });

    it('should support special characters in username', async () => {
      const result = await completeUserOnboarding(testSupabase, {
        username: 'test_user-123',
        fullName: 'Test User',
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('User profile successfully updated');
    });
  });
});
