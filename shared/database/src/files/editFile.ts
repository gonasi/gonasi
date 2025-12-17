import { uploadToCloudinary } from '@gonasi/cloudinary';
import type { EditFileSchemaTypes } from '@gonasi/schemas/file';
import { FileType, getFileMetadata } from '@gonasi/schemas/file';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

/**
 * Replaces a file in Cloudinary storage and updates metadata in the `file_library` table.
 * Does not change the original file path (public_id).
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
    // Determine resource type for Cloudinary
    const resourceType =
      file_type === FileType.VIDEO ? 'video' : file_type === FileType.IMAGE ? 'image' : 'raw';

    // Re-upload to Cloudinary (overwrites existing file at same public_id)
    const uploadResult = await uploadToCloudinary(file, path, {
      resourceType,
      type: 'authenticated', // Maintain authenticated type
      overwrite: true, // Replace existing file
    });

    if (!uploadResult.success) {
      console.error('File update failed:', uploadResult.error);
      return { success: false, message: `File upload failed: ${uploadResult.error}` };
    }

    // Update image-related metadata only
    const { error: updateError, data } = await supabase
      .from('file_library')
      .update({
        size,
        mime_type,
        extension,
        file_type,
        updated_by: userId,
      })
      .eq('id', fileId)
      .select()
      .single();

    if (updateError || !data) {
      console.error('Database metadata update failed:', updateError);
      return { success: false, message: `Failed to update file metadata: ${updateError.message}` };
    }

    // Blur previews are now generated dynamically via Cloudinary transformations
    // No async processing needed

    return {
      success: true,
      message: `File updated successfully.`,
    };
  } catch (error) {
    console.error('Unexpected error during file edit:', error);
    return { success: false, message: 'An unexpected error occurred. Please try again.' };
  }
};
