import type { SubmitCreateTapToRevealSchemaType } from '@gonasi/schemas/plugins';

import { getUserId } from '../../../auth';
import type { TypedSupabaseClient } from '../../../client';
import type { ApiResponse } from '../../../types';
import { getNextBlockPosition } from '../blockUtils';

export const createTapToRevealBlock = async (
  supabase: TypedSupabaseClient,
  blockData: SubmitCreateTapToRevealSchemaType,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);
  const { content, lessonId, pluginType, settings, weight } = blockData;

  try {
    const nextPosition = await getNextBlockPosition({ supabase, lessonId });

    const { error } = await supabase
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

    if (error) {
      return {
        success: false,
        message: 'Failed to create the Tap to Reveal block. Please try again.',
      };
    }

    return {
      success: true,
      message: 'Tap to Reveal block created successfully.',
    };
  } catch (err) {
    console.error('Error creating Tap to Reveal block:', err);
    return {
      success: false,
      message: 'An unexpected error occurred while creating the block. Please try again later.',
    };
  }
};
