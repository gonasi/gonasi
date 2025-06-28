import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { signInWithEmailAndPassword } from '../../auth';
import { createNewOrganization } from '../../organizations';
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
      await TestCleanupManager.clearTables(['organizations']);

      // log in as user one
      await signInWithEmailAndPassword(testSupabase, {
        email: userOne.email,
        password: userOne.password,
      });
    });

    afterEach(async () => {
      await TestCleanupManager.signOutAllClients();
    });

    describe('New Organization', () => {
      it('should create first organization successfully with launch tier', async () => {
        const result = await createNewOrganization(testSupabase, {
          name: 'Test Organization 1',
          handle: 'test-org-1',
        });

        expect(result.success).toBe(true);
        expect(result.message).toBe('🎉 Organization created successfully!');
        expect(result.data).toBe('test-org-1');

        // Verify the organization was created with correct tier
        const { data: org, error } = await testSupabase
          .from('organizations')
          .select('tier')
          .eq('handle', 'test-org-1')
          .single();

        expect(error).toBe(null);
        expect(org?.tier).toBe('launch');
      });

      it('should create second organization successfully for launch tier user', async () => {
        // Create first organization
        await createNewOrganization(testSupabase, {
          name: 'Test Organization 1',
          handle: 'test-org-1',
        });

        // Create second organization
        const result = await createNewOrganization(testSupabase, {
          name: 'Test Organization 2',
          handle: 'test-org-2',
        });

        expect(result.success).toBe(true);
        expect(result.message).toBe('🎉 Organization created successfully!');
        expect(result.data).toBe('test-org-2');

        // Verify both organizations exist and are launch tier
        const { data: orgs, error } = await testSupabase
          .from('organizations')
          .select('handle, tier')
          .in('handle', ['test-org-1', 'test-org-2']);

        expect(error).toBe(null);
        expect(orgs).toHaveLength(2);
        expect(orgs?.every((org) => org.tier === 'launch')).toBe(true);
      });

      it('should fail to create third organization for launch tier user', async () => {
        // Create first organization
        await createNewOrganization(testSupabase, {
          name: 'Test Organization 1',
          handle: 'test-org-1',
        });

        // Create second organization
        await createNewOrganization(testSupabase, {
          name: 'Test Organization 2',
          handle: 'test-org-2',
        });

        // Attempt to create third organization (should fail)
        const result = await createNewOrganization(testSupabase, {
          name: 'Test Organization 3',
          handle: 'test-org-3',
        });

        expect(result.success).toBe(false);
        expect(result.message).toBe(
          "You've reached the maximum number of organizations for your plan. Please upgrade to create more.",
        );
        expect(result.data).toBe(null);

        // Verify only 2 organizations exist for this user
        const { data: orgs, error } = await testSupabase
          .from('organizations')
          .select('id', { count: 'exact' })
          .eq('owned_by', (await testSupabase.auth.getUser()).data.user?.id);

        expect(error).toBe(null);
        expect(orgs?.length).toBe(2);
      });

      it('should handle duplicate handles gracefully', async () => {
        // Create first organization
        await createNewOrganization(testSupabase, {
          name: 'Test Organization 1',
          handle: 'duplicate-handle',
        });

        // Attempt to create organization with same handle
        const result = await createNewOrganization(testSupabase, {
          name: 'Test Organization 2',
          handle: 'duplicate-handle',
        });

        expect(result.success).toBe(false);
        expect(result.message).toBe(
          'An organization with this handle already exists. Please choose a different handle.',
        );
        expect(result.data).toBe(null);
      });

      it('should handle invalid form data', async () => {
        const result = await createNewOrganization(testSupabase, {
          name: '',
          handle: '',
        });

        expect(result.success).toBe(false);
        expect(result.message).toBe('Handle must be at least 3 characters long.');
        expect(result.data).toBe(null);
      });

      it('should create organizations for different users independently', async () => {
        // Create organization as user one
        const resultUserOne = await createNewOrganization(testSupabase, {
          name: 'User One Org',
          handle: 'user-one-org',
        });

        expect(resultUserOne.success).toBe(true);

        // Switch to user two
        await signInWithEmailAndPassword(testSupabase, {
          email: userTwo.email,
          password: userTwo.password,
        });

        // Create organization as user two
        const resultUserTwo = await createNewOrganization(testSupabase, {
          name: 'User Two Org',
          handle: 'user-two-org',
        });

        expect(resultUserTwo.success).toBe(true);
        expect(resultUserTwo.data).toBe('user-two-org');

        // Verify each user owns their respective organization
        const { data: userOneOrg } = await testSupabase
          .from('organizations')
          .select('owned_by')
          .eq('handle', 'user-one-org')
          .single();

        const { data: userTwoOrg } = await testSupabase
          .from('organizations')
          .select('owned_by')
          .eq('handle', 'user-two-org')
          .single();

        expect(userOneOrg?.owned_by).not.toBe(userTwoOrg?.owned_by);
      });

      it('should verify organizations are properly associated with creator', async () => {
        const result = await createNewOrganization(testSupabase, {
          name: 'Test Ownership',
          handle: 'test-ownership',
        });

        expect(result.success).toBe(true);

        // Verify the organization exists and is owned by the current user
        const { data: org, error } = await testSupabase
          .from('organizations')
          .select('owned_by, created_by, updated_by, tier')
          .eq('handle', 'test-ownership')
          .single();

        expect(error).toBe(null);
        expect(org).toBeDefined();

        // Get current user ID to verify ownership
        const {
          data: { user },
        } = await testSupabase.auth.getUser();
        expect(org?.owned_by).toBe(user?.id);
        expect(org?.created_by).toBe(user?.id);
        expect(org?.updated_by).toBe(user?.id);
        expect(org?.tier).toBe('launch');
      });

      it('should enforce tier limits correctly when checking existing organizations', async () => {
        const userId = (await testSupabase.auth.getUser()).data.user?.id;

        // Create first organization
        await createNewOrganization(testSupabase, {
          name: 'Org 1',
          handle: 'org-1',
        });

        // Verify count is 1
        const { data: orgsAfterFirst } = await testSupabase
          .from('organizations')
          .select('id', { count: 'exact' })
          .eq('owned_by', userId)
          .eq('tier', 'launch');

        expect(orgsAfterFirst?.length).toBe(1);

        // Create second organization
        await createNewOrganization(testSupabase, {
          name: 'Org 2',
          handle: 'org-2',
        });

        // Verify count is 2
        const { data: orgsAfterSecond } = await testSupabase
          .from('organizations')
          .select('id', { count: 'exact' })
          .eq('owned_by', userId)
          .eq('tier', 'launch');

        expect(orgsAfterSecond?.length).toBe(2);

        // Third should fail
        const thirdResult = await createNewOrganization(testSupabase, {
          name: 'Org 3',
          handle: 'org-3',
        });

        expect(thirdResult.success).toBe(false);
        expect(thirdResult.message).toContain('reached the maximum number');
      });

      it('should validate handle constraints', async () => {
        // Test handle too short
        const shortHandleResult = await createNewOrganization(testSupabase, {
          name: 'Test Organization',
          handle: 'ab', // Less than 3 characters
        });

        expect(shortHandleResult.success).toBe(false);

        // Test handle with uppercase (should be rejected by constraint)
        const { error } = await testSupabase.from('organizations').insert({
          name: 'Test Organization',
          handle: 'TestHandle', // uppercase, should be rejected
        });

        expect(error).not.toBeNull(); // the insert should fail
      });

      it('should create organization with all audit fields populated', async () => {
        const result = await createNewOrganization(testSupabase, {
          name: 'Audit Test Org',
          handle: 'audit-test-org',
        });

        expect(result.success).toBe(true);

        // Verify all audit fields are properly populated
        const { data: org, error } = await testSupabase
          .from('organizations')
          .select('created_at, updated_at, created_by, owned_by, updated_by')
          .eq('handle', 'audit-test-org')
          .single();

        expect(error).toBe(null);
        expect(org?.created_at).toBeDefined();
        expect(org?.updated_at).toBeDefined();
        expect(org?.created_by).toBeDefined();
        expect(org?.owned_by).toBeDefined();
        expect(org?.updated_by).toBeDefined();

        // Verify created_at and updated_at are recent (within last minute)
        const createdAt = new Date(org!.created_at);
        const updatedAt = new Date(org!.updated_at);
        const now = new Date();
        const oneMinuteAgo = new Date(now.getTime() - 60000);

        expect(createdAt.getTime()).toBeGreaterThan(oneMinuteAgo.getTime());
        expect(updatedAt.getTime()).toBeGreaterThan(oneMinuteAgo.getTime());
      });
    });
  });
});
