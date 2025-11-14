import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import { ORGANIZATION_PROFILE_PHOTOS } from '../constants';

const SIGNED_URL_EXPIRY = 60 * 60 * 24 * 7; // 7 days

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

    // -------- Signed URL generation --------
    const avatarPaths = memberships
      .map((m) => m.organization?.avatar_url)
      .filter((p): p is string => Boolean(p));

    let signedUrls: Record<string, string> = {};

    if (avatarPaths.length > 0) {
      const { data: signedData, error: signedError } = await supabase.storage
        .from(ORGANIZATION_PROFILE_PHOTOS)
        .createSignedUrls(avatarPaths, SIGNED_URL_EXPIRY);

      if (signedError) {
        console.error('Error generating signed organization avatars:', signedError);
      } else if (signedData) {
        signedUrls = signedData.reduce(
          (acc, file) => {
            if (file.path && file.signedUrl) {
              acc[file.path] = file.signedUrl;
            }
            return acc;
          },
          {} as Record<string, string>,
        );
      }
    }

    // -------- Enrich organizations --------
    const enriched = memberships.map((entry) => {
      const org = entry.organization;

      return {
        ...entry,
        is_owner: entry.role === 'owner',
        organization: org
          ? {
              ...org,
              avatar_url: org.avatar_url ? (signedUrls[org.avatar_url] ?? org.avatar_url) : null,
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
