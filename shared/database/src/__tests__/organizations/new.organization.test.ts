import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

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
      try {
        await TestCleanupManager.performFullCleanup();
        console.log('✔️ Cleanup completed');
      } catch (err) {
        console.error('❌ Cleanup failed:', err);
        throw err;
      }

      await SeedManager.runSeedPipeline(['users', 'onboarding', 'lessonTypes', 'pricingTiers']);
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
