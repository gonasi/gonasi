import type { DeleteMemberFromOrganizationSchemaTypes } from '@gonasi/schemas/organizations';

import type { TypedSupabaseClient } from '../../client';

interface DeleteMemberParams {
  supabase: TypedSupabaseClient;
  data: DeleteMemberFromOrganizationSchemaTypes;
}

export const deleteOrganizationMember = async ({ supabase, data }: DeleteMemberParams) => {
  const { organizationId, memberId } = data;

  try {
    // 1. Fetch the member to delete
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

    // 2. Prevent removing the owner
    if (member.role === 'owner') {
      return {
        success: false,
        message: 'You cannot remove the organization owner.',
        data: null,
      };
    }

    // 3. Proceed with deletion
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
