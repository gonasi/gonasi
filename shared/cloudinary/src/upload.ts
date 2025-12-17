import type { UploadApiResponse } from 'cloudinary';
import { getCloudinary } from './client';
import type { CloudinaryResourceType } from './helpers';

export interface UploadResult {
  success: boolean;
  data?: {
    publicId: string;
    secureUrl: string;
    width?: number;
    height?: number;
    format: string;
    resourceType: string;
    bytes: number;
  };
  error?: string;
}

export interface UploadOptions {
  resourceType?: CloudinaryResourceType | 'auto';
  type?: 'upload' | 'authenticated'; // 'authenticated' for private files
  overwrite?: boolean;
  tags?: string[];
  context?: Record<string, string>;
  folder?: string;
}

/**
 * Uploads a file to Cloudinary with authenticated delivery (private access).
 * CRITICAL: Always use type: 'authenticated' for private file storage.
 *
 * @param file - File object or Buffer to upload
 * @param publicId - Cloudinary public_id (generated via generatePublicId)
 * @param options - Upload configuration options
 * @returns Upload result with success status and file metadata
 */
export async function uploadToCloudinary(
  file: File | Buffer,
  publicId: string,
  options: UploadOptions = {},
): Promise<UploadResult> {
  try {
    const cloudinary = getCloudinary();
    const {
      resourceType = 'auto',
      type = 'authenticated', // Default to authenticated (private)
      overwrite = true,
      tags = [],
      context = {},
      folder,
    } = options;

    // Convert File to Buffer if needed
    let fileBuffer: Buffer;
    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    } else {
      fileBuffer = file;
    }

    // Upload to Cloudinary using upload_stream
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: resourceType,
          type, // CRITICAL: 'authenticated' for private access
          overwrite,
          tags,
          context,
          folder,
          invalidate: overwrite, // Invalidate CDN cache if overwriting
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve(result);
          } else {
            reject(new Error('Upload failed without error'));
          }
        },
      );

      uploadStream.end(fileBuffer);
    });

    return {
      success: true,
      data: {
        publicId: result.public_id,
        secureUrl: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        resourceType: result.resource_type,
        bytes: result.bytes,
      },
    };
  } catch (error) {
    console.error('[Cloudinary Upload Error]', {
      publicId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

/**
 * Deletes a file from Cloudinary.
 *
 * @param publicId - Cloudinary public_id of the file to delete
 * @param resourceType - Resource type (image, video, or raw)
 * @returns Delete result with success status
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: CloudinaryResourceType = 'image',
): Promise<DeleteResult> {
  try {
    const cloudinary = getCloudinary();

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      type: 'authenticated', // Match the upload type
      invalidate: true, // Invalidate CDN cache
    });

    // 'ok' means successfully deleted, 'not found' is also acceptable
    if (result.result === 'ok' || result.result === 'not found') {
      return { success: true };
    }

    return {
      success: false,
      error: `Unexpected result: ${result.result}`,
    };
  } catch (error) {
    console.error('[Cloudinary Delete Error]', {
      publicId,
      resourceType,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
}
