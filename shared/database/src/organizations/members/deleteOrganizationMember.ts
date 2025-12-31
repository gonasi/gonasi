import type { DeleteMemberFromOrganizationSchemaTypes } from '@gonasi/schemas/organizations';

import type { TypedSupabaseClient } from '../../client';

interface DeleteMemberParams {
  supabase: TypedSupabaseClient;
  data: DeleteMemberFromOrganizationSchemaTypes;
}

/**
 * Deletes a member from an organization and performs comprehensive cleanup.
 *
 * This function handles the complete removal of an organization member, including:
 * - Validating the member exists and is not the organization owner
 * - Removing the member from the organization_members table
 * - Transferring ownership of courses created by the member to the organization owner
 * - Removing the member from all course_editors entries
 * - Resetting the member's profile to personal mode if this was their active organization
 *
 * @param {TypedSupabaseClient} params.supabase - Authenticated Supabase client
 * @param {DeleteMemberFromOrganizationSchemaTypes} params.data - Contains organizationId and memberId
 *
 * @returns {Promise<{success: boolean, message: string, data: null}>}
 *   - success: true if member was deleted, false if validation failed or deletion error
 *   - message: User-friendly message describing the result
 *   - data: Always null (reserved for future use)
 *
 * @example
 * const result = await deleteOrganizationMember({
 *   supabase,
 *   data: { organizationId: '123', memberId: '456' }
 * });
 * if (result.success) {
 *   console.log('Member removed successfully');
 * }
 */
export const deleteOrganizationMember = async ({ supabase, data }: DeleteMemberParams) => {
  const { organizationId, memberId } = data;

  try {
    // ============================================================================
    // STEP 1: Validate member exists and retrieve their role
    // ============================================================================
    const { data: member, error: fetchError } = await supabase
      .from('organization_members')
      .select('id, role')
      .eq('organization_id', organizationId)
      .eq('user_id', memberId)
      .single();

    if (fetchError || !member) {
      console.error('[deleteOrganizationMember] Member not found:', fetchError);
      return {
        success: false,
        message: 'The member you are trying to remove was not found.',
        data: null,
      };
    }

    // ============================================================================
    // STEP 2: Prevent removing the organization owner
    // ============================================================================
    if (member.role === 'owner') {
      return {
        success: false,
        message: 'You cannot remove the organization owner.',
        data: null,
      };
    }

    // ============================================================================
    // STEP 3: Fetch organization owner (needed for course transfer)
    // We do this BEFORE deletion to ensure we can transfer courses even if
    // member deletion succeeds but subsequent operations fail
    // ============================================================================
    const { data: owner } = await supabase
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', organizationId)
      .eq('role', 'owner')
      .single();

    if (!owner) {
      console.warn(
        '[deleteOrganizationMember] Organization owner not found. Courses will not be transferred.',
      );
    }

    // ============================================================================
    // STEP 4: Delete the organization member
    // This is the critical operation - if this fails, we return early
    // ============================================================================
    const { error: deleteError } = await supabase
      .from('organization_members')
      .delete()
      .eq('organization_id', organizationId)
      .eq('user_id', memberId)
      .select();

    if (deleteError) {
      console.error('[deleteOrganizationMember] Deletion failed:', deleteError);
      return {
        success: false,
        message: 'Failed to remove member. Please try again.',
        data: null,
      };
    }

    // ============================================================================
    // STEP 5: Perform cleanup operations in parallel
    // These operations are non-critical - we log errors but don't fail the request
    // Using Promise.allSettled to ensure all cleanup attempts complete
    // ============================================================================
    const cleanupOperations = [];

    // 5a. Transfer course ownership to organization owner
    if (owner) {
      cleanupOperations.push(
        supabase
          .from('courses')
          .update({
            created_by: owner.user_id,
            updated_by: owner.user_id,
          })
          .eq('organization_id', organizationId)
          .eq('created_by', memberId)
          .then(({ error }) => ({
            operation: 'course-transfer',
            error,
          })),
      );
    }

    // 5b. Remove member from all course_editors entries
    cleanupOperations.push(
      supabase
        .from('course_editors')
        .delete()
        .eq('organization_id', organizationId)
        .eq('user_id', memberId)
        .then(({ error }) => ({
          operation: 'editor-removal',
          error,
        })),
    );

    // 5c. Reset profile to personal mode if this was their active organization
    cleanupOperations.push(
      supabase
        .from('profiles')
        .select('id, active_organization_id')
        .eq('id', memberId)
        .single()
        .then(async ({ data: profile }) => {
          if (profile?.active_organization_id === organizationId) {
            const { error } = await supabase
              .from('profiles')
              .update({
                mode: 'personal',
                active_organization_id: null,
              })
              .eq('id', memberId);

            return { operation: 'profile-reset', error };
          }
          return { operation: 'profile-reset', error: null };
        }),
    );

    // Execute all cleanup operations in parallel and log any failures
    const results = await Promise.allSettled(cleanupOperations);

    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.error) {
        console.error(
          `[deleteOrganizationMember] Cleanup operation '${result.value.operation}' failed:`,
          result.value.error,
        );
      } else if (result.status === 'rejected') {
        console.error(
          '[deleteOrganizationMember] Cleanup operation failed unexpectedly:',
          result.reason,
        );
      }
    });

    // ============================================================================
    // SUCCESS: Member deleted and cleanup operations attempted
    // ============================================================================
    return {
      success: true,
      message: 'Member removed successfully.',
      data: null,
    };
  } catch (err) {
    console.error('[deleteOrganizationMember] Unexpected error:', err);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
      data: null,
    };
  }
};
