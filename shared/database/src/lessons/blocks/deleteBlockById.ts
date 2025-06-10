import { getUserId } from '../../auth';
import type { TypedSupabaseClient } from '../../client';
import type { ApiResponse } from '../../types';

/**
 * Deletes a lesson block and lets Supabase handle reordering.
 *
 * @param supabase - Supabase client instance
 * @param blockId - ID of the block to be deleted
 * @returns Result of the delete operation
 */
export const deleteBlockById = async (
  supabase: TypedSupabaseClient,
  blockId: string,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);

  try {
    // Call the stored procedure to delete the block
    const { error } = await supabase.rpc('delete_lesson_block', {
      p_block_id: blockId,
      p_deleted_by: userId,
    });

    if (error) {
      return {
        success: false,
        message: 'Couldn’t delete the block. Mind trying again?',
      };
    }

    return {
      success: true,
      message: 'Block deleted. All tidy now.',
    };
  } catch (error) {
    console.error('Error while deleting block:', error);
    return {
      success: false,
      message: 'Something went wrong. Give it another shot later.',
    };
  }
};
