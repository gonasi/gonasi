import { z } from 'zod';

import type { CompleteBlockProgressInsertSchemaTypes } from '@gonasi/schemas/publish/progressiveReveal';
import { UnifiedNavigationSchema } from '@gonasi/schemas/publish/unified-navigation';
import { safeDateTime } from '@gonasi/schemas/utils';

import type { TypedSupabaseClient } from '../../client';
import type { Json } from '../../schema';
import type { ApiResponse } from '../../types';

// =====================================================================================
// ✅ Define expected structure of the complete_block return payload using Zod
// =====================================================================================
const CompleteBlockResponseSchema = z.object({
  success: z.boolean(),
  user_id: z.string().uuid(),
  block_id: z.string().uuid(),
  lesson_id: z.string().uuid(),
  chapter_id: z.string().uuid(),
  was_already_completed: z.boolean(),
  completed_at: safeDateTime(),
  navigation: UnifiedNavigationSchema,
  // Add new fields for progress record IDs
  lesson_progress_id: z.string().uuid(),
  chapter_progress_id: z.string().uuid(),
  course_progress_id: z.string().uuid(),
});

type UnifiedNavigation = z.infer<typeof UnifiedNavigationSchema>;

// =====================================================================================
// ✅ Return shape for calling functions
// =====================================================================================
interface CreateBlockInteractionArgs {
  supabase: TypedSupabaseClient;
  data: CompleteBlockProgressInsertSchemaTypes;
}

type ApiResponseWithNavigation = Omit<ApiResponse, 'data'> & {
  data?: {
    navigation: UnifiedNavigation;
    completed_at: string;
    lesson_progress_id: string;
    chapter_progress_id: string;
    course_progress_id: string;
  };
};

// =====================================================================================
// ✅ Main function
// =====================================================================================
export const createBlockInteraction = async ({
  supabase,
  data,
}: CreateBlockInteractionArgs): Promise<ApiResponseWithNavigation> => {
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
      p_published_course_id: published_course_id,
      p_chapter_id: chapter_id,
      p_lesson_id: lesson_id,
      p_block_id: block_id,
      p_earned_score: earned_score ?? undefined,
      p_time_spent_seconds: time_spent_seconds ?? undefined,
      p_interaction_data: interaction_data as unknown as Json,
      p_last_response: last_response as unknown as Json,
    })) as { data: unknown; error: any };

    if (error) {
      console.error('Supabase RPC error (complete_block):', JSON.stringify(error, null, 2));
      return {
        success: false,
        message: 'Unable to save block progress. Please try again later.',
      };
    }

    // Handle possible logic-level error returned from function
    if (result && typeof result === 'object' && 'error' in result) {
      const errMsg = (result as any).error;
      console.error('RPC logic error:', result);
      return {
        success: false,
        message: errMsg || 'Unable to save block progress.',
      };
    }

    console.log('result is: ', JSON.stringify(result));

    // Validate result shape using Zod
    const parsed = CompleteBlockResponseSchema.safeParse(result);
    if (!parsed.success) {
      console.error(
        'Invalid response from complete_block:',
        JSON.stringify(parsed.error.format(), null, 2),
      );
      return {
        success: false,
        message: 'Unexpected server response. Please try again.',
      };
    }

    const completeBlock = parsed.data;

    return {
      success: true,
      message: 'Block progress saved successfully.',
      data: {
        navigation: completeBlock.navigation,
        completed_at: completeBlock.completed_at,
        lesson_progress_id: completeBlock.lesson_progress_id,
        chapter_progress_id: completeBlock.chapter_progress_id,
        course_progress_id: completeBlock.course_progress_id,
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
