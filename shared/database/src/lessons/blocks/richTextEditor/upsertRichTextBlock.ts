import type { RichTextSchemaTypes } from '@gonasi/schemas/plugins';

import { getUserId } from '../../../auth';
import type { TypedSupabaseClient } from '../../../client';
import type { ApiResponse } from '../../../types';

export const upsertRichTextBlock = async (
  supabase: TypedSupabaseClient,
  blockData: RichTextSchemaTypes,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);
  const { blockId, content, lessonId, courseId, pluginType, settings } = blockData;

  try {
    // Insert the new rich text block
    const { error: insertError } = await supabase.from('lesson_blocks').upsert({
      id: blockId,
      lesson_id: lessonId,
      course_id: courseId,
      plugin_type: pluginType,
      content,
      settings,
      created_by: userId,
      updated_by: userId,
    });

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
