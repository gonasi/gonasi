import { getCloudinary } from './client';
import { generatePublicId } from './helpers';

export interface CopyToPublishedParams {
  organizationId: string;
  courseId: string;
  fileId: string;
  resourceType?: 'file' | 'thumbnail'; // Optional: defaults to 'file'
}

export interface CopyToPublishedResult {
  success: boolean;
  publishedPublicId?: string;
  error?: string;
}

/**
 * Copies a file from draft folder to published folder in Cloudinary.
 * Uses Cloudinary's upload API with the source file to create a copy.
 *
 * @param draftPublicId - Public ID of the draft file
 * @param params - Organization, course, file, and environment context
 * @returns Result with success status and published public_id
 */
export async function copyToPublished(
  draftPublicId: string,
  params: CopyToPublishedParams,
): Promise<CopyToPublishedResult> {
  try {
    const cloudinary = getCloudinary();

    // Remove file extension from public_id if present
    // Cloudinary public_ids should not include file extensions
    const cleanDraftPublicId = draftPublicId.replace(/\.(jpg|jpeg|png|gif|webp|svg|mp4|mov|avi|pdf|doc|docx)$/i, '');

    // Generate published public_id
    const publishedPublicId = generatePublicId({
      scope: 'published',
      resourceType: params.resourceType || 'file', // Use provided resourceType or default to 'file'
      organizationId: params.organizationId,
      courseId: params.courseId,
      fileId: params.fileId,
    });

    console.log('[copyToPublished] Starting copy operation:', {
      originalDraftPublicId: draftPublicId,
      cleanDraftPublicId,
      publishedPublicId,
      resourceType: params.resourceType,
    });

    // Detect the resource type by trying all combinations
    // Different file types are stored with different resource_type values:
    // - Images (JPG, PNG, etc.) → 'image'
    // - Videos (MP4, MOV, etc.) → 'video'
    // - Documents (PDF, DOC, etc.) → 'raw'
    let resourceType: 'image' | 'video' | 'raw' = 'image';
    let uploadType: 'authenticated' | 'upload' | 'private' = 'authenticated';
    let found = false;
    let actualPublicId = cleanDraftPublicId;

    console.log('[Cloudinary] Detecting resource type for:', cleanDraftPublicId);

    // Try all combinations of type and resource_type with CLEANED path (no extension)
    for (const tryType of ['authenticated', 'upload', 'private'] as const) {
      if (found) break;

      for (const tryResourceType of ['image', 'video', 'raw'] as const) {
        try {
          const resourceInfo = await cloudinary.api.resource(cleanDraftPublicId, {
            type: tryType,
            resource_type: tryResourceType,
          });
          resourceType = resourceInfo.resource_type;
          uploadType = tryType;
          actualPublicId = cleanDraftPublicId;
          found = true;
          console.log('[Cloudinary] Found resource with CLEANED path:', {
            cleanDraftPublicId,
            type: tryType,
            resource_type: resourceType,
          });
          break;
        } catch {
          // Continue trying other combinations
        }
      }
    }

    // If not found with cleaned path, try ORIGINAL path (with extension)
    if (!found) {
      console.log('[Cloudinary] Not found with cleaned path, trying ORIGINAL path:', draftPublicId);

      for (const tryType of ['authenticated', 'upload', 'private'] as const) {
        if (found) break;

        for (const tryResourceType of ['image', 'video', 'raw'] as const) {
          try {
            const resourceInfo = await cloudinary.api.resource(draftPublicId, {
              type: tryType,
              resource_type: tryResourceType,
            });
            resourceType = resourceInfo.resource_type;
            uploadType = tryType;
            actualPublicId = draftPublicId;
            found = true;
            console.log('[Cloudinary] Found resource with ORIGINAL path:', {
              draftPublicId,
              type: tryType,
              resource_type: resourceType,
            });
            break;
          } catch {
            // Continue trying other combinations
          }
        }
      }
    }

    if (!found) {
      throw new Error(
        `Resource not found in Cloudinary: ${cleanDraftPublicId} (also tried: ${draftPublicId}). The file may not have been uploaded yet or was uploaded with a different public_id.`,
      );
    }

    // Generate a signed URL for the asset
    // Use the detected type (authenticated/upload/private) and resource_type
    // Use actualPublicId (which may include extension) not cleanDraftPublicId
    const signedUrl = cloudinary.url(actualPublicId, {
      sign_url: true,
      type: uploadType,
      resource_type: resourceType,
    });

    // Use Cloudinary's upload API to create a copy from the signed URL
    console.log('[copyToPublished] Uploading to published path:', {
      sourcePublicId: actualPublicId,
      signedUrlPreview: signedUrl.substring(0, 100) + '...',
      targetPublicId: publishedPublicId,
      uploadType,
      resourceType,
    });

    const result = await cloudinary.uploader.upload(signedUrl, {
      public_id: publishedPublicId,
      type: uploadType, // Maintain the same type as the source
      resource_type: resourceType,
      overwrite: true,
      invalidate: true, // Invalidate CDN cache
    });

    console.log('[copyToPublished] Upload successful:', {
      resultPublicId: result.public_id,
      resultUrl: result.secure_url,
    });

    if (!result.public_id) {
      throw new Error('Published public_id missing from response');
    }

    return {
      success: true,
      publishedPublicId: result.public_id,
    };
  } catch (error) {
    const errorDetails = {
      originalDraftPublicId: draftPublicId,
      cleanedDraftPublicId: draftPublicId.replace(/\.(jpg|jpeg|png|gif|webp|svg|mp4|mov|avi|pdf|doc|docx)$/i, ''),
      params,
      errorType: typeof error,
      error: error instanceof Error ? error.message : JSON.stringify(error),
      stack: error instanceof Error ? error.stack : undefined,
      fullError: error,
    };

    console.error('[Cloudinary Copy to Published Error]', errorDetails);

    return {
      success: false,
      error: error instanceof Error ? error.message : (typeof error === 'object' && error !== null ? JSON.stringify(error) : 'Copy failed'),
    };
  }
}

export interface DeletePublishedCourseFilesParams {
  organizationId: string;
  courseId: string;
}

export interface DeletePublishedCourseFilesResult {
  success: boolean;
  error?: string;
}

/**
 * Deletes all files in a published course folder.
 * Uses Cloudinary's bulk delete by prefix across all resource types and upload types.
 *
 * @param params - Organization and course context
 * @returns Result with success status
 */
export async function deletePublishedCourseFiles(
  params: DeletePublishedCourseFilesParams,
): Promise<DeletePublishedCourseFilesResult> {
  try {
    const cloudinary = getCloudinary();

    // Build prefixes for published course files and thumbnails
    const filePrefix = `organizations/${params.organizationId}/courses/${params.courseId}/files/published/`;
    const thumbnailPrefix = `organizations/${params.organizationId}/courses/${params.courseId}/thumbnail/published/`;

    const prefixes = [filePrefix, thumbnailPrefix];
    const types = ['authenticated', 'upload', 'private'] as const;
    const resourceTypes = ['image', 'video', 'raw'] as const;

    console.log('[deletePublishedCourseFiles] Starting comprehensive deletion:', {
      prefixes,
      types,
      resourceTypes,
    });

    // Delete across all combinations of prefix, type, and resource_type
    // This ensures we catch files regardless of how they were uploaded
    const deletionPromises = [];

    for (const prefix of prefixes) {
      for (const type of types) {
        for (const resourceType of resourceTypes) {
          deletionPromises.push(
            cloudinary.api
              .delete_resources_by_prefix(prefix, {
                type,
                resource_type: resourceType,
                invalidate: true, // Invalidate CDN cache
              })
              .catch(() => {
                // Log but don't fail - some combinations may not exist
                console.log(
                  `[deletePublishedCourseFiles] No resources found for prefix=${prefix}, type=${type}, resource_type=${resourceType}`,
                );
                return null;
              }),
          );
        }
      }
    }

    // Execute all deletions in parallel
    await Promise.all(deletionPromises);

    console.log('[deletePublishedCourseFiles] ✅ Deletion complete');
    return { success: true };
  } catch (error) {
    console.error('[Cloudinary Delete Published Course Files Error]', {
      params,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
}
