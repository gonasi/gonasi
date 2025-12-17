import {
  deleteFromCloudinary,
  generatePublicId,
  uploadToCloudinary,
} from '@gonasi/cloudinary';
import type { NewFileSchemaTypes } from '@gonasi/schemas/file';
import { FileType, getFileMetadata } from '@gonasi/schemas/file';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';
import { checkStorageLimitForOrg } from './checkStorageLimitForOrg';

/**
 * Uploads a file to Cloudinary (authenticated delivery) and creates a corresponding record in the `file_library` table.
 *
 * Ensures metadata includes all fields required for storage limit checks.
 * Uses Cloudinary for private file storage with signed URL access.
 */
export const createFile = async (
  supabase: TypedSupabaseClient,
  newFileData: NewFileSchemaTypes,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);
  const { file, name, courseId, organizationId } = newFileData;

  if (!file) {
    return { success: false, message: 'A file must be provided.' };
  }

  const { name: fileName, size, mime_type, extension, file_type } = getFileMetadata(file);

  try {
    const { success: hasSpaceSuccess, data: hasSpaceData } = await checkStorageLimitForOrg({
      supabase,
      organizationId,
      newFileSize: file.size,
    });

    if (!hasSpaceSuccess) {
      const fileMB = (file.size / 1024 / 1024).toFixed(2);
      const remainingMB =
        hasSpaceData?.remaining_bytes != null
          ? (hasSpaceData.remaining_bytes / 1024 / 1024).toFixed(2)
          : null;

      const message = remainingMB
        ? `Cannot upload ${fileMB} MB: uploading this file would exceed your storage limit. You have ${remainingMB} MB remaining.`
        : `Cannot upload ${fileMB} MB: uploading this file would exceed your organization’s storage limit.`;

      return {
        success: false,
        message,
      };
    }

    // Generate unique file ID and Cloudinary public_id
    const fileId = crypto.randomUUID();

    const publicId = generatePublicId({
      scope: 'draft',
      resourceType: 'file',
      organizationId,
      courseId,
      fileId,
    });

    // Determine resource type for Cloudinary
    const resourceType =
      file_type === FileType.VIDEO ? 'video' : file_type === FileType.IMAGE ? 'image' : 'raw';

    // Upload file to Cloudinary with authenticated delivery (private)
    const uploadResult = await uploadToCloudinary(file, publicId, {
      resourceType,
      type: 'authenticated', // CRITICAL: Makes file private
      tags: ['draft', 'file-library', courseId, organizationId],
      context: {
        organizationId,
        courseId,
        originalName: name,
        fileType: file_type,
      },
    });

    if (!uploadResult.success) {
      console.error('Cloudinary upload failed:', uploadResult.error);
      return { success: false, message: `File upload failed: ${uploadResult.error}` };
    }

    // Insert file record in DB
    const { error: insertError, data } = await supabase
      .from('file_library')
      .insert({
        id: fileId, // Use same ID as Cloudinary public_id component
        course_id: courseId,
        organization_id: organizationId,
        name,
        path: publicId, // Store Cloudinary public_id
        size,
        mime_type,
        extension,
        file_type,
        created_by: userId,
        updated_by: userId,
        blur_preview: null, // Generate dynamically from Cloudinary
      })
      .select()
      .single();

    if (insertError || !data) {
      // Rollback: Delete from Cloudinary if DB insert fails
      await deleteFromCloudinary(publicId, resourceType);
      return { success: false, message: `Failed to save file metadata: ${insertError?.message}` };
    }

    // Blur previews are now generated dynamically via Cloudinary transformations
    // No async processing needed

    return { success: true, message: 'File uploaded successfully.' };
  } catch (error) {
    console.error('Unexpected error during file creation:', error);
    return { success: false, message: 'An unexpected error occurred. Please try again.' };
  }
};
