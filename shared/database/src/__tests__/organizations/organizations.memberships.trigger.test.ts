import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { signInWithEmailAndPassword } from '../../auth';
import { createNewOrganization } from '../../organizations';
import { SeedManager } from '../setup/seed-manager';
import { setupTestDatabase, TestCleanupManager, testSupabase } from '../setup/test-helpers';
import { getTestUser } from '../utils/getTestUser';

const userOne = getTestUser('user', 'user1');
const userTwo = getTestUser('user', 'user2');

describe('Organization Owner Trigger Tests', () => {
  setupTestDatabase();

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
    await TestCleanupManager.clearTables(['organizations', 'organization_members']);

    // Log in as user one
    await signInWithEmailAndPassword(testSupabase, {
      email: userOne.email,
      password: userOne.password,
    });
  });

  afterEach(async () => {
    await TestCleanupManager.signOutAllClients();
  });

  describe('INSERT Trigger - add_or_update_owner_in_organization_members', () => {
    it('should automatically add owner to organization_members on organization creation', async () => {
      const result = await createNewOrganization(testSupabase, {
        name: 'Trigger Test Org',
        handle: 'trigger-test-org',
      });

      expect(result.success).toBe(true);

      // Get the current user ID
      const {
        data: { user },
      } = await testSupabase.auth.getUser();

      // Get the organization ID
      const { data: org } = await testSupabase
        .from('organizations')
        .select('id')
        .eq('handle', 'trigger-test-org')
        .single();

      // Verify the owner was automatically added to organization_members
      const { data: membership, error } = await testSupabase
        .from('organization_members')
        .select('user_id, role, invited_by, organization_id')
        .eq('organization_id', org?.id)
        .eq('user_id', user?.id)
        .single();

      expect(error).toBe(null);
      expect(membership).toBeDefined();
      expect(membership?.user_id).toBe(user?.id);
      expect(membership?.role).toBe('owner');
      expect(membership?.invited_by).toBe(user?.id);
      expect(membership?.organization_id).toBe(org?.id);
    });

    it('should handle trigger when organization is created via direct database insert', async () => {
      const {
        data: { user },
      } = await testSupabase.auth.getUser();

      // Insert organization directly into database to test trigger
      const { data: org, error: insertError } = await testSupabase
        .from('organizations')
        .insert({
          name: 'Direct Insert Org',
          handle: 'direct-insert-org',
          owned_by: user?.id,
          created_by: user?.id,
          updated_by: user?.id,
          tier: 'launch',
        })
        .select('id')
        .single();

      expect(insertError).toBe(null);
      expect(org).toBeDefined();

      // Verify trigger fired and added owner to organization_members
      const { data: membership, error: membershipError } = await testSupabase
        .from('organization_members')
        .select('user_id, role, invited_by, organization_id')
        .eq('organization_id', org?.id)
        .eq('user_id', user?.id)
        .single();

      expect(membershipError).toBe(null);
      expect(membership?.user_id).toBe(user?.id);
      expect(membership?.role).toBe('owner');
      expect(membership?.invited_by).toBe(user?.id);
      expect(membership?.organization_id).toBe(org?.id);
    });

    it('should ensure only one owner exists per organization', async () => {
      const {
        data: { user },
      } = await testSupabase.auth.getUser();

      // Create organization
      const result = await createNewOrganization(testSupabase, {
        name: 'Single Owner Test Org',
        handle: 'single-owner-test-org',
      });

      expect(result.success).toBe(true);

      // Get organization ID
      const { data: org } = await testSupabase
        .from('organizations')
        .select('id')
        .eq('handle', 'single-owner-test-org')
        .single();

      // Verify exactly one owner membership exists
      const { data: ownerMemberships } = await testSupabase
        .from('organization_members')
        .select('id', { count: 'exact' })
        .eq('organization_id', org?.id)
        .eq('role', 'owner');

      expect(ownerMemberships?.length).toBe(1);
    });

    it('should not add membership when owned_by is null', async () => {
      const {
        data: { user },
      } = await testSupabase.auth.getUser();

      // Try to insert organization with null owned_by (if your schema allows it)
      const { data: org, error: insertError } = await testSupabase
        .from('organizations')
        .insert({
          name: 'Null Owner Org',
          handle: 'null-owner-org',
          owned_by: null,
          created_by: user?.id,
          updated_by: user?.id,
          tier: 'launch',
        })
        .select('id')
        .single();

      // If your schema allows null owned_by, test that no membership is created
      if (!insertError) {
        const { data: memberships } = await testSupabase
          .from('organization_members')
          .select('id')
          .eq('organization_id', org?.id);

        expect(memberships?.length).toBe(0);
      }
    });
  });

  // describe('UPDATE Trigger - Ownership Transfer', () => {
  //   it('should replace old owner with new owner on ownership transfer', async () => {
  //     // Create organization as user one
  //     const result = await createNewOrganization(testSupabase, {
  //       name: 'Transfer Test Org',
  //       handle: 'transfer-test-org',
  //     });

  //     expect(result.success).toBe(true);

  //     const userOneId = (await testSupabase.auth.getUser()).data.user?.id;

  //     // Get organization
  //     const { data: org } = await testSupabase
  //       .from('organizations')
  //       .select('id')
  //       .eq('handle', 'transfer-test-org')
  //       .single();

  //     // Verify user one is initially the owner
  //     const { data: initialMembership } = await testSupabase
  //       .from('organization_members')
  //       .select('user_id, role')
  //       .eq('organization_id', org?.id)
  //       .eq('role', 'owner')
  //       .single();

  //     expect(initialMembership?.user_id).toBe(userOneId);

  //     // Add userTwo as admin member (so ownership transfer is allowed)
  //     const { error: addAdminError } = await testSupabase.from('organization_members').insert({
  //       organization_id: org?.id,
  //       user_id: userTwoId,
  //       role: 'admin',
  //       invited_by: userOneId,
  //     });

  //     expect(addAdminError).toBe(null);

  //     // Switch to user two to get their ID
  //     await signInWithEmailAndPassword(testSupabase, {
  //       email: userTwo.email,
  //       password: userTwo.password,
  //     });

  //     const userTwoId = (await testSupabase.auth.getUser()).data.user?.id;

  //     // Switch back to user one for the transfer
  //     await signInWithEmailAndPassword(testSupabase, {
  //       email: userOne.email,
  //       password: userOne.password,
  //     });

  //     // Transfer ownership to user two
  //     const { error: transferError } = await testSupabase
  //       .from('organizations')
  //       .update({
  //         owned_by: userTwoId,
  //         updated_by: userOneId,
  //       })
  //       .eq('id', org?.id);

  //     expect(transferError).toBe(null);

  //     // Verify user two is now the only owner
  //     const { data: newOwnerMembership, error: newOwnerError } = await testSupabase
  //       .from('organization_members')
  //       .select('user_id, role, invited_by')
  //       .eq('organization_id', org?.id)
  //       .eq('role', 'owner')
  //       .single();

  //     expect(newOwnerError).toBe(null);
  //     expect(newOwnerMembership?.user_id).toBe(userTwoId);
  //     expect(newOwnerMembership?.role).toBe('owner');
  //     expect(newOwnerMembership?.invited_by).toBe(userTwoId);

  //     // Verify user one is no longer an owner
  //     const { data: oldOwnerCheck } = await testSupabase
  //       .from('organization_members')
  //       .select('user_id')
  //       .eq('organization_id', org?.id)
  //       .eq('user_id', userOneId)
  //       .eq('role', 'owner');

  //     expect(oldOwnerCheck?.length).toBe(0);

  //     // Verify exactly one owner exists
  //     const { data: allOwners } = await testSupabase
  //       .from('organization_members')
  //       .select('id', { count: 'exact' })
  //       .eq('organization_id', org?.id)
  //       .eq('role', 'owner');

  //     expect(allOwners?.length).toBe(1);
  //   });

  //   it('should handle ownership transfer back to original owner', async () => {
  //     // Create organization as user one
  //     const result = await createNewOrganization(testSupabase, {
  //       name: 'Round Trip Test Org',
  //       handle: 'round-trip-test-org',
  //     });

  //     expect(result.success).toBe(true);

  //     const userOneId = (await testSupabase.auth.getUser()).data.user?.id;

  //     // Switch to user two to get their ID
  //     await signInWithEmailAndPassword(testSupabase, {
  //       email: userTwo.email,
  //       password: userTwo.password,
  //     });

  //     const userTwoId = (await testSupabase.auth.getUser()).data.user?.id;

  //     // Switch back to user one
  //     await signInWithEmailAndPassword(testSupabase, {
  //       email: userOne.email,
  //       password: userOne.password,
  //     });

  //     // Get organization
  //     const { data: org } = await testSupabase
  //       .from('organizations')
  //       .select('id')
  //       .eq('handle', 'round-trip-test-org')
  //       .single();

  //     // Transfer to user two
  //     await testSupabase.from('organizations').update({ owned_by: userTwoId }).eq('id', org?.id);

  //     // Transfer back to user one
  //     await testSupabase.from('organizations').update({ owned_by: userOneId }).eq('id', org?.id);

  //     // Verify user one is the owner again
  //     const { data: finalOwner } = await testSupabase
  //       .from('organization_members')
  //       .select('user_id, role')
  //       .eq('organization_id', org?.id)
  //       .eq('role', 'owner')
  //       .single();

  //     expect(finalOwner?.user_id).toBe(userOneId);

  //     // Verify exactly one owner exists
  //     const { data: ownerCount } = await testSupabase
  //       .from('organization_members')
  //       .select('id', { count: 'exact' })
  //       .eq('organization_id', org?.id)
  //       .eq('role', 'owner');

  //     expect(ownerCount?.length).toBe(1);
  //   });

  //   it('should not trigger when owned_by remains the same', async () => {
  //     const result = await createNewOrganization(testSupabase, {
  //       name: 'No Change Test Org',
  //       handle: 'no-change-test-org',
  //     });

  //     expect(result.success).toBe(true);

  //     const {
  //       data: { user },
  //     } = await testSupabase.auth.getUser();

  //     // Get organization
  //     const { data: org } = await testSupabase
  //       .from('organizations')
  //       .select('id')
  //       .eq('handle', 'no-change-test-org')
  //       .single();

  //     // Get initial membership timestamp
  //     const { data: initialMembership } = await testSupabase
  //       .from('organization_members')
  //       .select('created_at, updated_at')
  //       .eq('organization_id', org?.id)
  //       .eq('user_id', user?.id)
  //       .single();

  //     // Wait a moment to ensure timestamps would be different
  //     await new Promise((resolve) => setTimeout(resolve, 100));

  //     // Update organization name but keep same owner
  //     const { error: updateError } = await testSupabase
  //       .from('organizations')
  //       .update({
  //         name: 'Updated Name',
  //         updated_by: user?.id,
  //       })
  //       .eq('id', org?.id);

  //     expect(updateError).toBe(null);

  //     // Verify membership timestamps haven't changed (trigger didn't fire)
  //     const { data: finalMembership } = await testSupabase
  //       .from('organization_members')
  //       .select('created_at, updated_at')
  //       .eq('organization_id', org?.id)
  //       .eq('user_id', user?.id)
  //       .single();

  //     expect(finalMembership?.created_at).toBe(initialMembership?.created_at);

  //     // Verify exactly one owner still exists
  //     const { data: ownerCount } = await testSupabase
  //       .from('organization_members')
  //       .select('id', { count: 'exact' })
  //       .eq('organization_id', org?.id)
  //       .eq('role', 'owner');

  //     expect(ownerCount?.length).toBe(1);
  //   });

  //   it('should remove owner when ownership is transferred to null', async () => {
  //     const result = await createNewOrganization(testSupabase, {
  //       name: 'Null Transfer Test Org',
  //       handle: 'null-transfer-test-org',
  //     });

  //     expect(result.success).toBe(true);

  //     const {
  //       data: { user },
  //     } = await testSupabase.auth.getUser();

  //     // Get organization
  //     const { data: org } = await testSupabase
  //       .from('organizations')
  //       .select('id')
  //       .eq('handle', 'null-transfer-test-org')
  //       .single();

  //     // Verify initial owner exists
  //     const { data: initialOwner } = await testSupabase
  //       .from('organization_members')
  //       .select('user_id')
  //       .eq('organization_id', org?.id)
  //       .eq('role', 'owner')
  //       .single();

  //     expect(initialOwner?.user_id).toBe(user?.id);

  //     // Transfer ownership to null (if your schema allows it)
  //     const { error: transferError } = await testSupabase
  //       .from('organizations')
  //       .update({
  //         owned_by: null,
  //         updated_by: user?.id,
  //       })
  //       .eq('id', org?.id);

  //     // If the update succeeded, verify no owner exists
  //     if (!transferError) {
  //       const { data: ownersAfterNull } = await testSupabase
  //         .from('organization_members')
  //         .select('id')
  //         .eq('organization_id', org?.id)
  //         .eq('role', 'owner');

  //       expect(ownersAfterNull?.length).toBe(0);
  //     }
  //   });
  // });

  describe('Edge Cases and Constraint Validation', () => {
    it('should maintain one_owner_per_organization constraint', async () => {
      const result = await createNewOrganization(testSupabase, {
        name: 'Constraint Test Org',
        handle: 'constraint-test-org',
      });

      expect(result.success).toBe(true);

      const {
        data: { user },
      } = await testSupabase.auth.getUser();

      // Get organization
      const { data: org } = await testSupabase
        .from('organizations')
        .select('id')
        .eq('handle', 'constraint-test-org')
        .single();

      // Switch to user two
      await signInWithEmailAndPassword(testSupabase, {
        email: userTwo.email,
        password: userTwo.password,
      });

      const userTwoId = (await testSupabase.auth.getUser()).data.user?.id;

      // Attempt to manually insert a second owner (should fail due to constraint)
      const { error: duplicateOwnerError } = await testSupabase
        .from('organization_members')
        .insert({
          organization_id: org?.id,
          user_id: userTwoId,
          role: 'owner',
          invited_by: userTwoId,
        });

      expect(duplicateOwnerError).toBeDefined();
      expect(duplicateOwnerError?.code).toBe('23505'); // Unique constraint violation
      expect(duplicateOwnerError?.message).toContain('one_owner_per_organization');
    });

    // it('should handle rapid ownership transfers without constraint violations', async () => {
    //   const result = await createNewOrganization(testSupabase, {
    //     name: 'Rapid Transfer Test Org',
    //     handle: 'rapid-transfer-test-org',
    //   });

    //   expect(result.success).toBe(true);

    //   const userOneId = (await testSupabase.auth.getUser()).data.user?.id;

    //   // Get user two ID
    //   await signInWithEmailAndPassword(testSupabase, {
    //     email: userTwo.email,
    //     password: userTwo.password,
    //   });

    //   const userTwoId = (await testSupabase.auth.getUser()).data.user?.id;

    //   // Switch back to user one
    //   await signInWithEmailAndPassword(testSupabase, {
    //     email: userOne.email,
    //     password: userOne.password,
    //   });

    //   // Get organization
    //   const { data: org } = await testSupabase
    //     .from('organizations')
    //     .select('id')
    //     .eq('handle', 'rapid-transfer-test-org')
    //     .single();

    //   // Perform multiple rapid transfers
    //   const transfers = [
    //     { owned_by: userTwoId },
    //     { owned_by: userOneId },
    //     { owned_by: userTwoId },
    //     { owned_by: userOneId },
    //   ];

    //   for (const transfer of transfers) {
    //     const { error } = await testSupabase
    //       .from('organizations')
    //       .update(transfer)
    //       .eq('id', org?.id);

    //     expect(error).toBe(null);
    //   }

    //   // Verify exactly one owner exists at the end
    //   const { data: finalOwners } = await testSupabase
    //     .from('organization_members')
    //     .select('user_id', { count: 'exact' })
    //     .eq('organization_id', org?.id)
    //     .eq('role', 'owner');

    //   expect(finalOwners?.length).toBe(1);
    // });

    it('should verify trigger executes with proper security context', async () => {
      const result = await createNewOrganization(testSupabase, {
        name: 'Security Test Org',
        handle: 'security-test-org',
      });

      expect(result.success).toBe(true);

      const {
        data: { user },
      } = await testSupabase.auth.getUser();

      // Get organization
      const { data: org } = await testSupabase
        .from('organizations')
        .select('id')
        .eq('handle', 'security-test-org')
        .single();

      // Verify the membership was created with proper audit fields
      const { data: membership, error } = await testSupabase
        .from('organization_members')
        .select('user_id, role, invited_by, created_at')
        .eq('organization_id', org?.id)
        .eq('user_id', user?.id)
        .single();

      expect(error).toBe(null);
      expect(membership).toBeDefined();
      expect(membership?.user_id).toBe(user?.id);
      expect(membership?.role).toBe('owner');
      expect(membership?.invited_by).toBe(user?.id);
      expect(membership?.created_at).toBeDefined();

      // Verify the timestamp is recent
      const createdAt = new Date(membership!.created_at);
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60000);

      expect(createdAt.getTime()).toBeGreaterThan(oneMinuteAgo.getTime());
    });
  });
});
