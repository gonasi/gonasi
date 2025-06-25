import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { signInWithEmailAndPassword, signUpWithEmailAndPassword } from '../../auth';
import { getUserProfile, updateUserProfile } from '../../profile';
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

        const { data, error } = await updateUserProfile(testSupabase, {
          username: newUsername,
        });

        expect(error).toBeNull();
        expect(data?.username).toBe(newUsername);

        // Verify the update persisted
        const { user } = await getUserProfile(testSupabase);
        expect(user?.username).toBe(newUsername);
      });

      it('should update full name successfully', async () => {
        const newFullName = 'John Doe Updated';

        const { data, error } = await updateUserProfile(testSupabase, {
          full_name: newFullName,
        });

        expect(error).toBeNull();
        expect(data?.full_name).toBe(newFullName);
      });

      it('should update avatar URL successfully', async () => {
        const newAvatarUrl = 'https://example.com/avatar.jpg';

        const { data, error } = await updateUserProfile(testSupabase, {
          avatar_url: newAvatarUrl,
        });

        expect(error).toBeNull();
        expect(data?.avatar_url).toBe(newAvatarUrl);
      });

      it('should update blur hash successfully', async () => {
        const newBlurHash = 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.';

        const { data, error } = await updateUserProfile(testSupabase, {
          blur_hash: newBlurHash,
        });

        expect(error).toBeNull();
        expect(data?.blur_hash).toBe(newBlurHash);
      });

      it('should update phone number successfully', async () => {
        const newPhoneNumber = '254712345678';

        const { data, error } = await updateUserProfile(testSupabase, {
          phone_number: newPhoneNumber,
        });

        expect(error).toBeNull();
        expect(data?.phone_number).toBe(newPhoneNumber);
      });

      it('should update phone verification status', async () => {
        const { data, error } = await updateUserProfile(testSupabase, {
          phone_number_verified: true,
        });

        expect(error).toBeNull();
        expect(data?.phone_number_verified).toBe(true);
      });

      it('should update email verification status', async () => {
        const { data, error } = await updateUserProfile(testSupabase, {
          email_verified: true,
        });

        expect(error).toBeNull();
        expect(data?.email_verified).toBe(true);
      });

      it('should update country code successfully', async () => {
        const newCountryCode = 'US';

        const { data, error } = await updateUserProfile(testSupabase, {
          country_code: newCountryCode,
        });

        expect(error).toBeNull();
        expect(data?.country_code).toBe(newCountryCode);
      });

      it('should update preferred language successfully', async () => {
        const newLanguage = 'sw';

        const { data, error } = await updateUserProfile(testSupabase, {
          preferred_language: newLanguage,
        });

        expect(error).toBeNull();
        expect(data?.preferred_language).toBe(newLanguage);
      });

      it('should update account verification status', async () => {
        const { data, error } = await updateUserProfile(testSupabase, {
          account_verified: true,
        });

        expect(error).toBeNull();
        expect(data?.account_verified).toBe(true);
      });

      it('should update notifications preference', async () => {
        const { data, error } = await updateUserProfile(testSupabase, {
          notifications_enabled: false,
        });

        expect(error).toBeNull();
        expect(data?.notifications_enabled).toBe(false);
      });

      it('should update multiple fields simultaneously', async () => {
        const updates = {
          username: 'multiupdate123',
          full_name: 'Multi Update User',
          country_code: 'CA' as const,
          preferred_language: 'fr' as const,
          notifications_enabled: false,
        };

        const { data, error } = await updateUserProfile(testSupabase, updates);

        expect(error).toBeNull();
        expect(data?.username).toBe(updates.username);
        expect(data?.full_name).toBe(updates.full_name);
        expect(data?.country_code).toBe(updates.country_code);
        expect(data?.preferred_language).toBe(updates.preferred_language);
        expect(data?.notifications_enabled).toBe(updates.notifications_enabled);
      });

      it('should update the updated_at timestamp', async () => {
        // Get initial timestamp
        const { user: initialUser } = await getUserProfile(testSupabase);
        const initialUpdatedAt = initialUser?.updated_at;

        // Wait a moment to ensure timestamp difference
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Update profile
        await updateUserProfile(testSupabase, {
          full_name: 'Timestamp Test User',
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

    describe('Profile validation', () => {
      it('should reject username shorter than 3 characters', async () => {
        const { data, error } = await updateUserProfile(testSupabase, {
          username: 'ab',
        });

        expect(data).toBeNull();
        expect(error).not.toBeNull();
        expect(error?.message).toMatch(/username_length/i);
      });

      it('should reject uppercase username', async () => {
        const { data, error } = await updateUserProfile(testSupabase, {
          username: 'TestUser123',
        });

        expect(data).toBeNull();
        expect(error).not.toBeNull();
        expect(error?.message).toMatch(/username_lowercase/i);
      });

      it('should reject invalid country code format', async () => {
        const { data, error } = await updateUserProfile(testSupabase, {
          country_code: 'USA' as any, // Should be 2 characters
        });

        expect(data).toBeNull();
        expect(error).not.toBeNull();
      });

      it('should reject invalid language code format', async () => {
        const { data, error } = await updateUserProfile(testSupabase, {
          preferred_language: 'ENG' as any, // Should be 2 characters
        });

        expect(data).toBeNull();
        expect(error).not.toBeNull();
      });

      it('should reject duplicate username', async () => {
        // First user sets username
        await updateUserProfile(testSupabase, {
          username: 'uniqueuser123',
        });

        // Switch to second user
        await TestCleanupManager.signOutAllClients();
        await signInWithEmailAndPassword(testSupabase, {
          email: userTwo.email,
          password: userTwo.password,
        });

        // Try to use the same username
        const { data, error } = await updateUserProfile(testSupabase, {
          username: 'uniqueuser123',
        });

        expect(data).toBeNull();
        expect(error).not.toBeNull();
        expect(error?.message).toMatch(/duplicate/i);
      });
    });

    describe('Profile edge cases', () => {
      it('should handle null values for optional fields', async () => {
        const { data, error } = await updateUserProfile(testSupabase, {
          username: null,
          full_name: null,
          avatar_url: null,
          blur_hash: null,
          phone_number: null,
        });

        expect(error).toBeNull();
        expect(data?.username).toBeNull();
        expect(data?.full_name).toBeNull();
        expect(data?.avatar_url).toBeNull();
        expect(data?.blur_hash).toBeNull();
        expect(data?.phone_number).toBeNull();
      });

      it('should handle empty string values', async () => {
        const { data, error } = await updateUserProfile(testSupabase, {
          full_name: '',
          avatar_url: '',
          phone_number: '',
        });

        expect(error).toBeNull();
        // Empty strings might be converted to null or handled differently
        // depending on your implementation
      });

      it('should preserve unchanged fields during partial updates', async () => {
        // Set initial values
        await updateUserProfile(testSupabase, {
          username: 'preservetest',
          full_name: 'Preserve Test User',
          country_code: 'US',
        });

        // Update only one field
        const { data, error } = await updateUserProfile(testSupabase, {
          full_name: 'Updated Name Only',
        });

        expect(error).toBeNull();
        expect(data?.username).toBe('preservetest'); // Should be preserved
        expect(data?.full_name).toBe('Updated Name Only'); // Should be updated
        expect(data?.country_code).toBe('US'); // Should be preserved
      });

      it('should fail updates when not authenticated', async () => {
        await TestCleanupManager.signOutAllClients();

        const { data, error } = await updateUserProfile(testSupabase, {
          username: 'shouldfail',
        });

        expect(data).toBeNull();
        expect(error).not.toBeNull();
      });
    });

    describe('Profile queries and filtering', () => {
      it('should find profile by username', async () => {
        const testUsername = 'findbyusername';

        // Set username
        await updateUserProfile(testSupabase, {
          username: testUsername,
        });

        // Query by username
        const { data, error } = await testSupabase
          .from('profiles')
          .select('*')
          .eq('username', testUsername)
          .single();

        expect(error).toBeNull();
        expect(data?.username).toBe(testUsername);
        expect(data?.email).toBe(userOne.email);
      });

      it('should find profiles by country code', async () => {
        // Set country code
        await updateUserProfile(testSupabase, {
          country_code: 'CA',
        });

        // Query by country code
        const { data, error } = await testSupabase
          .from('profiles')
          .select('*')
          .eq('country_code', 'CA');

        expect(error).toBeNull();
        expect(data).toBeInstanceOf(Array);
        expect(data?.some((profile) => profile.email === userOne.email)).toBe(true);
      });

      it('should filter verified accounts', async () => {
        // Set account as verified
        await updateUserProfile(testSupabase, {
          account_verified: true,
        });

        // Query verified accounts
        const { data, error } = await testSupabase
          .from('profiles')
          .select('*')
          .eq('account_verified', true);

        expect(error).toBeNull();
        expect(data).toBeInstanceOf(Array);
        expect(data?.some((profile) => profile.email === userOne.email)).toBe(true);
      });
    });
  });
});
