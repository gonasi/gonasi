import {
  generatePublicId,
  generateUploadSignature,
  type UploadSignature,
} from '@gonasi/cloudinary';
import { FileType, getFileExtension, getFileType } from '@gonasi/schemas/file';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';
import { checkStorageLimitForOrg } from './checkStorageLimitForOrg';

export interface PrepareFileUploadParams {
  name: string;
  mimeType: string;
  size: number;
  courseId: string;
  organizationId: string;
}

export interface PrepareFileUploadResponse {
  fileId: string;
  uploadSignature: UploadSignature;
}

/**
 * Prepares for a client-side direct upload to Cloudinary.
 *
 * This function:
 * 1. Validates storage quota
 * 2. Generates a unique file ID
 * 3. Creates a signed upload URL for direct client → Cloudinary upload
 *
 * BENEFITS:
 * - No server memory/timeout issues (file never touches your server)
 * - Faster uploads (direct to Cloudinary)
 * - Better UX (progress tracking, resumable uploads)
 *
 * USAGE FLOW:
 * 1. Client calls this function to get upload signature
 * 2. Client uploads directly to Cloudinary using signature
 * 3. Client calls confirmFileUpload() with Cloudinary response
 *
 * @param supabase - Supabase client
 * @param params - File metadata
 * @returns Upload signature for client-side upload
 */
export const prepareFileUpload = async (
  supabase: TypedSupabaseClient,
  params: PrepareFileUploadParams,
): Promise<ApiResponse<PrepareFileUploadResponse>> => {
  const userId = await getUserId(supabase);
  const { name, size, courseId, organizationId } = params;

  try {
    // Check storage quota BEFORE generating signature
    const { success: hasSpaceSuccess, data: hasSpaceData } = await checkStorageLimitForOrg({
      supabase,
      organizationId,
      newFileSize: size,
    });

    if (!hasSpaceSuccess) {
      const fileMB = (size / 1024 / 1024).toFixed(2);
      const remainingMB =
        hasSpaceData?.remaining_bytes != null
          ? (hasSpaceData.remaining_bytes / 1024 / 1024).toFixed(2)
          : null;

      const message = remainingMB
        ? `Cannot upload ${fileMB} MB: uploading this file would exceed your storage limit. You have ${remainingMB} MB remaining.`
        : `Cannot upload ${fileMB} MB: uploading this file would exceed your organization's storage limit.`;

      return {
        success: false,
        message,
      };
    }

    // Generate unique file ID
    const fileId = crypto.randomUUID();

    // Generate Cloudinary public_id
    const publicId = generatePublicId({
      scope: 'draft',
      resourceType: 'file',
      organizationId,
      courseId,
      fileId,
    });

    // Determine file type and resource type from file extension
    const extension = getFileExtension(name);
    const file_type = getFileType(extension);
    const resourceType =
      file_type === FileType.VIDEO ? 'video' : file_type === FileType.IMAGE ? 'image' : 'raw';

    // Generate signed upload parameters
    const uploadSignature = generateUploadSignature({
      publicId,
      resourceType,
      tags: ['draft', 'file-library', courseId, organizationId],
      context: {
        organizationId,
        courseId,
        originalName: name,
        fileType: file_type,
        userId,
      },
      maxFileSize: size * 1.1, // Allow 10% buffer for encoding
    });

    return {
      success: true,
      message: 'Upload signature generated.',
      data: {
        fileId,
        uploadSignature,
      },
    };
  } catch (error) {
    console.error('[prepareFileUpload] Error:', error);
    return {
      success: false,
      message: 'Failed to prepare file upload.',
    };
  }
};
