import { getUserId } from '../../auth';
import type { TypedSupabaseClient } from '../../client';
import type { ApiResponse } from '../../types';

/**
 * Deletes a block by its ID and reorders the remaining blocks in the same lesson.
 *
 * @param {TypedSupabaseClient} supabase - The Supabase client instance.
 * @param {DeleteBlockSubmitValues} blockData - The block ID to delete.
 * @returns {Promise<ApiResponse>} The response indicating success or failure.
 */
export const deleteBlockById = async (
  supabase: TypedSupabaseClient,
  blockId: string,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);

  try {
    // Step 1: Get block's lesson_id and position
    const { data: block, error: fetchError } = await supabase
      .from('blocks')
      .select('lesson_id, position')
      .match({ id: blockId, created_by: userId })
      .single();

    if (fetchError || !block) {
      return {
        success: false,
        message: "Block not found or you don't have permission to delete it.",
      };
    }

    const { lesson_id, position: deletedPosition } = block;

    // Step 2: Delete the block
    const { error: deleteError } = await supabase
      .from('blocks')
      .delete()
      .match({ id: blockId, created_by: userId });

    if (deleteError) {
      return {
        success: false,
        message: 'Unable to delete the block. Please try again.',
      };
    }

    // Step 3: Fetch blocks with higher position
    const { data: blocksToUpdate, error: fetchBlocksError } = await supabase
      .from('blocks')
      .select('id, position')
      .eq('lesson_id', lesson_id)
      .gt('position', deletedPosition);

    if (fetchBlocksError) {
      return {
        success: false,
        message: 'Block deleted, but failed to fetch remaining blocks for reordering.',
      };
    }

    // Step 4: Decrement their positions
    for (const block of blocksToUpdate || []) {
      await supabase
        .from('blocks')
        .update({ position: (block.position || 0) - 1 })
        .eq('id', block.id);
    }

    // TODO: Reset lesson progress of users

    return { success: true, message: 'Block successfully deleted.' };
  } catch (error) {
    console.error('Unexpected error while deleting block:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    };
  }
};
