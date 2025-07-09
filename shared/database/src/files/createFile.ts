import type { NewFileSchemaTypes } from '@gonasi/schemas/file';
import { getFileMetadata } from '@gonasi/schemas/file';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import { FILE_LIBRARY_BUCKET } from '../constants';
import type { ApiResponse } from '../types';
import { checkStorageLimit } from './checkStorageLimit';

/**
 * Uploads a file to Supabase storage and creates a corresponding record in the `file_library` table.
 *
 * @param supabase - Supabase client instance.
 * @param newFileData - The file data to be uploaded and stored.
 * @returns ApiResponse indicating success or failure.
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

  // Check storage limits before attempting upload
  const storageCheck = await checkStorageLimit(supabase, organizationId, size);
  if (!storageCheck.success) {
    return { success: false, message: storageCheck.message || 'Storage limit exceeded' };
  }

  try {
    // Upload file to Supabase storage with metadata
    const { data: uploadResponse, error: uploadError } = await supabase.storage
      .from(FILE_LIBRARY_BUCKET)
      .upload(`${organizationId}/${courseId}/${fileName}`, file, {
        contentType: mime_type,
        metadata: {
          size: size.toString(),
          organizationId,
          courseId,
          originalName: name,
          extension,
          file_type,
        },
      });

    if (uploadError) {
      console.error('File upload failed:', uploadError);
      return { success: false, message: `File upload failed: ${uploadError.message}` };
    }

    // Create file metadata entry in the database
    const { error: insertError } = await supabase.from('file_library').insert({
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
    });

    if (insertError) {
      // Rollback uploaded file if DB insert fails
      await supabase.storage.from(FILE_LIBRARY_BUCKET).remove([uploadResponse.path]);
      return { success: false, message: `Failed to save file metadata: ${insertError.message}` };
    }

    return {
      success: true,
      message: `File uploaded successfully. Storage used: ${storageCheck.currentUsage}MB / ${storageCheck.limit}MB`,
    };
  } catch (error) {
    console.error('Unexpected error during file creation:', error);
    return { success: false, message: 'An unexpected error occurred. Please try again.' };
  }
};
