import type { NewFileSchemaTypes } from '@gonasi/schemas/file';
import { FileType, getFileMetadata } from '@gonasi/schemas/file';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import { FILE_LIBRARY_BUCKET } from '../constants';
import type { ApiResponse } from '../types';
import { checkStorageLimitForOrg } from './checkStorageLimitForOrg';

/**
 * Uploads a file to Supabase storage and creates a corresponding record in the `file_library` table.
 *
 * Ensures metadata includes all fields required for storage limit checks.
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

    // Upload file with all required metadata
    const { data: uploadResponse, error: uploadError } = await supabase.storage
      .from(FILE_LIBRARY_BUCKET)
      .upload(`${organizationId}/${courseId}/${fileName}`, file, {
        contentType: mime_type,
        metadata: {
          size: size.toString(), // Required for storage quota RLS
          organizationId, // Required for RLS queries
          courseId, // Required for RLS queries
          originalName: name, // Optional, for reference
          extension, // Optional
          file_type, // Optional
        },
      });

    if (uploadError) {
      console.error('File upload failed:', uploadError);
      return { success: false, message: `File upload failed: ${uploadError.message}` };
    }

    // Insert file record in DB
    const { error: insertError, data } = await supabase
      .from('file_library')
      .insert({
        course_id: courseId,
        organization_id: organizationId,
        name,
        path: uploadResponse.path,
        size,
        mime_type,
        extension,
        file_type,
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single();

    if (insertError || !data) {
      // Rollback uploaded file if DB insert fails
      await supabase.storage.from(FILE_LIBRARY_BUCKET).remove([uploadResponse.path]);
      return { success: false, message: `Failed to save file metadata: ${insertError?.message}` };
    }

    // Generate BlurHash for images
    if (file_type === FileType.IMAGE) {
      supabase.functions
        .invoke('generate-blurhash', {
          body: {
            bucket: FILE_LIBRARY_BUCKET,
            object_key: uploadResponse.path,
            table: 'file_library',
            column: 'blur_preview',
            row_id_column: 'id',
            row_id_value: data.id,
          },
        })
        .catch((err) => console.error('BlurHash generation failed:', err));
    }

    return { success: true, message: 'File uploaded successfully.' };
  } catch (error) {
    console.error('Unexpected error during file creation:', error);
    return { success: false, message: 'An unexpected error occurred. Please try again.' };
  }
};
