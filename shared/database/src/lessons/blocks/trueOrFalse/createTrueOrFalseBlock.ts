import type { SubmitCreateTrueOrFalseSchemaType } from '@gonasi/schemas/plugins';

import { getUserId } from '../../../auth';
import type { TypedSupabaseClient } from '../../../client';
import type { ApiResponse } from '../../../types';

export const createTrueOrFalseBlock = async (
  supabase: TypedSupabaseClient,
  blockData: SubmitCreateTrueOrFalseSchemaType,
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
        message: 'Unable to create the True or False block. Please try again.',
      };
    }

    return {
      success: true,
      message: 'True or False block created successfully.',
    };
  } catch (err) {
    console.error('Error creating True or False block:', err);
    return {
      success: false,
      message:
        'An unexpected error occurred while creating the True or False block. Please try again later.',
    };
  }
};
