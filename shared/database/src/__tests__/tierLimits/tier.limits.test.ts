import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { signInWithEmailAndPassword, signUpWithEmailAndPassword } from '../../auth';
import { SU_EMAIL, SU_PASSWORD } from '../fixtures/test-data';
import {
  enterpriseTierLimits,
  launchTierLimits,
  scaleTierLimits,
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
        expect(data?.max_organizations_per_user).toBe(3);
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
        expect(data?.max_organizations_per_user).toBe(3);
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
          .insert([launchTierLimits, scaleTierLimits, enterpriseTierLimits])
          .select();

        expect(error).toBeNull();
        expect(data).toBeInstanceOf(Array);
        expect(data?.length).toBe(3);

        const tiers = data?.map((limit) => limit.tier) || [];
        expect(tiers).toContain('launch');
        expect(tiers).toContain('scale');
        expect(tiers).toContain('enterprise');
      });
    });

    describe('Authorized update policy', () => {
      beforeEach(async () => {
        // Insert test data as admin for update tests
        await signInWithEmailAndPassword(testSupabase, {
          email: adminUser.email,
          password: adminUser.password,
        });

        await testSupabase.from('tier_limits').insert([launchTierLimits, scaleTierLimits]);
      });

      it('should allow authorized users to update tier limits', async () => {
        // Already signed in as admin from beforeEach
        const { data, error } = await testSupabase
          .from('tier_limits')
          .update({
            max_organizations_per_user: 5,
            ai_tools_enabled: true,
            platform_fee_percentage: 12.5,
          })
          .eq('tier', 'launch')
          .select()
          .single();

        expect(error).toBeNull();
        expect(data?.tier).toBe('launch');
        expect(data?.max_organizations_per_user).toBe(5);
        expect(data?.ai_tools_enabled).toBe(true);
        expect(data?.platform_fee_percentage).toBeCloseTo(12.5, 2); // 2 = number of decimal places
      });

      it('should prevent unauthorized users from updating tier limits', async () => {
        // Sign in as regular user
        await TestCleanupManager.signOutAllClients();
        await signInWithEmailAndPassword(testSupabase, {
          email: userOne.email,
          password: userOne.password,
        });

        const { data, error } = await testSupabase
          .from('tier_limits')
          .update({
            max_organizations_per_user: 999,
            platform_fee_percentage: 0.0,
          })
          .eq('tier', 'launch')
          .select();

        expect(data).toEqual([]); // Should return empty array due to RLS
        expect(error).toBeNull(); // RLS doesn't throw error, just filters results

        // Verify data wasn't actually updated
        const { data: verifyData } = await testSupabase
          .from('tier_limits')
          .select('*')
          .eq('tier', 'launch')
          .single();

        expect(verifyData?.max_organizations_per_user).toBe(3); // Original value
        expect(verifyData?.platform_fee_percentage).toBeCloseTo(15, 2); // Original value
      });

      it('should prevent anonymous users from updating tier limits', async () => {
        await TestCleanupManager.signOutAllClients();

        const { data, error } = await testSupabase
          .from('tier_limits')
          .update({
            max_organizations_per_user: 999,
          })
          .eq('tier', 'launch')
          .select();

        expect(data).toEqual([]); // Should return empty array due to RLS
        expect(error).toBeNull(); // RLS doesn't throw error, just filters results
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

        await testSupabase
          .from('tier_limits')
          .insert([launchTierLimits, scaleTierLimits, enterpriseTierLimits]);
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

        // Verify only enterprise tier remains
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
          .insert([launchTierLimits, scaleTierLimits, enterpriseTierLimits]);
      });

      it('should allow all users to read tier limits but only authorized users to modify', async () => {
        // Test read access as regular user
        await TestCleanupManager.signOutAllClients();
        await signInWithEmailAndPassword(testSupabase, {
          email: userOne.email,
          password: userOne.password,
        });

        // Should be able to read all tier limits
        const { data: readData, error: readError } = await testSupabase
          .from('tier_limits')
          .select('*');

        expect(readError).toBeNull();
        expect(readData?.length).toBe(3);

        // Should NOT be able to update
        const { data: updateData, error: updateError } = await testSupabase
          .from('tier_limits')
          .update({ max_organizations_per_user: 999 })
          .eq('tier', 'launch')
          .select();

        expect(updateData).toEqual([]);
        expect(updateError).toBeNull();

        // Should NOT be able to delete
        const { data: deleteData, error: deleteError } = await testSupabase
          .from('tier_limits')
          .delete()
          .eq('tier', 'launch')
          .select();

        expect(deleteData).toEqual([]);
        expect(deleteError).toBeNull();

        // Should NOT be able to insert
        const { data: insertData, error: insertError } = await testSupabase
          .from('tier_limits')
          .insert({
            tier: 'impact',
            max_organizations_per_user: 7,
            storage_limit_mb_per_org: 5000,
            max_members_per_org: 3,
            max_collaborators_per_course: 10,
            max_free_courses_per_org: 4,
            max_students_per_course: 100,
            ai_tools_enabled: true,
            ai_usage_limit_monthly: 500,
            custom_domains_enabled: false,
            max_custom_domains: null,
            analytics_level: 'intermediate',
            support_level: 'email',
            platform_fee_percentage: 12.0,
            white_label_enabled: false,
          })
          .select();

        expect(insertData).toBeNull();
        expect(insertError).not.toBeNull();
      });

      it('should maintain data consistency across authorization levels', async () => {
        // Admin makes changes
        await signInWithEmailAndPassword(testSupabase, {
          email: adminUser.email,
          password: adminUser.password,
        });

        await testSupabase
          .from('tier_limits')
          .update({ max_organizations_per_user: 15 })
          .eq('tier', 'scale');

        // Regular user should see the updated data
        await TestCleanupManager.signOutAllClients();
        await signInWithEmailAndPassword(testSupabase, {
          email: userOne.email,
          password: userOne.password,
        });

        const { data } = await testSupabase
          .from('tier_limits')
          .select('*')
          .eq('tier', 'scale')
          .single();

        expect(data?.max_organizations_per_user).toBe(15);

        // Anonymous user should also see the updated data
        await TestCleanupManager.signOutAllClients();

        const { data: anonData } = await testSupabase
          .from('tier_limits')
          .select('*')
          .eq('tier', 'scale')
          .single();

        expect(anonData?.max_organizations_per_user).toBe(15);
      });
    });

    describe('Tier limits data validation', () => {
      it('should preserve all tier limit fields correctly', async () => {
        const { data, error } = await testSupabase
          .from('tier_limits')
          .insert(enterpriseTierLimits)
          .select()
          .single();

        expect(error).toBeNull();
        expect(data?.tier).toBe('enterprise');
        expect(data?.max_organizations_per_user).toBe(-1);
        expect(data?.storage_limit_mb_per_org).toBe(100000);
        expect(data?.max_members_per_org).toBe(20);
        expect(data?.max_collaborators_per_course).toBe(50);
        expect(data?.max_free_courses_per_org).toBe(10);
        expect(data?.max_students_per_course).toBe(1000);
        expect(data?.ai_tools_enabled).toBe(true);
        expect(data?.ai_usage_limit_monthly).toBeNull();
        expect(data?.custom_domains_enabled).toBe(true);
        expect(data?.max_custom_domains).toBe(10);
        expect(data?.analytics_level).toBe('enterprise');
        expect(data?.support_level).toBe('dedicated');
        expect(data?.platform_fee_percentage).toBeCloseTo(5, 2);
        expect(data?.white_label_enabled).toBe(true);
      });

      it('should handle null values correctly', async () => {
        await signInWithEmailAndPassword(testSupabase, {
          email: adminUser.email,
          password: adminUser.password,
        });

        const tierWithNulls = {
          ...launchTierLimits,
          tier: 'impact',
          ai_usage_limit_monthly: null,
          max_custom_domains: null,
        };

        const { data, error } = await testSupabase
          .from('tier_limits')
          .insert(tierWithNulls)
          .select()
          .single();

        expect(error).toBeNull();
        expect(data?.ai_usage_limit_monthly).toBeNull();
        expect(data?.max_custom_domains).toBeNull();
      });
    });
  });
});
