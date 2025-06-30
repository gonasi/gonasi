import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';

/**
 * Fetch all organizations the current user is part of,
 * including basic org details and metadata like ownership and limits.
 */
export const fetchUsersOrganizations = async (supabase: TypedSupabaseClient) => {
  try {
    const userId = await getUserId(supabase);

    // Get all organizations the user is part of
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
          blur_hash,
          tier
        )
      `,
      )
      .eq('user_id', userId);

    if (error || !data) {
      return {
        success: false,
        message: 'Looks like you’re not part of any organizations yet.',
        data: [],
        total: 0,
        owned_count: 0,
        can_create_more: true,
      };
    }

    // Compute derived fields
    const total = data.length;

    const withOwnershipFlags = data.map((entry) => ({
      ...entry,
      is_owner: entry.role === 'owner',
    }));

    const ownedOrgs = withOwnershipFlags.filter((entry) => entry.is_owner);
    const owned_count = ownedOrgs.length;

    const launchOwnedCount = ownedOrgs.filter(
      (entry) => entry.organization?.tier === 'launch',
    ).length;

    const can_create_more = launchOwnedCount < 2;

    return {
      success: true,
      message: 'Organizations loaded successfully.',
      data: withOwnershipFlags,
      total,
      owned_count,
      can_create_more,
    };
  } catch (err) {
    console.error('fetchUsersOrganizations error:', err);
    return {
      success: false,
      message: 'Something went wrong. Please try again in a bit.',
      data: [],
      total: 0,
      owned_count: 0,
      can_create_more: true,
    };
  }
};
