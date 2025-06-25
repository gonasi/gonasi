import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { getUserRole, signInWithEmailAndPassword, signUpWithEmailAndPassword } from '../../auth';
import { TEST_USERS } from '../fixtures/test-data';
import { setupTestDatabase, signOutTestUsers, testSupabase } from '../setup/test-helpers';
import { getTestUser, SU_EMAIL, SU_PASSWORD } from '../utils/getTestUser';

describe('Login', () => {
  // beforeAll & afterAll
  setupTestDatabase();

  // sign out all test users
  signOutTestUsers();

  describe('Login Gonasi Users', () => {
    beforeAll(async () => {
      for (const user of TEST_USERS) {
        if (!user.email || !user.password) {
          console.warn(`[beforeAll] Missing email or password for ${JSON.stringify(user)}`);
          continue;
        }

        const { error } = await signUpWithEmailAndPassword(testSupabase, {
          email: user.email,
          password: user.password,
          fullName: user.fullName,
        });

        if (error) {
          console.warn(`[beforeAll] Failed to sign up user ${user.email}: ${error.message}`);
        }
      }
    });

    afterEach(async () => {
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

      expect(data).to.deep.equal({ user: null, session: null });
      expect(error?.message).toMatch(/invalid/i);
    });

    it('should fail login with non-existent email', async () => {
      const { data, error } = await signInWithEmailAndPassword(testSupabase, {
        email: 'nonexistent@example.com',
        password: 'TestPassword123!',
      });

      expect(data).to.deep.equal({ user: null, session: null });
      expect(error?.message).toMatch(/invalid/i);
    });

    it('should fail login with missing email', async () => {
      const payload = { email: undefined as any, password: 'somepass' };

      const { data, error } = await signInWithEmailAndPassword(testSupabase, payload);

      expect(data).to.deep.equal({ user: null, session: null });
      expect(error).not.toBeNull();
    });

    it('should fail login with missing password', async () => {
      const payload = { email: 'some@email.com', password: undefined as any };

      const { data, error } = await signInWithEmailAndPassword(testSupabase, payload);

      expect(data).to.deep.equal({ user: null, session: null });
      expect(error).not.toBeNull();
    });

    it('should get user role as user', async () => {
      const user = getTestUser('user', 'user1');

      const { data, error } = await signInWithEmailAndPassword(testSupabase, {
        email: user.email,
        password: user.password,
      });

      expect(error).toBeNull();
      expect(data?.user?.email).toBe(user.email);

      const userRole = await getUserRole(testSupabase);
      expect(userRole).toBe('user');
    });

    it('should get user role as go_staff', async () => {
      const staff = getTestUser('staff', 'staff1');

      const { data, error } = await signInWithEmailAndPassword(testSupabase, {
        email: staff.email,
        password: staff.password,
      });

      expect(data?.user?.email).toBe(staff.email);
      expect(error).toBeNull();

      const userRole = await getUserRole(testSupabase);
      expect(userRole).toBe('go_staff');
    });

    it('should get user role as go_su', async () => {
      const { data, error } = await signInWithEmailAndPassword(testSupabase, {
        email: SU_EMAIL,
        password: SU_PASSWORD,
      });

      expect(data?.user?.email).toBe(SU_EMAIL);
      expect(error).toBeNull();

      const userRole = await getUserRole(testSupabase);
      expect(userRole).toBe('go_su');
    });
  });
});
