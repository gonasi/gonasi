import type { RichTextSchemaTypes } from '@gonasi/schemas/plugins';

import { getUserId } from '../../../auth';
import type { TypedSupabaseClient } from '../../../client';
import type { ApiResponse } from '../../../types';
import { getNextBlockPosition } from '../blockUtils';

export const createRichTextBlock = async (
  supabase: TypedSupabaseClient,
  blockData: RichTextSchemaTypes,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);
  const { content, lessonId, pluginType, settings, weight } = blockData;

  try {
    const nextPosition = await getNextBlockPosition({
      supabase,
      lessonId,
    });

    // Insert the new rich text block
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
        message: 'Failed to create the new rich text block. Please try again.',
      };
    }

    return {
      success: true,
      message: 'Rich text block created successfully.',
    };
  } catch (err) {
    console.error('Unexpected error in createRichTextBlock:', err);
    return {
      success: false,
      message:
        'An unexpected error occurred while creating the rich text block. Please try again later.',
    };
  }
};
