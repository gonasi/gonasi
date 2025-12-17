import { getSignedUrl } from '@gonasi/cloudinary';

interface GenerateSignedThumbnailUrlArgs {
  imagePath: string; // Cloudinary public_id
  width?: number;
  height?: number;
  quality?: 'auto' | number;
  version?: string | number; // Cache-busting parameter (e.g., published_at or updated_at timestamp)
}

export function generateSignedThumbnailUrl({
  imagePath,
  width,
  height,
  quality = 'auto',
  version,
}: GenerateSignedThumbnailUrlArgs): string | null {
  try {
    // Use Cloudinary's getSignedUrl helper with authenticated delivery
    const signedUrl = getSignedUrl(imagePath, {
      width,
      height,
      quality,
      format: 'auto',
      expiresInSeconds: 3600, // 1 hour expiration (same as before)
      resourceType: 'image',
      crop: 'fill',
      version, // Add version for cache busting
    });

    return signedUrl;
  } catch (error) {
    console.error(`[generateSignedThumbnailUrl] Unexpected error for ${imagePath}:`, error);
    return null;
  }
}
