import type { EditLearningPathImageSubmitValues } from '@gonasi/schemas/learningPaths';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import { LEARNING_PATHWAYS_BUCKET } from '../constants';
import type { ApiResponse } from '../types';

// Update learning path image
export const editLearningPathFile = async (
  supabase: TypedSupabaseClient,
  assetData: EditLearningPathImageSubmitValues,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);

  const { image, imageUrl, learningPathId } = assetData;

  try {
    // Upload the new image
    const { error: uploadError } = await supabase.storage
      .from(LEARNING_PATHWAYS_BUCKET)
      .update(imageUrl, image, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      return { success: false, message: 'Failed to upload learning path image.' };
    }

    // Update learning path record
    const { error: updateError } = await supabase
      .from('pathways')
      .update({ updated_by: userId })
      .match({ id: learningPathId, created_by: userId });

    if (updateError) {
      return { success: false, message: 'Failed to update learning path details.' };
    }

    return { success: true, message: 'Learning path image updated successfully.' };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, message: 'An error occurred. Please try again.' };
  }
};
