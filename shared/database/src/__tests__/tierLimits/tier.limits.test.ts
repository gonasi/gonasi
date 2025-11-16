import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { signInWithEmailAndPassword, signUpWithEmailAndPassword } from '../../auth';
import { SU_EMAIL, SU_PASSWORD } from '../fixtures/test-data';
import {
  impactTierLimits,
  launchTierLimits,
  scaleTierLimits,
  tempTierLimits,
} from '../seeds/seedOrganizationPricingTiers';
import { setupTestDatabase, TestCleanupManager, testSupabase } from '../setup/test-helpers';
import { getTestUser } from '../utils/getTestUser';

const userOne = getTestUser('user', 'user1');
const userTwo = getTestUser('user', 'user2');
const adminUser = {
  email: SU_EMAIL,
  password: SU_PASSWORD,
  fullName: 'Super User',
  username: 'superuser',
};

const TEST_USERS = [userOne, userTwo, adminUser];

describe('Tier Limits RLS Policies', () => {
  setupTestDatabase();

  describe('Row Level Security', () => {
    beforeAll(async () => {
      await TestCleanupManager.performFullCleanup();

      // Sign up each test user
      for (const testUser of TEST_USERS) {
        if (!testUser.email || !testUser.password) {
          console.warn(`[beforeAll] Missing email or password for ${JSON.stringify(testUser)}`);
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
      await TestCleanupManager.signOutAllClients();
      await TestCleanupManager.performFullCleanup();
    });

    beforeEach(async () => {
      await TestCleanupManager.clearTables(['tier_limits']);

      // First, insert some test data as admin
      await signInWithEmailAndPassword(testSupabase, {
        email: adminUser.email,
        password: adminUser.password,
      });
    });

    afterEach(async () => {
      await TestCleanupManager.signOutAllClients();
      await TestCleanupManager.clearTables(['tier_limits']);
    });

    describe('Public read access policy', () => {
      it('should allow authenticated users to read tier limits', async () => {
        const { error: insertTierError } = await testSupabase
          .from('tier_limits')
          .insert([launchTierLimits, scaleTierLimits]);

        expect(insertTierError).toBeNull();
        // Sign out
        await TestCleanupManager.signOutAllClients();

        // Sign in as regular user
        await signInWithEmailAndPassword(testSupabase, {
          email: userOne.email,
          password: userOne.password,
        });

        // Should be able to read all tier limits
        const { data, error } = await testSupabase.from('tier_limits').select('*');

        expect(error).toBeNull();
        expect(data).toBeInstanceOf(Array);
        expect(data?.length).toEqual(2);

        // Should include both tiers
        const tiers = data?.map((limit) => limit.tier) || [];
        expect(tiers).toContain('launch');
        expect(tiers).toContain('scale');
      });

      it('should allow anonymous users to read tier limits', async () => {
        await testSupabase.from('tier_limits').insert([launchTierLimits]);

        // Sign out to become anonymous
        await TestCleanupManager.signOutAllClients();

        const {
          data: { session },
        } = await testSupabase.auth.getSession();
        expect(session).toBeNull(); // Confirm anonymous

        const { data, error } = await testSupabase.from('tier_limits').select('*');

        expect(error).toBeNull();
        expect(Array.isArray(data)).toBe(true);
        expect(data?.length).toBeGreaterThan(0);
        expect(data?.[0]?.tier).toBe('launch');
      });

      it('should allow reading specific tier limits by tier', async () => {
        await testSupabase.from('tier_limits').insert([launchTierLimits, scaleTierLimits]);

        // Sign out and try to read specific tier as anonymous
        await TestCleanupManager.signOutAllClients();

        const { data, error } = await testSupabase
          .from('tier_limits')
          .select('*')
          .eq('tier', 'launch')
          .single();

        expect(error).toBeNull();
        expect(data?.tier).toBe('launch');
        expect(data?.analytics_level).toBe('basic');
      });
    });

    describe('Authorized create policy', () => {
      it('should allow authorized users to insert tier limits', async () => {
        const { data, error } = await testSupabase
          .from('tier_limits')
          .insert(launchTierLimits)
          .select()
          .single();

        expect(error).toBeNull();
        expect(data?.tier).toBe('launch');
        expect(data?.ai_tools_enabled).toBe(false);
      });

      it('should prevent unauthorized users from inserting tier limits', async () => {
        // Sign in as regular user (no pricing_tier.crud authorization)
        await signInWithEmailAndPassword(testSupabase, {
          email: userOne.email,
          password: userOne.password,
        });

        const { data, error } = await testSupabase
          .from('tier_limits')
          .insert(launchTierLimits)
          .select();

        expect(data).toBeNull();
        expect(error).not.toBeNull();
        expect(error?.message).toMatch(/policy|permission/i);
      });

      it('should prevent anonymous users from inserting tier limits', async () => {
        await TestCleanupManager.signOutAllClients();

        const {
          data: { session },
        } = await testSupabase.auth.getSession();
        expect(session).toBeNull(); // Confirm anonymous

        const { data, error } = await testSupabase
          .from('tier_limits')
          .insert(launchTierLimits)
          .select();

        expect(data).toBeNull();
        expect(error).not.toBeNull();
        expect(error?.message).toMatch(/policy|permission/i);
      });

      it('should allow inserting multiple tier limits at once', async () => {
        // Sign in as admin user
        await signInWithEmailAndPassword(testSupabase, {
          email: adminUser.email,
          password: adminUser.password,
        });

        const { data, error } = await testSupabase
          .from('tier_limits')
          .insert([tempTierLimits, launchTierLimits, scaleTierLimits])
          .select();

        expect(error).toBeNull();
        expect(data).toBeInstanceOf(Array);
        expect(data?.length).toBe(3);

        const tiers = data?.map((limit) => limit.tier) || [];
        expect(tiers).toContain('launch');
        expect(tiers).toContain('scale');
      });
    });

    describe('Authorized update policy', () => {
      beforeEach(async () => {
        // Insert test data as admin for update tests
        await signInWithEmailAndPassword(testSupabase, {
          email: adminUser.email,
          password: adminUser.password,
        });

        await testSupabase
          .from('tier_limits')
          .insert([tempTierLimits, launchTierLimits, scaleTierLimits]);
      });

      it('should allow updating multiple tier limits at once', async () => {
        // Sign in as admin user
        await signInWithEmailAndPassword(testSupabase, {
          email: adminUser.email,
          password: adminUser.password,
        });

        const { data, error } = await testSupabase
          .from('tier_limits')
          .update({
            support_level: 'priority',
          })
          .in('tier', ['launch', 'scale'])
          .select();

        expect(error).toBeNull();
        expect(data).toBeInstanceOf(Array);
        expect(data?.length).toBe(2);
        expect(data?.every((limit) => limit.support_level === 'priority')).toBe(true);
      });
    });

    describe('Authorized delete policy', () => {
      beforeEach(async () => {
        // Insert test data as admin for delete tests
        await signInWithEmailAndPassword(testSupabase, {
          email: adminUser.email,
          password: adminUser.password,
        });

        await testSupabase.from('tier_limits').insert([launchTierLimits, scaleTierLimits]);
      });

      it('should allow authorized users to delete tier limits', async () => {
        // Already signed in as admin from beforeEach
        const { data, error } = await testSupabase
          .from('tier_limits')
          .delete()
          .eq('tier', 'launch')
          .select();

        expect(error).toBeNull();
        expect(data).toBeInstanceOf(Array);
        expect(data?.length).toBe(1);
        expect(data?.[0]?.tier).toBe('launch');

        // Verify it's actually deleted
        const { data: verifyData } = await testSupabase
          .from('tier_limits')
          .select('*')
          .eq('tier', 'launch');

        expect(verifyData?.length).toBe(0);
      });

      it('should prevent unauthorized users from deleting tier limits', async () => {
        // Sign in as regular user
        await TestCleanupManager.signOutAllClients();
        await signInWithEmailAndPassword(testSupabase, {
          email: userOne.email,
          password: userOne.password,
        });

        const { data, error } = await testSupabase
          .from('tier_limits')
          .delete()
          .eq('tier', 'launch')
          .select();

        expect(data).toEqual([]); // Should return empty array due to RLS
        expect(error).toBeNull(); // RLS doesn't throw error, just filters results

        // Verify data still exists
        const { data: verifyData } = await testSupabase
          .from('tier_limits')
          .select('*')
          .eq('tier', 'launch')
          .single();

        expect(verifyData?.tier).toBe('launch');
      });

      it('should prevent anonymous users from deleting tier limits', async () => {
        await TestCleanupManager.signOutAllClients();

        const { data, error } = await testSupabase
          .from('tier_limits')
          .delete()
          .eq('tier', 'launch')
          .select();

        expect(data).toEqual([]); // Should return empty array due to RLS
        expect(error).toBeNull(); // RLS doesn't throw error, just filters results

        // Verify data still exists (need to sign in to read)
        await signInWithEmailAndPassword(testSupabase, {
          email: userOne.email,
          password: userOne.password,
        });

        const { data: verifyData } = await testSupabase
          .from('tier_limits')
          .select('*')
          .eq('tier', 'launch')
          .single();

        expect(verifyData?.tier).toBe('launch');
      });

      it('should allow deleting multiple tier limits at once', async () => {
        // Sign in as admin user
        await signInWithEmailAndPassword(testSupabase, {
          email: adminUser.email,
          password: adminUser.password,
        });

        const { data, error } = await testSupabase
          .from('tier_limits')
          .delete()
          .in('tier', ['launch', 'scale'])
          .select();

        expect(error).toBeNull();
        expect(data).toBeInstanceOf(Array);
        expect(data?.length).toBe(2);

        const deletedTiers = data?.map((limit) => limit.tier) || [];
        expect(deletedTiers).toContain('launch');
        expect(deletedTiers).toContain('scale');

        // Verify only  tier remains
        const { data: remainingData } = await testSupabase.from('tier_limits').select('*');

        expect(remainingData?.length).toBe(1);
        expect(remainingData?.[0]?.tier).toBe('enterprise');
      });
    });

    describe('Cross-user access patterns', () => {
      beforeEach(async () => {
        // Insert test data as admin
        await signInWithEmailAndPassword(testSupabase, {
          email: adminUser.email,
          password: adminUser.password,
        });

        await testSupabase
          .from('tier_limits')
          .insert([tempTierLimits, launchTierLimits, scaleTierLimits, impactTierLimits]);
      });
    });
  });
});
