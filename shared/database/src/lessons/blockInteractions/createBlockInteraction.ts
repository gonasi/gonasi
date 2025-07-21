import type { CompleteBlockProgressInsertSchemaTypes } from '@gonasi/schemas/publish/progressiveReveal';

import { getUserId } from '../../auth';
import type { TypedSupabaseClient } from '../../client';
import type { Json } from '../../schema';
import type { ApiResponse } from '../../types';

interface CreateBlockInteractionArgs {
  supabase: TypedSupabaseClient;
  data: CompleteBlockProgressInsertSchemaTypes;
}

export const createBlockInteraction = async ({
  supabase,
  data,
}: CreateBlockInteractionArgs): Promise<ApiResponse> => {
  const user_id = await getUserId(supabase);

  const {
    organization_id,
    published_course_id,
    chapter_id,
    lesson_id,
    block_id,

    started_at,
    completed_at,
    time_spent_seconds,

    earned_score,
    attempt_count,
    interaction_data,
    last_response,
  } = data;

  try {
    const { error } = await supabase.from('block_progress').insert({
      user_id,
      organization_id,
      published_course_id,
      chapter_id,
      lesson_id,
      block_id,

      is_completed: true,
      started_at,
      completed_at,
      time_spent_seconds: time_spent_seconds ?? 0,

      earned_score: earned_score ?? null,
      attempt_count: attempt_count ?? null,
      interaction_data: interaction_data ? (interaction_data as unknown as Json) : null,
      last_response: last_response ? (last_response as unknown as Json) : null,
    });

    if (error) {
      console.error('Error creating block_progress:', error);
      return {
        success: false,
        message: 'Unable to save block progress. Please try again later.',
      };
    }

    return {
      success: true,
      message: 'Block progress saved successfully.',
    };
  } catch (err) {
    console.error('Unhandled error in createBlockInteraction:', err);
    return {
      success: false,
      message: 'Unexpected server error. Please contact support.',
    };
  }
};
