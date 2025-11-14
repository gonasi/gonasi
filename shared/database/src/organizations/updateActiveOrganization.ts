import type { SetActiveOrganizationSchemaTypes } from '@gonasi/schemas/organizations';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';

interface UpdateActiveOrganizationArgs {
  supabase: TypedSupabaseClient;
  organizationId: SetActiveOrganizationSchemaTypes['organizationId'];
}

/**
 * Sets the active organization for the currently logged-in user.
 */
export const updateActiveOrganization = async ({
  supabase,
  organizationId,
}: UpdateActiveOrganizationArgs) => {
  try {
    const userId = await getUserId(supabase);

    // Fetch current active organization for the user
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, active_organization_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        message: 'Unable to fetch user profile.',
        data: null,
      };
    }

    // If active organization is already the same, return early
    if (profile.active_organization_id === organizationId) {
      return {
        success: true,
        message: null, // or a custom message like 'Already active'
        data: null,
      };
    }

    // Check if user is a member of the organization
    const { data: member, error: memberError } = await supabase
      .from('organization_members')
      .select('id')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .single();

    if (memberError || !member) {
      return {
        success: false,
        message: 'You are not a member of this organization.',
        data: null,
      };
    }

    // Update the user's active organization
    const { data, error } = await supabase
      .from('profiles')
      .update({ active_organization_id: organizationId, mode: 'organization' })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update active organization:', error);
      return {
        success: false,
        message: 'Unable to switch organization. Please try again shortly.',
        data: null,
      };
    }

    return {
      success: true,
      message: 'You have successfully switched your active organization.',
      data: {
        id: data.id,
        active_organization_id: data.active_organization_id,
      },
    };
  } catch (err) {
    console.error('updateActiveOrganization threw:', err);
    return {
      success: false,
      message: 'Unexpected error. Please try again shortly.',
      data: null,
    };
  }
};
