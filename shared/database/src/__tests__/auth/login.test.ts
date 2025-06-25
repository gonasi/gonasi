import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { getUserRole, signInWithEmailAndPassword, signUpWithEmailAndPassword } from '../../auth';
import { TEST_USERS } from '../fixtures/test-data';
import { setupTestDatabase, testSupabase } from '../setup/test-helpers';
import { getTestUser, SU_EMAIL, SU_PASSWORD } from '../utils/getTestUser';

describe('Login', () => {
  setupTestDatabase();

  describe('Login Gonasi Users', () => {
    beforeAll(async () => {
      // Sign up all users from test data before running tests
      for (const testUser of TEST_USERS) {
        if (!testUser.email || !testUser.password) {
          console.warn(`[beforeAll] Missing credentials for: ${JSON.stringify(testUser)}`);
          continue;
        }

        const { error } = await signUpWithEmailAndPassword(testSupabase, {
          email: testUser.email,
          password: testUser.password,
          fullName: testUser.fullName,
        });

        if (error) {
          console.warn(`[beforeAll] Failed to sign up user ${testUser.email}: ${error.message}`);
        }
      }
    });

    afterAll(async () => {
      await testSupabase.auth.signOut();
    });

    it('should log in with correct credentials', async () => {
      const user = getTestUser('user', 'user1');

      const { data, error } = await signInWithEmailAndPassword(testSupabase, {
        email: user.email,
        password: user.password,
      });

      expect(error).toBeNull();
      expect(data?.user?.email).toBe(user.email);
    });

    it('should fail login with wrong password', async () => {
      const user = getTestUser('user', 'user1');

      const { data, error } = await signInWithEmailAndPassword(testSupabase, {
        email: user.email,
        password: 'WrongPassword!',
      });

      expect(data).toEqual({ user: null, session: null });
      expect(error?.message).toMatch(/invalid/i);
    });

    it('should fail login with non-existent email', async () => {
      const { data, error } = await signInWithEmailAndPassword(testSupabase, {
        email: 'nonexistent@example.com',
        password: 'TestPassword123!',
      });

      expect(data).toEqual({ user: null, session: null });
      expect(error?.message).toMatch(/invalid/i);
    });

    it('should fail login with missing email', async () => {
      const { data, error } = await signInWithEmailAndPassword(testSupabase, {
        email: undefined as any,
        password: 'somepass',
      });

      expect(data).toEqual({ user: null, session: null });
      expect(error).not.toBeNull();
    });

    it('should fail login with missing password', async () => {
      const { data, error } = await signInWithEmailAndPassword(testSupabase, {
        email: 'some@email.com',
        password: undefined as any,
      });

      expect(data).toEqual({ user: null, session: null });
      expect(error).not.toBeNull();
    });

    it('should return role "user" for normal user', async () => {
      const user = getTestUser('user', 'user1');

      const { data, error } = await signInWithEmailAndPassword(testSupabase, {
        email: user.email,
        password: user.password,
      });

      expect(error).toBeNull();
      expect(data?.user?.email).toBe(user.email);

      const role = await getUserRole(testSupabase);
      expect(role).toBe('user');
    });

    it('should return role "go_staff" for staff user', async () => {
      const staff = getTestUser('staff', 'staff1');

      const { data, error } = await signInWithEmailAndPassword(testSupabase, {
        email: staff.email,
        password: staff.password,
      });

      expect(error).toBeNull();
      expect(data?.user?.email).toBe(staff.email);

      const role = await getUserRole(testSupabase);
      expect(role).toBe('go_staff');
    });

    it('should return role "go_su" for super user', async () => {
      const { data, error } = await signInWithEmailAndPassword(testSupabase, {
        email: SU_EMAIL,
        password: SU_PASSWORD,
      });

      expect(error).toBeNull();
      expect(data?.user?.email).toBe(SU_EMAIL);

      const role = await getUserRole(testSupabase);
      expect(role).toBe('go_su');
    });
  });
});
