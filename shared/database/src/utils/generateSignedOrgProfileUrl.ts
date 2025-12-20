import { getSignedUrl } from '@gonasi/cloudinary';

import type { TypedSupabaseClient } from '../client';

interface GenerateSignedOrgProfileUrlArgs {
  supabase: TypedSupabaseClient;
  imagePath: string;
  version?: number;
}

/**
 * Generates a signed Cloudinary URL for an organization profile picture.
 *
 * @param imagePath - The Cloudinary public_id (e.g., "organizations/:organizationId/profile/avatar")
 * @param version - Optional version/timestamp for cache busting
 * @returns Signed URL valid for 1 hour, or null if imagePath is empty
 */
export async function generateSignedOrgProfileUrl({
  supabase,
  imagePath,
  version,
}: GenerateSignedOrgProfileUrlArgs): Promise<string | null> {
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
  } catch (error) {
    console.error(`[generateSignedOrgProfileUrl] Unexpected error for ${imagePath}:`, error);
    return null;
  }
}
