import { type Block, getSettingsSchemaByType } from '@gonasi/schemas/plugins';

import { getUserId } from '../../auth';
import type { TypedSupabaseClient } from '../../client';
import type { ApiResponse } from '../../types';

export const createLessonBlock = async (
  supabase: TypedSupabaseClient,
  blockData: Block,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);
  const { lesson_id, plugin_type, content } = blockData;

  try {
    // Get the highest existing block position for the lesson
    const { data: maxPositionResult, error: positionError } = await supabase
      .from('blocks')
      .select('position')
      .eq('lesson_id', lesson_id)
      .order('position', { ascending: false })
      .limit(1)
      .single();

    // Allow "no rows found" error (PGRST116) to fall through
    if (positionError && positionError.code !== 'PGRST116') {
      return {
        success: false,
        message: 'Unable to determine the position for the new block.',
      };
    }

    const nextPosition = maxPositionResult?.position != null ? maxPositionResult.position + 1 : 0;

    const schema = getSettingsSchemaByType(blockData.plugin_type);

    const defaultSettings = schema.parse({});

    // Insert the new block at the next position
    const { error: insertError } = await supabase
      .from('blocks')
      .insert({
        lesson_id,
        plugin_type,
        position: nextPosition,
        content,
        settings: defaultSettings,
        created_by: userId,
        updated_by: userId,
      })
      .select('id');

    if (insertError) {
      return {
        success: false,
        message: 'Failed to add the new block to the lesson.',
      };
    }

    return {
      success: true,
      message: 'Block added successfully.',
    };
  } catch (err) {
    console.error('Unexpected error in createLessonBlock:', err);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
};
