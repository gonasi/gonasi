import { getFileMetadata, type NewFileLibrarySubmitValues } from '@gonasi/schemas/file';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import { FILE_LIBRARY_BUCKET } from '../constants';
import type { ApiResponse } from '../types';

/**
 * Uploads a file to Supabase storage and creates a corresponding record in the `file_library` table.
 *
 * @param supabase - Supabase client instance.
 * @param newFileData - The file data to be uploaded and stored.
 * @returns ApiResponse indicating success or failure.
 */
export const createFile = async (
  supabase: TypedSupabaseClient,
  newFileData: NewFileLibrarySubmitValues,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);
  const { file, name, companyId } = newFileData;

  if (!file) {
    return { success: false, message: 'A file must be provided.' };
  }

  const { name: fileName, size, mime_type, extension, file_type } = getFileMetadata(file);

  try {
    // Upload file to Supabase storage
    const { data: uploadResponse, error: uploadError } = await supabase.storage
      .from(FILE_LIBRARY_BUCKET)
      .upload(`${companyId}/${fileName}`, file, {
        contentType: mime_type,
      });

    if (uploadError) {
      return { success: false, message: `File upload failed: ${uploadError.message}` };
    }

    // Create file metadata entry in the database
    const { error: insertError } = await supabase.from('file_library').insert({
      company_id: companyId,
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

    return { success: true, message: 'File uploaded and recorded successfully.' };
  } catch (error) {
    console.error('Unexpected error during file creation:', error);
    return { success: false, message: 'An unexpected error occurred. Please try again.' };
  }
};
