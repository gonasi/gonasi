import type { EditFileSchemaTypes } from '@gonasi/schemas/file';
import { getFileMetadata } from '@gonasi/schemas/file';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import { FILE_LIBRARY_BUCKET } from '../constants';
import type { ApiResponse } from '../types';

// Updates a file in the file library bucket and its metadata in the database
export const editFile = async (
  supabase: TypedSupabaseClient,
  fileData: EditFileSchemaTypes,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);
  const { fileId, path, file } = fileData;

  try {
    const { size, mime_type, extension, file_type } = getFileMetadata(file);

    // Upload new file to storage bucket
    const { error: uploadError } = await supabase.storage
      .from(FILE_LIBRARY_BUCKET)
      .update(path, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: mime_type,
      });

    if (uploadError) {
      return { success: false, message: 'Failed to upload the file.' };
    }

    // Update metadata in the file_library table
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
      return { success: false, message: 'Failed to update file metadata.' };
    }

    return { success: true, message: 'File updated successfully.' };
  } catch (error) {
    console.error('editFile error:', error);
    return { success: false, message: 'Unexpected error. Please try again.' };
  }
};
