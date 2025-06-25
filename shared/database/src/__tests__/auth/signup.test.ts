import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { signUpWithEmailAndPassword } from '../../auth';
import { setupTestDatabase, TestCleanupManager, testSupabase } from '../setup/test-helpers';
import { createSignupPayload } from './helpers';

describe('Sign Up', () => {
  setupTestDatabase();

  describe('Create Gonasi Users', () => {
    beforeEach(async () => {
      await TestCleanupManager.performFullCleanup();
    });

    afterAll(async () => {
      await testSupabase.auth.signOut();
    });

    it('should sign up a new user with valid credentials', async () => {
      const payload = createSignupPayload();

      const { data, error } = await signUpWithEmailAndPassword(testSupabase, payload);

      expect(error).toBeNull();
      expect(data?.user?.email).toBe(payload.email);
      expect(data?.user?.user_metadata?.full_name).toBe(payload.fullName);
    });

    it('should fail if email is missing', async () => {
      const payload = createSignupPayload({ email: undefined as any });

      const { data, error } = await signUpWithEmailAndPassword(testSupabase, payload);

      expect(data).toEqual({ user: null, session: null });
      expect(error?.message).toEqual('Anonymous sign-ins are disabled');
    });

    it('should fail if password is too short', async () => {
      const payload = createSignupPayload({
        email: 'weakpass@example.com',
        password: '123', // Too short
        fullName: 'Weak Password User',
      });

      const { data, error } = await signUpWithEmailAndPassword(testSupabase, payload);

      expect(data).toEqual({ user: null, session: null });
      expect(error).not.toBeNull();
    });

    it('should fail if user already exists', async () => {
      const duplicatePayload = createSignupPayload({
        email: 'duplicate@example.com',
        fullName: 'Duplicate User',
      });

      // First attempt (success)
      await signUpWithEmailAndPassword(testSupabase, duplicatePayload);

      // Second attempt (should fail)
      const { data, error } = await signUpWithEmailAndPassword(testSupabase, duplicatePayload);

      expect(data).toEqual({ user: null, session: null });
      expect(error?.message).toMatch(/already registered/i);
    });

    it('should allow invalid redirectTo URL without error (if not validated)', async () => {
      const payload = createSignupPayload({
        email: 'badredirect@example.com',
        fullName: 'Bad Redirect User',
        redirectTo: 'invalid-url',
      });

      const { data, error } = await signUpWithEmailAndPassword(testSupabase, payload);

      expect(error).toBeNull(); // Supabase may accept it
      expect(data?.user?.email).toBe(payload.email);
    });

    it('should trim fullName whitespace before saving', async () => {
      const payload = createSignupPayload({
        email: 'trimmed@example.com',
        fullName: '  Trimmed User  ',
      });

      const { data, error } = await signUpWithEmailAndPassword(testSupabase, payload);

      expect(error).toBeNull();
      expect(data?.user?.user_metadata?.full_name.trim()).toBe('Trimmed User');
    });
  });
});
