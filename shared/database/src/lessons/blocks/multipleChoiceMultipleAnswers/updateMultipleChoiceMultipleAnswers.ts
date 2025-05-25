import type { MultipleChoiceMultipleAnswersContentSchemaType } from '@gonasi/schemas/plugins';

import { getUserId } from '../../../auth';
import type { TypedSupabaseClient } from '../../../client';
import type { ApiResponse } from '../../../types';

interface UpdateMultipleChoiceMultipleAnswersParams {
  supabase: TypedSupabaseClient;
  blockId: string;
  content: MultipleChoiceMultipleAnswersContentSchemaType;
}

export const updateMultipleChoiceMultipleAnswers = async ({
  supabase,
  blockId,
  content,
}: UpdateMultipleChoiceMultipleAnswersParams): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);

  try {
    const { error } = await supabase
      .from('blocks')
      .update({
        content,
        updated_by: userId,
      })
      .eq('id', blockId);

    if (error) {
      return {
        success: false,
        message:
          'Failed to update the Multiple Choice (Multiple Answers) question. Please try again.',
      };
    }

    return {
      success: true,
      message: 'Multiple Choice (Multiple Answers) question updated successfully.',
    };
  } catch (err) {
    console.error('Error updating Multiple Choice (Multiple Answers) block:', err);
    return {
      success: false,
      message: 'An unexpected error occurred while updating the question. Please try again later.',
    };
  }
};
