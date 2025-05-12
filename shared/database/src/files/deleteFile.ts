import type { DeleteFileSubmitValues } from '@gonasi/schemas/file';

import type { TypedSupabaseClient } from '../client';
import { FILE_LIBRARY_BUCKET } from '../constants';
import type { ApiResponse } from '../types';

export const deleteFile = async (
  supabase: TypedSupabaseClient,
  fileData: DeleteFileSubmitValues,
): Promise<ApiResponse> => {
  const { fileId, path } = fileData;

  try {
    const { data, error } = await supabase.from('file_library').select().eq('id', fileId).single();

    if (error || !data) {
      console.error('File not found or access denied:', error?.message);
      return {
        success: false,
        message: 'You do not have permission to delete this file.',
      };
    }

    const { error: deleteStorageError } = await supabase.storage
      .from(FILE_LIBRARY_BUCKET)
      .remove([path]);

    if (deleteStorageError) {
      return {
        success: false,
        message: 'Failed to delete the file from storage.',
      };
    }

    const { error: deleteDbError } = await supabase.from('file_library').delete().eq('id', fileId);

    if (deleteDbError) {
      return {
        success: false,
        message: 'Failed to delete the file record from the database.',
      };
    }

    return {
      success: true,
      message: 'File deleted successfully.',
    };
  } catch (error) {
    console.error('Unexpected error while deleting file:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    };
  }
};
