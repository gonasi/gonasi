import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { signInWithEmailAndPassword, signUpWithEmailAndPassword } from '../../auth';
import { getUserProfile, updateUserProfile } from '../../profile';
import { createSignupPayload } from '../auth/helpers';
import { supabase } from '../lib/supabase';
import { generateRandomEmail } from '../utils/generateRandomEmail';
import { resetDatabase } from '../utils/resetDatabase';

let userPayload: ReturnType<typeof createSignupPayload>;
let userId: string;

describe('Supabase profile management', () => {
  beforeAll(async () => {
    const result = await resetDatabase();

    if (!result.success) throw new Error('Failed to reset database');

    await supabase.auth.signOut();

    // Delay to ensure database and auth state are fully cleared
    await new Promise((resolve) => setTimeout(resolve, 500));

    userPayload = createSignupPayload({
      email: generateRandomEmail(),
    });

    const { data: signUpData, error: signUpError } = await signUpWithEmailAndPassword(
      supabase,
      userPayload,
    );
    if (signUpError) throw new Error(`Sign up failed: ${signUpError.message}`);

    userId = signUpData?.user?.id || '';

    // 🔐 Wait for the session to propagate properly
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Ensure session is available
    const sessionCheck = await supabase.auth.getSession();
    if (!sessionCheck.data.session) {
      throw new Error('No session available after sign-up');
    }

    // Sign out to ensure clean state for each test
    await supabase.auth.signOut();
  });

  afterEach(async () => {
    // Clean auth state between tests
    await supabase.auth.signOut();
  });

  afterAll(async () => {
    await supabase.auth.signOut();
    await resetDatabase();
  });

  describe('Profile fetching', () => {
    it('should fetch profile with correct credentials', async () => {
      await signInWithEmailAndPassword(supabase, {
        email: userPayload.email,
        password: userPayload.password,
      });

      const { user } = await getUserProfile(supabase);

      expect(user?.email).toBe(userPayload.email);
      expect(user?.id).toBe(userId);
    });

    it('should return null for unauthenticated user', async () => {
      // Ensure user is signed out
      await supabase.auth.signOut();

      const { user } = await getUserProfile(supabase);

      expect(user).toBeNull();
    });

    it('should have default values for new profile', async () => {
      await signInWithEmailAndPassword(supabase, {
        email: userPayload.email,
        password: userPayload.password,
      });

      const { user } = await getUserProfile(supabase);

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
    beforeEach(async () => {
      const { error } = await signInWithEmailAndPassword(supabase, {
        email: userPayload.email,
        password: userPayload.password,
      });

      expect(error).toBeNull();

      // Wait for Supabase to propagate and cache the session internally
      await new Promise((res) => setTimeout(res, 500));

      // Double-check a valid session exists
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('Session not available after sign-in');
      }
    });

    it('should update username successfully', async () => {
      const newUsername = 'testuser123';

      const { data, error } = await updateUserProfile(supabase, {
        username: newUsername,
      });

      expect(error).toBeNull();
      expect(data?.username).toBe(newUsername);

      // Verify the update persisted
      const { user } = await getUserProfile(supabase);
      expect(user?.username).toBe(newUsername);
    });

    it('should update full name successfully', async () => {
      const newFullName = 'John Doe Updated';

      const { data, error } = await updateUserProfile(supabase, {
        full_name: newFullName,
      });

      expect(error).toBeNull();
      expect(data?.full_name).toBe(newFullName);
    });

    it('should update avatar URL successfully', async () => {
      const newAvatarUrl = 'https://example.com/avatar.jpg';

      const { data, error } = await updateUserProfile(supabase, {
        avatar_url: newAvatarUrl,
      });

      expect(error).toBeNull();
      expect(data?.avatar_url).toBe(newAvatarUrl);
    });

    it('should update blur hash successfully', async () => {
      const newBlurHash = 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.';

      const { data, error } = await updateUserProfile(supabase, {
        blur_hash: newBlurHash,
      });

      expect(error).toBeNull();
      expect(data?.blur_hash).toBe(newBlurHash);
    });

    it('should update phone number successfully', async () => {
      const newPhoneNumber = '254712345678';

      const { data, error } = await updateUserProfile(supabase, {
        phone_number: newPhoneNumber,
      });

      expect(error).toBeNull();
      expect(data?.phone_number).toBe(newPhoneNumber);
    });

    it('should update phone verification status', async () => {
      const { data, error } = await updateUserProfile(supabase, {
        phone_number_verified: true,
      });

      console.log('error: ', error);

      expect(error).toBeNull();
      expect(data?.phone_number_verified).toBe(true);
    });

    it('should update email verification status', async () => {
      const { data, error } = await updateUserProfile(supabase, {
        email_verified: true,
      });

      expect(error).toBeNull();
      expect(data?.email_verified).toBe(true);
    });

    it('should update country code successfully', async () => {
      const newCountryCode = 'US';

      const { data, error } = await updateUserProfile(supabase, {
        country_code: newCountryCode,
      });

      expect(error).toBeNull();
      expect(data?.country_code).toBe(newCountryCode);
    });

    it('should update preferred language successfully', async () => {
      const newLanguage = 'sw';

      const { data, error } = await updateUserProfile(supabase, {
        preferred_language: newLanguage,
      });

      expect(error).toBeNull();
      expect(data?.preferred_language).toBe(newLanguage);
    });

    it('should update account verification status', async () => {
      const { data, error } = await updateUserProfile(supabase, {
        account_verified: true,
      });

      expect(error).toBeNull();
      expect(data?.account_verified).toBe(true);
    });

    it('should update notifications preference', async () => {
      const { data, error } = await updateUserProfile(supabase, {
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

      const { data, error } = await updateUserProfile(supabase, updates);

      expect(error).toBeNull();
      expect(data?.username).toBe(updates.username);
      expect(data?.full_name).toBe(updates.full_name);
      expect(data?.country_code).toBe(updates.country_code);
      expect(data?.preferred_language).toBe(updates.preferred_language);
      expect(data?.notifications_enabled).toBe(updates.notifications_enabled);
    });

    it('should update the updated_at timestamp', async () => {
      // Get initial timestamp
      const { user: initialUser } = await getUserProfile(supabase);
      const initialUpdatedAt = initialUser?.updated_at;

      // Wait a moment to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Update profile
      await updateUserProfile(supabase, {
        full_name: 'Timestamp Test User',
      });

      // Check updated timestamp
      const { user: updatedUser } = await getUserProfile(supabase);
      const newUpdatedAt = updatedUser?.updated_at;

      expect(newUpdatedAt).not.toBe(initialUpdatedAt);
      expect(new Date(newUpdatedAt!).getTime()).toBeGreaterThan(
        new Date(initialUpdatedAt!).getTime(),
      );
    });
  });

  describe('Profile validation', () => {
    beforeEach(async () => {
      await signInWithEmailAndPassword(supabase, {
        email: userPayload.email,
        password: userPayload.password,
      });
    });

    it('should reject username shorter than 3 characters', async () => {
      const { data, error } = await updateUserProfile(supabase, {
        username: 'ab',
      });

      expect(data).toBeNull();
      expect(error).not.toBeNull();
      expect(error?.message).toMatch(/username_length/i);
    });

    it('should reject uppercase username', async () => {
      const { data, error } = await updateUserProfile(supabase, {
        username: 'TestUser123',
      });

      expect(data).toBeNull();
      expect(error).not.toBeNull();
      expect(error?.message).toMatch(/username_lowercase/i);
    });

    it('should reject invalid country code format', async () => {
      const { data, error } = await updateUserProfile(supabase, {
        country_code: 'USA' as any, // Should be 2 characters
      });

      expect(data).toBeNull();
      expect(error).not.toBeNull();
    });

    it('should reject invalid language code format', async () => {
      const { data, error } = await updateUserProfile(supabase, {
        preferred_language: 'ENG' as any, // Should be 2 characters
      });

      expect(data).toBeNull();
      expect(error).not.toBeNull();
    });

    it('should reject duplicate username', async () => {
      // First, create another user with a username
      const secondUserPayload = createSignupPayload({
        email: 'second@user.com',
        password: 'password',
        fullName: 'Second User',
      });
      await signUpWithEmailAndPassword(supabase, secondUserPayload);

      // Sign in as second user and set username
      await signInWithEmailAndPassword(supabase, {
        email: secondUserPayload.email,
        password: secondUserPayload.password,
      });

      await updateUserProfile(supabase, {
        username: 'uniqueuser123',
      });

      // Sign back in as first user
      await signInWithEmailAndPassword(supabase, {
        email: userPayload.email,
        password: userPayload.password,
      });

      // Try to use the same username
      const { data, error } = await updateUserProfile(supabase, {
        username: 'uniqueuser123',
      });

      expect(data).toBeNull();
      expect(error).not.toBeNull();
      expect(error?.message).toMatch(/duplicate/i);
    });
  });

  describe('Profile edge cases', () => {
    beforeEach(async () => {
      await signInWithEmailAndPassword(supabase, {
        email: userPayload.email,
        password: userPayload.password,
      });
    });

    it('should handle null values for optional fields', async () => {
      const { data, error } = await updateUserProfile(supabase, {
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
      const { data, error } = await updateUserProfile(supabase, {
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
      await updateUserProfile(supabase, {
        username: 'preservetest',
        full_name: 'Preserve Test User',
        country_code: 'US',
      });

      // Update only one field
      const { data, error } = await updateUserProfile(supabase, {
        full_name: 'Updated Name Only',
      });

      expect(error).toBeNull();
      expect(data?.username).toBe('preservetest'); // Should be preserved
      expect(data?.full_name).toBe('Updated Name Only'); // Should be updated
      expect(data?.country_code).toBe('US'); // Should be preserved
    });
  });

  describe('Profile queries and filtering', () => {
    beforeEach(async () => {
      await signInWithEmailAndPassword(supabase, {
        email: userPayload.email,
        password: userPayload.password,
      });
    });

    it('should find profile by username', async () => {
      const testUsername = 'findbyusername';

      // Set username
      await updateUserProfile(supabase, {
        username: testUsername,
      });

      // Query by username (this would require a separate function in your profile module)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', testUsername)
        .single();

      expect(error).toBeNull();
      expect(data?.username).toBe(testUsername);
      expect(data?.email).toBe(userPayload.email);
    });

    it('should find profiles by country code', async () => {
      // Set country code
      await updateUserProfile(supabase, {
        country_code: 'CA',
      });

      // Query by country code
      const { data, error } = await supabase.from('profiles').select('*').eq('country_code', 'CA');

      expect(error).toBeNull();
      expect(data).toBeInstanceOf(Array);
      expect(data?.some((profile) => profile.email === userPayload.email)).toBe(true);
    });

    it('should filter verified accounts', async () => {
      // Set account as verified
      await updateUserProfile(supabase, {
        account_verified: true,
      });

      // Query verified accounts
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('account_verified', true);

      expect(error).toBeNull();
      expect(data).toBeInstanceOf(Array);
      expect(data?.some((profile) => profile.email === userPayload.email)).toBe(true);
    });
  });
});
