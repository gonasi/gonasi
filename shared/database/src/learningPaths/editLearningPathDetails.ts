import type { EditLearningPathDetailsSubmitValues } from '@gonasi/schemas/learningPaths';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

export const editLearningPathDetails = async (
  supabase: TypedSupabaseClient,
  learningPathData: EditLearningPathDetailsSubmitValues,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);

  const { name, description, learningPathId } = learningPathData;

  try {
    // Update learning path details in the database
    const { error: updateError } = await supabase
      .from('pathways')
      .update({ name, description, updated_by: userId })
      .match({ id: learningPathId, created_by: userId });

    if (updateError) {
      return { success: false, message: `Failed to update learning path: ${updateError.message}` };
    }

    return { success: true, message: 'Learning path updated successfully.' };
  } catch (error) {
    console.error('Unexpected error while updating learning path:', error);
    return { success: false, message: 'An unexpected error occurred. Please try again.' };
  }
};
