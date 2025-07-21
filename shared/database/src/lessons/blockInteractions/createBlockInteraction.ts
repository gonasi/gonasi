import type { CompleteBlockProgressInsertSchemaTypes } from '@gonasi/schemas/publish/progressiveReveal';

import { getUserId } from '../../auth';
import type { TypedSupabaseClient } from '../../client';
import type { Json } from '../../schema';
import type { ApiResponse } from '../../types';

interface CreateBlockInteractionArgs {
  supabase: TypedSupabaseClient;
  data: CompleteBlockProgressInsertSchemaTypes;
}

interface CompleteBlockResponse {
  success: boolean;
  block_id: string;
  completed_at: string;
  navigation: {
    next_block_id: string | null;
    next_lesson_id: string | null;
    next_chapter_id: string | null;
    current_context: {
      chapter_id: string | null;
      lesson_id: string | null;
      block_id: string | null;
    };
  };
}

type ApiResponseWithNavigation = Omit<ApiResponse, 'data'> & {
  data?: {
    navigation: CompleteBlockResponse['navigation'];
    completed_at: string;
  };
};

export const createBlockInteraction = async ({
  supabase,
  data,
}: CreateBlockInteractionArgs): Promise<ApiResponseWithNavigation> => {
  const user_id = await getUserId(supabase);

  const {
    published_course_id,
    chapter_id,
    lesson_id,
    block_id,
    time_spent_seconds = 0,
    earned_score = null,
    interaction_data = null,
    last_response = null,
  } = data;

  try {
    const { data: result, error } = (await supabase.rpc('complete_block', {
      p_user_id: user_id,
      p_published_course_id: published_course_id,
      p_chapter_id: chapter_id,
      p_lesson_id: lesson_id,
      p_block_id: block_id,
      p_earned_score: earned_score === null ? undefined : earned_score,
      p_time_spent_seconds: time_spent_seconds === null ? undefined : time_spent_seconds,
      p_interaction_data: interaction_data as unknown as Json,
      p_last_response: last_response as unknown as Json,
    })) as { data: CompleteBlockResponse | { error: string } | null; error: any };

    if (error) {
      console.error('Supabase RPC error (complete_block):', error);
      return {
        success: false,
        message: 'Unable to save block progress. Please try again later.',
      };
    }

    if (result && 'error' in result) {
      console.error('RPC logic error:', result.error);
      return {
        success: false,
        message: result.error || 'Unable to save block progress.',
      };
    }

    const completeBlock = result as CompleteBlockResponse;

    return {
      success: true,
      message: 'Block progress saved successfully.',
      data: {
        navigation: completeBlock.navigation,
        completed_at: completeBlock.completed_at,
      },
    };
  } catch (err) {
    console.error('Unhandled error in createBlockInteraction:', err);
    return {
      success: false,
      message: 'Unexpected server error. Please contact support.',
    };
  }
};
