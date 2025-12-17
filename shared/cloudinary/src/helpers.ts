import { getCloudinary } from './client';

/**
 * Resource types for Cloudinary public_id generation
 */
export type ResourceType =
  | 'file'
  | 'thumbnail'
  | 'profile'
  | 'org-avatar'
  | 'org-banner'
  | 'pathway';

export type CloudinaryResourceType = 'image' | 'video' | 'raw';

export interface GeneratePublicIdParams {
  scope: 'draft' | 'published';
  resourceType: ResourceType;
  organizationId?: string;
  courseId?: string;
  userId?: string;
  fileId?: string;
  fileName?: string;
}

/**
 * Generates a Cloudinary public_id based on the new folder structure.
 * Public IDs follow the pattern: /:organizationId/courses/:courseId/{files|thumbnail}/:scope/...
 *
 * @param params - Parameters for generating the public_id
 * @returns Cloudinary public_id string
 * @throws Error if required parameters are missing for the resource type
 */
export function generatePublicId(params: GeneratePublicIdParams): string {
  const { scope, resourceType, organizationId, courseId, userId, fileId, fileName } = params;

  // Build path segments
  const segments: string[] = [];

  if (resourceType === 'profile' && userId) {
    segments.push(userId, 'profile', fileName || 'avatar');
  } else if (resourceType === 'org-avatar' && organizationId) {
    segments.push(organizationId, 'profile', 'organizations', fileName || 'avatar');
  } else if (resourceType === 'org-banner' && organizationId) {
    segments.push(organizationId, 'profile', 'organizations', 'banner');
  } else if (resourceType === 'thumbnail' && organizationId && courseId) {
    // Pattern: /:organizationId/courses/:courseId/thumbnail/:scope/thumbnail
    segments.push(organizationId, 'courses', courseId, 'thumbnail', scope, 'thumbnail');
  } else if (resourceType === 'file' && organizationId && courseId && fileId) {
    // Pattern: /:organizationId/courses/:courseId/files/:scope/:fileId
    segments.push(organizationId, 'courses', courseId, 'files', scope, fileId);
  } else if (resourceType === 'pathway' && organizationId && fileId) {
    segments.push(organizationId, 'pathways', scope, fileId);
  } else {
    throw new Error(
      `[Cloudinary] Invalid public_id generation params for resourceType: ${resourceType}`,
    );
  }

  return segments.join('/');
}

export interface SignedUrlOptions {
  width?: number;
  height?: number;
  quality?: 'auto' | number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
  expiresInSeconds?: number;
  resourceType?: CloudinaryResourceType;
  crop?: 'fill' | 'fit' | 'scale' | 'thumb';
  version?: string | number; // Cache-busting parameter (e.g., timestamp or version number)
}

/**
 * Generates a SIGNED Cloudinary URL with transformations and expiration.
 * CRITICAL: Uses authenticated delivery for private access control.
 *
 * @param publicId - The Cloudinary public_id of the resource
 * @param options - Transformation and security options
 * @returns Signed URL with transformations and expiration
 */
export function getSignedUrl(publicId: string, options: SignedUrlOptions = {}): string {
  const cloudinary = getCloudinary();
  const {
    width,
    height,
    quality = 'auto',
    format = 'auto',
    expiresInSeconds = 3600, // Default 1 hour (same as Supabase)
    resourceType = 'image',
    crop = 'fill',
    version,
  } = options;

  // Calculate expiration timestamp (Unix timestamp in seconds)
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

  // Build transformation object
  const transformation: any = {
    quality,
    fetch_format: format,
    crop,
  };

  // Add width/height only if provided
  if (width) transformation.width = width;
  if (height) transformation.height = height;

  // For authenticated URLs, we need to use Cloudinary's version system
  // instead of query parameters to avoid breaking the signature
  const urlOptions: any = {
    sign_url: true, // CRITICAL: Generate signature
    expires_at: expiresAt, // CRITICAL: Set expiration
    type: 'authenticated', // CRITICAL: Use authenticated delivery (private)
    resource_type: resourceType,
    transformation: [transformation],
  };

  // Use Cloudinary's version parameter if provided (included in signature)
  // This forces cache invalidation without breaking authentication
  if (version) {
    urlOptions.version = version;
  }

  return cloudinary.url(publicId, urlOptions);
}

/**
 * Generates a blur placeholder signed URL for progressive image loading.
 * Uses Cloudinary's blur effect instead of BlurHash.
 *
 * @param publicId - The Cloudinary public_id of the image
 * @param expiresInSeconds - URL expiration time in seconds (default: 3600)
 * @returns Signed URL with blur transformation
 */
export function getBlurPlaceholderUrl(publicId: string, expiresInSeconds = 3600): string {
  const cloudinary = getCloudinary();
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

  return cloudinary.url(publicId, {
    sign_url: true,
    expires_at: expiresAt,
    type: 'authenticated',
    resource_type: 'image',
    transformation: [
      {
        width: 40,
        quality: 10,
        effect: 'blur:1000', // Heavy blur effect
        fetch_format: 'auto',
      },
    ],
  });
}

/**
 * Generates a video streaming URL for adaptive bitrate streaming.
 * Uses HLS (m3u8) format for cross-platform compatibility.
 *
 * @param publicId - The Cloudinary public_id of the video
 * @param expiresInSeconds - URL expiration time in seconds (default: 3600)
 * @returns Signed URL for video streaming
 */
export function getVideoStreamingUrl(publicId: string, expiresInSeconds = 3600): string {
  const cloudinary = getCloudinary();
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

  return cloudinary.url(publicId, {
    sign_url: true,
    expires_at: expiresAt,
    type: 'authenticated',
    resource_type: 'video',
    streaming_profile: 'hd',
    format: 'm3u8', // HLS streaming
  });
}
