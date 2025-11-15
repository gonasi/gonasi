import type { NewFileSchemaTypes } from '@gonasi/schemas/file';

import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

/**
 * Client-side wrapper for the upload-file edge function
 */
export const createFile = async (
  supabase: TypedSupabaseClient,
  newFileData: NewFileSchemaTypes,
): Promise<ApiResponse> => {
  const { file, name, courseId, organizationId } = newFileData;

  if (!file) {
    return { success: false, message: 'A file must be provided.' };
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, message: 'User not authenticated.' };
    }

    // Prepare form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('organizationId', organizationId);
    formData.append('courseId', courseId);
    formData.append('name', name);
    formData.append('userId', user.id);

    // Invoke using Supabase SDK (no fetch)
    const { data, error } = await supabase.functions.invoke('create-new-course-file', {
      body: formData,
    });

    if (error) {
      return {
        success: false,
        message: error.message ?? 'Upload failed',
      };
    }

    return {
      success: true,
      message: data?.message ?? 'File uploaded successfully.',
      data: data?.data,
    };
  } catch (error) {
    console.error('Unexpected error during file upload:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
};
