import { getCloudinary } from './client';
import type { CloudinaryResourceType } from './helpers';

export interface UploadSignatureParams {
  publicId: string;
  resourceType?: CloudinaryResourceType;
  tags?: string[];
  context?: Record<string, string>;
  maxFileSize?: number; // in bytes
}

export interface UploadSignature {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  publicId: string;
  uploadPreset?: string;
  // Additional params that were signed
  tags?: string;
  context?: string;
  resourceType?: string;
}

/**
 * Generates a signed upload signature for client-side direct uploads to Cloudinary.
 *
 * This enables uploading large files directly from the browser to Cloudinary without
 * going through your server, avoiding timeout and memory issues on serverless platforms.
 *
 * SECURITY: The signature ensures only authorized uploads with specific parameters.
 *
 * @param params - Upload parameters to sign
 * @returns Signed upload credentials for client-side use
 *
 * @example
 * ```typescript
 * const signature = await generateUploadSignature({
 *   publicId: 'org123/courses/course456/files/draft/file789',
 *   resourceType: 'raw',
 *   tags: ['draft', 'file-library'],
 *   context: { organizationId: 'org123', courseId: 'course456' }
 * });
 *
 * // Client-side: Use signature to upload directly to Cloudinary
 * const formData = new FormData();
 * formData.append('file', file);
 * formData.append('public_id', signature.publicId);
 * formData.append('timestamp', signature.timestamp.toString());
 * formData.append('signature', signature.signature);
 * formData.append('api_key', signature.apiKey);
 *
 * await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/upload`, {
 *   method: 'POST',
 *   body: formData
 * });
 * ```
 */
export function generateUploadSignature(params: UploadSignatureParams): UploadSignature {
  const cloudinary = getCloudinary();

  const {
    publicId,
    resourceType = 'auto',
    tags = [],
    context = {},
    maxFileSize,
  } = params;

  // Build params to sign
  const timestamp = Math.round(Date.now() / 1000);

  const paramsToSign: Record<string, any> = {
    timestamp,
    public_id: publicId,
    type: 'authenticated', // CRITICAL: Private file storage
    resource_type: resourceType,
    invalidate: true,
  };

  if (tags.length > 0) {
    paramsToSign.tags = tags.join(',');
  }

  if (Object.keys(context).length > 0) {
    paramsToSign.context = Object.entries(context)
      .map(([key, value]) => `${key}=${value}`)
      .join('|');
  }

  if (maxFileSize) {
    paramsToSign.max_bytes = maxFileSize;
  }

  // Generate signature using Cloudinary SDK
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    signature,
    timestamp,
    cloudName: cloudinary.config().cloud_name!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    publicId,
    tags: tags.length > 0 ? tags.join(',') : undefined,
    context: Object.keys(context).length > 0
      ? Object.entries(context).map(([key, value]) => `${key}=${value}`).join('|')
      : undefined,
    resourceType,
  };
}
