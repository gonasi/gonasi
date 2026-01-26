/**
 * Utility functions for handling image URLs
 * TODO: Add Cloudinary signing if required
 */

/**
 * Get a signed or transformed image URL
 * @param imageUrl - The original image URL from the database
 * @returns The processed image URL (currently returns as-is, can add Cloudinary transformations)
 */
export function getImageUrl(imageUrl: string | null): string | null {
  if (!imageUrl) return null;

  // TODO: Add Cloudinary URL signing/transformation here if needed
  // Example: return `${imageUrl}?signature=xyz`

  return imageUrl;
}

/**
 * Get a thumbnail version of an image
 * @param imageUrl - The original image URL
 * @param width - Desired width (default: 400)
 * @returns The thumbnail URL
 */
export function getThumbnailUrl(imageUrl: string | null, width: number = 400): string | null {
  if (!imageUrl) return null;

  // TODO: Add Cloudinary transformation parameters
  // Example for Cloudinary: return imageUrl.replace('/upload/', `/upload/w_${width},c_fill/`)

  return imageUrl;
}
