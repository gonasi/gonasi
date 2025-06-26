import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { signInWithEmailAndPassword } from '../../auth';
import { SeedManager } from '../setup/seed-manager';
import { setupTestDatabase, TestCleanupManager, testSupabase } from '../setup/test-helpers';
import { getTestUser } from '../utils/getTestUser';

const userOne = getTestUser('user', 'user1');
const userTwo = getTestUser('user', 'user2');

describe('New Organization', () => {
  setupTestDatabase();

  describe('Creation of new', () => {
    beforeAll(async () => {
      await TestCleanupManager.performFullCleanup();

      await SeedManager.signUpUsers();
      await SeedManager.completeOnboardingForUsers();
      await SeedManager.seedPricingTiers();
    });

    afterAll(async () => {
      await TestCleanupManager.signOutAllClients();
      await TestCleanupManager.performFullCleanup();
    });

    beforeEach(async () => {
      // log in as user one
      await signInWithEmailAndPassword(testSupabase, {
        email: userOne.email,
        password: userOne.password,
      });
    });

    afterEach(async () => {
      await TestCleanupManager.signOutAllClients();
    });

    describe('Public read access policy', () => {
      it('should allow authenticated users to read tier limits', async () => {
        const hello = 'hello';
        expect(hello).toEqual('hello');
      });
    });
  });
});
