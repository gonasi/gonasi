import { getSignedUrl } from '@gonasi/cloudinary';

interface GenerateSignedThumbnailUrlArgs {
  imagePath: string; // Cloudinary public_id
  width?: number;
  height?: number;
  quality?: 'auto' | number;
}

export function generateSignedThumbnailUrl({
  imagePath,
  width,
  height,
  quality = 'auto',
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
    });

    return signedUrl;
  } catch (error) {
    console.error(`[generateSignedThumbnailUrl] Unexpected error for ${imagePath}:`, error);
    return null;
  }
}
