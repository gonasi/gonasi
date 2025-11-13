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

    // ─────────────────────────────────────────────────────────────
    // 1. Fetch current profile to check if already in personal mode
    // ─────────────────────────────────────────────────────────────
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, active_organization_id, mode, username')
      .eq('id', userId)
      .single();

    if (fetchError || !profile) {
      console.error('Failed to fetch profile:', fetchError);
      return {
        success: false,
        message: 'Unable to verify your current mode. Please try again shortly.',
        data: null,
      };
    }

    const alreadyPersonal = profile.active_organization_id === null && profile.mode === 'personal';

    if (alreadyPersonal) {
      return {
        success: false,
        message: 'You are already in personal mode.',
        data: {
          id: profile.id,
          active_organization_id: profile.active_organization_id,
          username: profile.username,
        },
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 2. Update to personal mode
    // ─────────────────────────────────────────────────────────────
    const { data, error } = await supabase
      .from('profiles')
      .update({ active_organization_id: null, mode: 'personal' })
      .eq('id', userId)
      .select('id, active_organization_id, username')
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
      message: 'You have successfully switched to personal mode.',
      data: {
        id: data.id,
        active_organization_id: data.active_organization_id,
        username: data.username,
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
