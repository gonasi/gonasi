import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';

interface UpdateActiveOrganizationArgs {
  supabase: TypedSupabaseClient;
}

/**
 * Switches the user to personal mode by clearing the active organization.
 */
export const switchToPersonalMode = async ({ supabase }: UpdateActiveOrganizationArgs) => {
  try {
    const userId = await getUserId(supabase);

    const { data, error } = await supabase
      .from('profiles')
      .update({ active_organization_id: null, mode: 'personal' })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Failed to switch to personal mode:', error);
      return {
        success: false,
        message: 'Unable to switch to personal mode. Please try again shortly.',
        data: null,
      };
    }

    return {
      success: true,
      message: '✅ Switched to personal mode successfully.',
      data: {
        id: data.id,
        active_organization_id: data.active_organization_id,
      },
    };
  } catch (err) {
    console.error('switchToPersonalMode threw:', err);
    return {
      success: false,
      message: 'Unexpected error while switching to personal mode. Please try again shortly.',
      data: null,
    };
  }
};
