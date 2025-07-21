import {
  PublishedLessonWithProgressSchema,
  type PublishedLessonWithProgressSchemaTypes,
} from '@gonasi/schemas/publish/progressiveReveal';

import type { TypedSupabaseClient } from '../client';

// ---------------------------------------------
// Types
// ---------------------------------------------

interface FetchLessonWithProgressArgs {
  supabase: TypedSupabaseClient;
  courseId: string;
  chapterId: string;
  lessonId: string;
  revealMode?: 'progressive' | 'all' | 'linear';
}

// Adds a data-type tag to the parsed lesson data
export type ParsedLessonWithProgress = PublishedLessonWithProgressSchemaTypes & {
  _dataType: 'progressive_reveal';
};

// ---------------------------------------------
// Main function
// ---------------------------------------------

/**
 * Fetches a published lesson's blocks with visibility and progress metadata.
 * Supports reveal strategies like progressive unlocking, full reveal, and linear step-by-step.
 * Validates response using Zod to ensure schema consistency.
 */
export async function fetchLessonWithProgressiveReveal({
  supabase,
  courseId,
  chapterId,
  lessonId,
  revealMode = 'progressive',
}: FetchLessonWithProgressArgs): Promise<ParsedLessonWithProgress | null> {
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    'get_published_lesson_blocks_with_progressive_reveal',
    {
      p_course_id: courseId,
      p_chapter_id: chapterId,
      p_lesson_id: lessonId,
      p_reveal_mode: revealMode,
    },
  );

  // Handle RPC-level error
  if (rpcError) {
    console.error('❌ Supabase RPC failed:', {
      message: rpcError.message,
      details: rpcError.details,
      hint: rpcError.hint,
      code: rpcError.code,
    });
    return null;
  }

  // Log the raw RPC response
  console.log('📦 RPC response:', JSON.stringify(rpcData, null, 2));

  // Handle application-level error returned inside the RPC payload
  if (rpcData && typeof rpcData === 'object' && 'error' in rpcData) {
    console.error('❌ RPC returned application error:', rpcData.error);
    return null;
  }

  // Validate response using Zod schema
  const parsedResult = PublishedLessonWithProgressSchema.safeParse(rpcData);

  if (parsedResult.success) {
    console.log('✅ Zod validation successful');
    return {
      ...parsedResult.data,
      _dataType: 'progressive_reveal',
    };
  } else {
    console.error('❌ Zod schema validation failed');
    console.error('🧩 Validation issues:', parsedResult.error.format());
    console.error('📉 Data that failed parsing:', JSON.stringify(rpcData, null, 2));
    return null;
  }
}
