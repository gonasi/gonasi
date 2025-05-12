import type { EditFileNameSubmitValues } from '@gonasi/schemas/file';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

export const editFileName = async (
  supabase: TypedSupabaseClient,
  { name, fileId }: EditFileNameSubmitValues,
): Promise<ApiResponse> => {
  try {
    const userId = await getUserId(supabase);

    const { error } = await supabase
      .from('file_library')
      .update({ name, updated_by: userId })
      .eq('id', fileId);

    if (error) {
      return {
        success: false,
        message: `Failed to update file: ${error.message}`,
      };
    }

    return {
      success: true,
      message: 'File updated successfully.',
    };
  } catch (err) {
    console.error('Unexpected error while updating file name:', err);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
};
