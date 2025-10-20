import { getFileMetadata, type NewFileSchemaTypes } from '@gonasi/schemas/file';

import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

/**
 * Uploads a file to Cloudinary via Edge Function and creates a record in the `file_library` table.
 * Works in Node.js / Deno (server-side only).
 */
export const newCourseFile = async (
  supabase: TypedSupabaseClient,
  newFileData: NewFileSchemaTypes,
): Promise<ApiResponse> => {
  const { file, name, courseId, organizationId } = newFileData;

  if (!file) {
    return { success: false, message: 'A file must be provided.' };
  }

  // Extract file metadata
  const { file_type } = getFileMetadata(file);

  try {
    // Convert file to base64 (server-side safe)
    let base64String: string;

    if (file instanceof Buffer) {
      // Node Buffer
      base64String = file.toString('base64');
    } else if (typeof file.arrayBuffer === 'function') {
      // Blob or File
      const arrayBuffer = await file.arrayBuffer();
      base64String = Buffer.from(arrayBuffer).toString('base64');
    } else {
      throw new Error('Unsupported file type for base64 encoding.');
    }

    // Prepare payload
    const payload = {
      organization_id: organizationId,
      course_id: courseId,
      file_name: name,
      file_type,
      file_data: base64String,
    };

    // Invoke edge function
    const { data, error } = await supabase.functions.invoke('new-course-file', {
      body: payload,
    });

    if (error) {
      console.error('[newCourseFile] Edge Function error:', error);
      return { success: false, message: error.message ?? 'File upload failed.' };
    }

    return {
      success: true,
      message: 'File uploaded successfully.',
      data,
    };
  } catch (error) {
    console.error('[newCourseFile] Unexpected error:', error);
    return { success: false, message: 'An unexpected error occurred. Please try again.' };
  }
};
