import type { BaseInteractionSchemaType } from '@gonasi/schemas/plugins';

import { getUserId } from '../../auth';
import type { TypedSupabaseClient } from '../../client';
import type { ApiResponse } from '../../types';

/**
 * Creates a new block interaction entry in the database for the current user.
 *
 * @param supabase - An authenticated Supabase client instance.
 * @param blockInteractionData - The interaction data to be recorded.
 * @returns A promise that resolves to an ApiResponse indicating success or failure.
 */
export const createBlockInteraction = async (
  supabase: TypedSupabaseClient,
  blockInteractionData: BaseInteractionSchemaType,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);

  const {
    block_id,
    lesson_id,
    is_complete,
    score,
    attempts,
    state,
    last_response,
    feedback,
    started_at,
    completed_at,
    time_spent_seconds,
  } = blockInteractionData;

  try {
    const { error } = await supabase.from('block_interactions').insert({
      user_id: userId,
      block_id,
      lesson_id,
      is_complete,
      score,
      attempts,
      state,
      last_response,
      feedback,
      started_at,
      completed_at,
      time_spent_seconds,
    });

    if (error) {
      console.log('Error creating block interaction:', error);
      return {
        success: false,
        message: 'Unable to save block interaction. Please try again later.',
      };
    }

    return {
      success: true,
      message: 'Block interaction saved successfully.',
    };
  } catch (err) {
    console.error('Error in createBlockInteraction:', err);
    return {
      success: false,
      message: 'Unexpected server error. Please contact support if the issue persists.',
    };
  }
};
