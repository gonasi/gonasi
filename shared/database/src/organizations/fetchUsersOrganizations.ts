import { getSignedUrl } from '@gonasi/cloudinary';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';

/**
 * Fetches all organizations the current user belongs to,
 * including roles, tier info, and signed avatar URLs.
 */
export async function fetchUsersOrganizations(supabase: TypedSupabaseClient) {
  try {
    const userId = await getUserId(supabase);

    // Fetch organizations for the user
    const { data: memberships, error } = await supabase
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
            updated_at,
            subscription:organization_subscriptions (
              tier
            )
          )
        `,
      )
      .eq('user_id', userId);

    // If query failed OR user has no organizations
    if (error || !memberships?.length) {
      return {
        success: true,
        message: `Looks like you're not part of any organizations yet.`,
        data: [],
        total: 0,
        owned_count: 0,
        userId,
      };
    }

    // -------- Generate Cloudinary signed URLs --------
    const enriched = memberships.map((entry) => {
      const org = entry.organization;

      // Generate Cloudinary signed URL if avatar_url exists
      let avatarUrl: string | null = null;
      if (org?.avatar_url) {
        try {
          // avatar_url now stores the Cloudinary public_id
          // Use updated_at timestamp as version for cache busting
          const version = org.updated_at ? new Date(org.updated_at).getTime() : undefined;

          avatarUrl = getSignedUrl(org.avatar_url, {
            width: 200,
            height: 200,
            quality: 'auto',
            format: 'auto',
            crop: 'fill',
            version,
          });
        } catch (error) {
          console.error('Error generating Cloudinary URL for organization avatar:', error);
          avatarUrl = null;
        }
      }

      return {
        ...entry,
        is_owner: entry.role === 'owner',
        organization: org
          ? {
              ...org,
              avatar_url: avatarUrl,
            }
          : null,
      };
    });

    const ownedOrgs = enriched.filter((e) => e.is_owner);

    return {
      success: true,
      message: 'Organizations loaded successfully.',
      data: enriched,
      total: enriched.length,
      owned_count: ownedOrgs.length,
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
      userId: '',
    };
  }
}
