import { getSignedUrl } from '@gonasi/cloudinary';

import type { TypedSupabaseClient } from '../client';

interface GenerateSignedUserProfilePictureUrlArgs {
  supabase: TypedSupabaseClient;
  imagePath: string;
  version?: number;
}

/**
 * Generates a signed Cloudinary URL for a user profile picture.
 *
 * @param imagePath - The Cloudinary public_id (e.g., "users/:userId/profile/avatar")
 * @param version - Optional version/timestamp for cache busting
 * @returns Signed URL valid for 1 hour, or null if imagePath is empty
 */
export async function generateSignedUserProfilePictureUrl({
  supabase,
  imagePath,
  version,
}: GenerateSignedUserProfilePictureUrlArgs): Promise<string | null> {
  try {
    if (!imagePath) {
      return null;
    }

    // Generate Cloudinary signed URL valid for 1 hour
    const signedUrl = getSignedUrl(imagePath, {
      width: 400,
      height: 400,
      quality: 'auto',
      format: 'auto',
      expiresInSeconds: 3600,
      resourceType: 'image',
      version,
    });

    return signedUrl;
  } catch (err) {
    console.error(`[generateSignedUserProfilePictureUrl] Unexpected error for ${imagePath}:`, err);
    return null;
  }
}
