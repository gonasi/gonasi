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
