import type { SubmitCreateMultipleChoiceSingleAnswerSchemaType } from '@gonasi/schemas/plugins';

import { getUserId } from '../../../auth';
import type { TypedSupabaseClient } from '../../../client';
import type { ApiResponse } from '../../../types';

export const createMultipleChoiceSingleAnswerBlock = async (
  supabase: TypedSupabaseClient,
  blockData: SubmitCreateMultipleChoiceSingleAnswerSchemaType,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);
  const { content, lessonId, plugin_type, settings, weight } = blockData;

  try {
    const { error: insertError } = await supabase
      .from('lesson_blocks')
      .insert({
        lesson_id: lessonId,
        plugin_type: plugin_type,
        content,
        settings,
        weight,
        created_by: userId,
        updated_by: userId,
      })
      .select('id');

    if (insertError) {
      return {
        success: false,
        message: 'Unable to create the Multiple Choice (Single Answer) block. Please try again.',
      };
    }

    return {
      success: true,
      message: 'Multiple Choice (Single Answer) block created successfully.',
    };
  } catch (err) {
    console.error('Error creating Multiple Choice (Single Answer) block:', err);
    return {
      success: false,
      message:
        'An unexpected error occurred while creating the Multiple Choice (Single Answer) block. Please try again later.',
    };
  }
};
