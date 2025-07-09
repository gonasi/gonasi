import type { EditFileSchemaTypes } from '@gonasi/schemas/file';
import { getFileMetadata } from '@gonasi/schemas/file';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import { FILE_LIBRARY_BUCKET } from '../constants';
import type { ApiResponse } from '../types';

/**
 * Replaces a file in Supabase storage and updates image-related metadata in the `file_library` table.
 * Does not change the original file name or path.
 *
 * @param supabase - Supabase client instance.
 * @param fileData - File and metadata information.
 * @returns ApiResponse indicating success or failure.
 */
export const editFile = async (
  supabase: TypedSupabaseClient,
  fileData: EditFileSchemaTypes,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);
  const { fileId, path, file } = fileData;

  if (!file) {
    return { success: false, message: 'A file must be provided.' };
  }

  const { size, mime_type, extension, file_type } = getFileMetadata(file);

  try {
    // Replace file in storage bucket
    const { error: uploadError } = await supabase.storage
      .from(FILE_LIBRARY_BUCKET)
      .update(path, file, {
        upsert: true,
        cacheControl: '3600',
        contentType: mime_type,
        metadata: {
          size: size.toString(),
          mime_type,
          extension,
          file_type,
        },
      });

    if (uploadError) {
      console.error('File update failed:', uploadError);
      return { success: false, message: `File upload failed: ${uploadError.message}` };
    }

    // Update image-related metadata only
    const { error: updateError } = await supabase
      .from('file_library')
      .update({
        size,
        mime_type,
        extension,
        file_type,
        updated_by: userId,
      })
      .eq('id', fileId);

    if (updateError) {
      console.error('Database metadata update failed:', updateError);
      return { success: false, message: `Failed to update file metadata: ${updateError.message}` };
    }

    return {
      success: true,
      message: `File updated successfully.`,
    };
  } catch (error) {
    console.error('Unexpected error during file edit:', error);
    return { success: false, message: 'An unexpected error occurred. Please try again.' };
  }
};
