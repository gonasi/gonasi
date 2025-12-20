import { getSignedUrl } from '@gonasi/cloudinary';

import type { TypedSupabaseClient } from '../client';

/**
 * Generates a signed Cloudinary URL for an organization avatar.
 *
 * @param avatarPath - The Cloudinary public_id (e.g., "organizations/:organizationId/profile/avatar")
 * @returns Signed URL valid for 1 hour, or null if avatarPath is empty
 */
export async function createOrganizationAvatarSignedUrl(
  supabase: TypedSupabaseClient,
  avatarPath: string | null,
): Promise<string | null> {
  if (!avatarPath) return null;

  try {
    const signedUrl = getSignedUrl(avatarPath, {
      width: 400,
      height: 400,
      quality: 'auto',
      format: 'auto',
      expiresInSeconds: 3600,
      resourceType: 'image',
    });

    return signedUrl;
  } catch (err) {
    console.error('[createOrganizationAvatarSignedUrl] Unexpected error:', err);
    return null;
  }
}
