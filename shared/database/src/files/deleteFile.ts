import { deleteFromCloudinary } from '@gonasi/cloudinary';
import type { DeleteFileSchemaTypes } from '@gonasi/schemas/file';

import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

export const deleteFile = async (
  supabase: TypedSupabaseClient,
  fileData: DeleteFileSchemaTypes,
): Promise<ApiResponse> => {
  const { fileId, path } = fileData;

  try {
    // Step 1: Verify file exists and user has permission (RLS enforced)
    const { data, error } = await supabase.from('file_library').select().eq('id', fileId).single();

    if (error || !data) {
      console.error('File not found or access denied:', error?.message);
      return {
        success: false,
        message: 'You do not have permission to delete this file.',
      };
    }

    // Step 2: Determine resource type from file_type
    const resourceType =
      data.file_type === 'video' ? 'video' : data.file_type === 'image' ? 'image' : 'raw';

    // Step 3: Delete from Cloudinary
    const { success: cloudinarySuccess, error: cloudinaryError } = await deleteFromCloudinary(
      path,
      resourceType,
    );

    if (!cloudinarySuccess) {
      console.error('Cloudinary delete failed:', cloudinaryError);
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
