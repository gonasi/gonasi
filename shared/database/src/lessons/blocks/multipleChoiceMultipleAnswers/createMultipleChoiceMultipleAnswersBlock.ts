import type { SubmitCreateMultipleChoiceMultipleAnswersSchemaType } from '@gonasi/schemas/plugins';

import { getUserId } from '../../../auth';
import type { TypedSupabaseClient } from '../../../client';
import type { ApiResponse } from '../../../types';
import { getNextBlockPosition } from '../blockUtils';

export const createMultipleChoiceMultipleAnswersBlock = async (
  supabase: TypedSupabaseClient,
  blockData: SubmitCreateMultipleChoiceMultipleAnswersSchemaType,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);
  const { content, lessonId, pluginType, settings, weight } = blockData;

  try {
    const nextPosition = await getNextBlockPosition({ supabase, lessonId });

    const { error: insertError } = await supabase
      .from('blocks')
      .insert({
        lesson_id: lessonId,
        plugin_type: pluginType,
        position: nextPosition,
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
        message: 'Unable to create the Multiple Choice (Multiple Answers) block. Please try again.',
      };
    }

    return {
      success: true,
      message: 'Multiple Choice (Multiple Answers) block created successfully.',
    };
  } catch (err) {
    console.error('Error creating Multiple Choice (Multiple Answers) block:', err);
    return {
      success: false,
      message: 'An unexpected error occurred while creating the block. Please try again later.',
    };
  }
};
