import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import { ORGANIZATION_PROFILE_PHOTOS } from '../constants';

// Signed URL expiry duration (1 week = 7 days * 24h * 3600s)
const SIGNED_URL_EXPIRY = 60 * 60 * 24 * 7; // 604800 seconds

/**
 * Fetch all organizations the current user is part of,
 * enrich with ownership flags, tier limits, and signed avatar URLs.
 */
export const fetchUsersOrganizations = async (supabase: TypedSupabaseClient) => {
  try {
    const userId = await getUserId(supabase);

    // Query all organizations where the user is a member
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
        message: `Looks like you're not part of any organizations yet.`,
        data: [],
        total: 0,
        owned_count: 0,
        can_create_more: true,
        userId,
      };
    }

    // Collect all avatar paths for signed URL generation
    const avatarPaths = data
      .map((entry) => entry.organization?.avatar_url)
      .filter((path): path is string => Boolean(path));

    let signedUrls: Record<string, string> = {};

    if (avatarPaths.length > 0) {
      try {
        const { data: signedData, error: signedError } = await supabase.storage
          .from(ORGANIZATION_PROFILE_PHOTOS)
          .createSignedUrls(avatarPaths, SIGNED_URL_EXPIRY);

        if (!signedError && signedData) {
          signedUrls = signedData.reduce(
            (acc, item) => {
              if (item.signedUrl && typeof item.path === 'string') {
                acc[item.path] = item.signedUrl;
              }
              return acc;
            },
            {} as Record<string, string>,
          );
        } else if (signedError) {
          console.error('Error creating signed URLs for avatars:', signedError);
        }
      } catch (err) {
        console.error('Exception while creating signed URLs for avatars:', err);
      }
    }

    // Enrich organizations with signed avatar URLs and ownership flags
    const withOwnershipFlags = data.map((entry) => ({
      ...entry,
      is_owner: entry.role === 'owner',
      organization: entry.organization
        ? {
            ...entry.organization,
            avatar_url: entry.organization.avatar_url
              ? signedUrls[entry.organization.avatar_url] || entry.organization.avatar_url
              : null,
          }
        : entry.organization,
    }));

    // Ownership and tier-based constraints
    const total = data.length;
    const ownedOrgs = withOwnershipFlags.filter((entry) => entry.is_owner);
    const owned_count = ownedOrgs.length;
    const launchOwnedCount = ownedOrgs.filter(
      (entry) => entry.organization?.tier === 'launch',
    ).length;

    // Limit: max 2 "launch" tier orgs can be owned
    const can_create_more = launchOwnedCount < 2;

    return {
      success: true,
      message: 'Organizations loaded successfully.',
      data: withOwnershipFlags,
      total,
      owned_count,
      can_create_more,
      userId,
    };
  } catch (err) {
    console.error('fetchUsersOrganizations error:', err);
    return {
      success: false,
      message: 'Something went wrong. Please try again later.',
      data: [],
      total: 0,
      owned_count: 0,
      can_create_more: true,
      userId: '',
    };
  }
};
