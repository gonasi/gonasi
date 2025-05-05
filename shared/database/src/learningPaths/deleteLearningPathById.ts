import type { DeleteLearningPathSubmitValues } from '@gonasi/schemas/learningPaths';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import { LEARNING_PATHWAYS_BUCKET } from '../constants';
import type { ApiResponse } from '../types';

export const deleteLearningPathById = async (
  supabase: TypedSupabaseClient,
  learningPathData: DeleteLearningPathSubmitValues,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);

  const { learningPathId, imageUrl } = learningPathData;

  try {
    const { data, error } = await supabase
      .from('pathways')
      .select()
      .match({ id: learningPathId, created_by: userId })
      .single();

    if (error || !data) {
      console.error('Learning path not found or access denied:', error?.message);
      return { success: false, message: 'You can only delete learning paths you created.' };
    }

    const { error: deleteError } = await supabase.storage
      .from(LEARNING_PATHWAYS_BUCKET)
      .remove([imageUrl]);

    if (deleteError) {
      return { success: false, message: 'Failed to remove the associated image file.' };
    }

    const { error: deleteDbError } = await supabase
      .from('pathways')
      .delete()
      .match({ id: learningPathId, created_by: userId });

    if (deleteDbError) {
      return { success: false, message: 'Failed to delete the learning path.' };
    }

    return { success: true, message: 'Learning path deleted successfully.' };
  } catch (error) {
    console.error('Unexpected error while deleting learning path:', error);
    return { success: false, message: 'Something went wrong. Please try again later.' };
  }
};
