import { getPixels } from '@unpic/pixels';
import { encode } from 'blurhash';

/**
 * Generates a BlurHash from an image file
 * @param imageFile - The image file to process
 * @param componentX - Number of components in X direction (default: 4)
 * @param componentY - Number of components in Y direction (default: 4)
 * @returns Promise<string> - The generated BlurHash string
 */
export async function generateBlurHash(
  imageFile: File,
  componentX: number = 4,
  componentY: number = 4,
): Promise<string> {
  // Validate image format
  const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!supportedTypes.includes(imageFile.type)) {
    throw new Error('Unsupported image format. Please use JPEG, PNG, or WebP.');
  }

  // Convert File to Buffer
  const arrayBuffer = await imageFile.arrayBuffer();
  const imageBuffer = Buffer.from(arrayBuffer);

  // Generate blur hash
  const imageData = await getPixels(imageBuffer);
  const pixelData = Uint8ClampedArray.from(imageData.data);

  return encode(pixelData, imageData.width, imageData.height, componentX, componentY);
}
