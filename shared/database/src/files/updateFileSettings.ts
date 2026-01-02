import type { Model3DSettings } from '@gonasi/schemas/file';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

export interface UpdateFileSettingsParams {
  fileId: string;
  settings: Model3DSettings;
}

export const updateFileSettings = async (
  supabase: TypedSupabaseClient,
  params: UpdateFileSettingsParams,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);
  const { fileId, settings } = params;

  try {
    const { error } = await supabase
      .from('file_library')
      .update({
        settings: { model3d: settings },
        updated_by: userId,
      })
      .eq('id', fileId);

    if (error) {
      console.error('[updateFileSettings] Database update failed:', error);
      return {
        success: false,
        message: `Failed to update file settings: ${error.message}`,
      };
    }

    return {
      success: true,
      message: '3D model configuration saved successfully.',
    };
  } catch (error) {
    console.error('[updateFileSettings] Error:', error);
    return {
      success: false,
      message: 'Failed to update file settings.',
    };
  }
};
