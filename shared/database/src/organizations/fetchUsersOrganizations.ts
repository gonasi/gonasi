import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';

/**
 * Fetch all organizations the current user is part of,
 * including basic org details like name, handle, and avatar.
 */
export const fetchUsersOrganizations = async (supabase: TypedSupabaseClient) => {
  try {
    const userId = await getUserId(supabase);

    const { data, error } = await supabase
      .from('organization_members')
      .select(
        `
        id,
        role,
        organization_id,
        organization:organizations (
          id,
          name,
          handle,
          avatar_url,
          blur_hash
        )
      `,
      )
      .eq('user_id', userId);

    if (error || !data) {
      return {
        success: false,
        message: 'Looks like you’re not part of any organizations yet.',
        data,
      };
    }

    return {
      success: true,
      message: 'Organizations loaded successfully.',
      data,
    };
  } catch (err) {
    console.error('fetchUsersOrganizations error:', err);
    return {
      success: false,
      message: 'Something went wrong. Please try again in a bit.',
      data: null,
    };
  }
};
