import type { MultipleChoiceSingleAnswerContentSchemaType } from '@gonasi/schemas/plugins';

import { getUserId } from '../../../auth';
import type { TypedSupabaseClient } from '../../../client';
import type { ApiResponse } from '../../../types';

interface UpdateMultipleChoiceSingleAnswerParams {
  supabase: TypedSupabaseClient;
  blockId: string;
  content: MultipleChoiceSingleAnswerContentSchemaType;
}

export const updateMultipleChoiceSingleAnswer = async ({
  supabase,
  blockId,
  content,
}: UpdateMultipleChoiceSingleAnswerParams): Promise<ApiResponse> => {
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
        message: 'Unable to update multiple choice question. Please try again.',
      };
    }

    return {
      success: true,
      message: 'Multiple choice question updated successfully.',
    };
  } catch (err) {
    console.error('Error updating multiple choice block:', err);
    return {
      success: false,
      message: 'Unexpected error. Please try again later.',
    };
  }
};
