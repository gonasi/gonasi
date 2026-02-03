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
  liveSessionId?: string;
  userId?: string;
  fileId?: string;
  fileName?: string;
}

/**
 * Generates a Cloudinary public_id based on the new folder structure.
 * Public IDs follow the pattern: /organizations/:organizationId/courses/:courseId/{files|thumbnail}/:scope/...
 *
 * @param params - Parameters for generating the public_id
 * @returns Cloudinary public_id string
 * @throws Error if required parameters are missing for the resource type
 */
export function generatePublicId(params: GeneratePublicIdParams): string {
  const { scope, resourceType, organizationId, courseId, liveSessionId, userId, fileId, fileName } =
    params;

  // Build path segments
  const segments: string[] = [];

  if (resourceType === 'profile' && userId) {
    segments.push('users', userId, 'profile', fileName || 'avatar');
  } else if (resourceType === 'org-avatar' && organizationId) {
    segments.push('organizations', organizationId, 'profile', fileName || 'avatar');
  } else if (resourceType === 'org-banner' && organizationId) {
    segments.push('organizations', organizationId, 'profile', 'banner');
  } else if (resourceType === 'thumbnail' && organizationId && liveSessionId) {
    // Pattern: /organizations/:organizationId/live-sessions/:liveSessionId/thumbnail/:scope/thumbnail
    segments.push(
      'organizations',
      organizationId,
      'live-sessions',
      liveSessionId,
      'thumbnail',
      scope,
      'thumbnail',
    );
  } else if (resourceType === 'thumbnail' && organizationId && courseId) {
    // Pattern: /organizations/:organizationId/courses/:courseId/thumbnail/:scope/thumbnail
    segments.push(
      'organizations',
      organizationId,
      'courses',
      courseId,
      'thumbnail',
      scope,
      'thumbnail',
    );
  } else if (resourceType === 'file' && organizationId && courseId && fileId) {
    // Pattern: /organizations/:organizationId/courses/:courseId/files/:scope/:fileId
    segments.push('organizations', organizationId, 'courses', courseId, 'files', scope, fileId);
  } else if (resourceType === 'pathway' && organizationId && fileId) {
    segments.push('organizations', organizationId, 'pathways', scope, fileId);
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
export function getSignedUrl(
  publicId: string,
  options: SignedUrlOptions & {
    mimeType?: string;
    extension?: string;
  } = {},
): string {
  const cloudinary = getCloudinary();

  const {
    width,
    height,
    quality = 'auto',
    format = 'auto',
    expiresInSeconds = 3600,
    resourceType = 'image',
    crop = 'fill',
    version,
    mimeType,
    extension,
  } = options;

  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

  const isSvg =
    resourceType === 'image' &&
    (mimeType === 'image/svg+xml' || extension?.toLowerCase() === 'svg');

  const urlOptions: any = {
    sign_url: true,
    expires_at: expiresAt,
    type: 'authenticated',
    resource_type: resourceType,
  };

  /**
   * 🔒 SVGs: NO TRANSFORMS. EVER.
   */
  if (!isSvg && (resourceType === 'image' || resourceType === 'video')) {
    const transformation: any = {
      crop,
      quality,
      fetch_format: format,
    };

    if (width) transformation.width = width;
    if (height) transformation.height = height;

    urlOptions.transformation = [transformation];
  }

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
 * @param version - Optional version for cache busting (e.g., timestamp)
 * @returns Signed URL for video streaming
 */
export function getVideoStreamingUrl(
  publicId: string,
  expiresInSeconds = 3600,
  version?: string | number,
): string {
  const cloudinary = getCloudinary();
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

  const urlOptions: any = {
    sign_url: true,
    expires_at: expiresAt,
    type: 'authenticated',
    resource_type: 'video',
    streaming_profile: 'hd',
    format: 'm3u8', // HLS streaming
  };

  // Add version for cache busting if provided
  if (version) {
    urlOptions.version = version;
  }

  return cloudinary.url(publicId, urlOptions);
}
