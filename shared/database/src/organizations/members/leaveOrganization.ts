import type { ExitOrganizationSchemaTypes } from '@gonasi/schemas/organizations';

import type { TypedSupabaseClient } from '../../client';

interface LeaveOrganizationParams {
  supabase: TypedSupabaseClient;
  data: ExitOrganizationSchemaTypes;
}

export const leaveOrganization = async ({ supabase, data }: LeaveOrganizationParams) => {
  const { organizationId } = data;

  try {
    // 1. Get the currently authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('[leaveOrganization] Failed to get user:', userError);
      return {
        success: false,
        message: 'Unable to authenticate user.',
        data: null,
      };
    }

    const userId = user.id;

    // 2. Fetch current member record
    const { data: member, error: fetchError } = await supabase
      .from('organization_members')
      .select('id, role')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !member) {
      console.error('[leaveOrganization] Member not found:', fetchError);
      return {
        success: false,
        message: 'You are not a member of this organization.',
        data: null,
      };
    }

    // 3. Prevent owners from leaving (must transfer ownership first)
    if (member.role === 'owner') {
      return {
        success: false,
        message: 'Owners must transfer ownership before leaving the organization.',
        data: null,
      };
    }

    // 4. Proceed with deletion
    const { error: deleteError } = await supabase
      .from('organization_members')
      .delete()
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .select();

    if (deleteError) {
      console.error('[leaveOrganization] Deletion failed:', deleteError);
      return {
        success: false,
        message: 'Failed to leave organization. Please try again.',
        data: null,
      };
    }

    return {
      success: true,
      message: 'You have successfully left the organization.',
      data: null,
    };
  } catch (err) {
    console.error('[leaveOrganization] Unexpected error:', err);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
      data: null,
    };
  }
};
