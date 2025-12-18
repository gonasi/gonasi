import { FileType, getFileExtension, getFileType } from '@gonasi/schemas/file';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

export interface ConfirmFileUploadParams {
  fileId: string;
  name: string;
  courseId: string;
  organizationId: string;
  cloudinaryPublicId: string;
  size: number;
  mimeType: string;
}

/**
 * Confirms a file upload after client-side direct upload to Cloudinary completes.
 *
 * Creates the database record in file_library with the Cloudinary upload details.
 *
 * USAGE FLOW:
 * 1. Client calls prepareFileUpload() to get signature
 * 2. Client uploads directly to Cloudinary
 * 3. Cloudinary returns upload response
 * 4. Client calls THIS function with Cloudinary response data
 *
 * @param supabase - Supabase client
 * @param params - File metadata from Cloudinary upload response
 * @returns Success/failure status
 */
export const confirmFileUpload = async (
  supabase: TypedSupabaseClient,
  params: ConfirmFileUploadParams,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);
  const { fileId, name, courseId, organizationId, cloudinaryPublicId, size, mimeType } = params;

  try {
    // Debug logging
    console.log('[confirmFileUpload] Params:', {
      name,
      mimeType,
      fileId,
    });

    // Extract extension - validate it's real, otherwise fall back to mime type
    const extractedExt = getFileExtension(name);
    const isValidExtension = extractedExt && name.includes('.') && extractedExt.length > 0;

    // For mime types like "image/svg+xml", extract only "svg" (before the +)
    const mimeSubtype = mimeType.split('/')[1] || 'bin';
    const cleanedMimeExt = mimeSubtype.split('+')[0]; // "svg+xml" -> "svg"

    const extension = isValidExtension ? extractedExt : cleanedMimeExt;

    // Determine file type from MIME type (not user-provided name)
    // This ensures files save with correct type even if user names file without extension
    const file_type = (() => {
      if (mimeType.startsWith('image/')) return FileType.IMAGE;
      if (mimeType.startsWith('video/')) return FileType.VIDEO;
      if (mimeType.startsWith('audio/')) return FileType.AUDIO;
      if (mimeType.startsWith('model/')) return FileType.MODEL_3D;
      // For other types, try to detect from file extension
      return getFileType(extension);
    })();

    console.log('[confirmFileUpload] Detected:', {
      file_type,
      extension,
      FileTypeEnum: FileType.IMAGE,
    });

    // Insert file record in database
    const { error: insertError } = await supabase.from('file_library').insert({
      id: fileId,
      course_id: courseId,
      organization_id: organizationId,
      name,
      path: cloudinaryPublicId,
      size,
      mime_type: mimeType,
      extension,
      file_type,
      created_by: userId,
      updated_by: userId,
      blur_preview: null, // Generated dynamically from Cloudinary
    });

    if (insertError) {
      console.error('[confirmFileUpload] Database insert failed:', insertError);
      return {
        success: false,
        message: `Failed to save file metadata: ${insertError.message}`,
      };
    }

    return {
      success: true,
      message: 'File uploaded successfully.',
    };
  } catch (error) {
    console.error('[confirmFileUpload] Error:', error);
    return {
      success: false,
      message: 'Failed to confirm file upload.',
    };
  }
};
