import type { Block } from '@gonasi/schemas/plugins';

import { getUserId } from '../../auth';
import type { TypedSupabaseClient } from '../../client';
import type { ApiResponse } from '../../types';

// Only allow content to be updated
type UpdatableBlockFields = Pick<Block, 'content'>;

export const updateLessonBlock = async (
  supabase: TypedSupabaseClient,
  blockId: string,
  blockData: UpdatableBlockFields,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);
  const { content } = blockData;

  try {
    const { error: updateError } = await supabase
      .from('blocks')
      .update({
        content,
        updated_by: userId,
      })
      .eq('id', blockId);

    if (updateError) {
      return {
        success: false,
        message: 'Failed to update the block.',
      };
    }

    // TODO: Reset lesson progress of users

    return {
      success: true,
      message: 'Block updated successfully.',
    };
  } catch (err) {
    console.error('Unexpected error in updateLessonBlock:', err);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
};
