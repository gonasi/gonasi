import type { ChapterPositionUpdateArray } from '@gonasi/schemas/courseChapters';
import { ChapterPositionUpdateArraySchema } from '@gonasi/schemas/courseChapters'; // Assuming schema is imported

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';

/**
 * Reorders chapters using a Supabase Postgres function to ensure atomic update.
 *
 * @param supabase - The Supabase client
 * @param reorderedChapters - Chapters in new order
 * @returns Success result with optional error message
 */
export async function updateChapterPositions(
  supabase: TypedSupabaseClient,
  reorderedChapters: unknown, // Accepts any type, to be validated using Zod
): Promise<{ success: boolean; message?: string }> {
  // Validate the reorderedChapters input using Zod schema
  let parsedChapters: ChapterPositionUpdateArray;
  try {
    parsedChapters = ChapterPositionUpdateArraySchema.parse(reorderedChapters); // Throws if invalid
  } catch (validationError) {
    console.error('Invalid input data for reordered chapters:', validationError);
    return {
      success: false,
      message: 'Invalid chapter data. Please check the input and try again.',
    };
  }

  if (parsedChapters.length === 0) {
    return {
      success: true,
      message: 'No chapters to reorder.',
    };
  }

  const userId = await getUserId(supabase);

  // Enrich chapters with updated_by field
  const enrichedChapters = parsedChapters.map((chapter) => ({
    ...chapter,
    updated_by: userId,
  }));

  try {
    // Call the `reorder_chapters` function in Supabase
    const { error } = await supabase.rpc('reorder_chapters', {
      chapters: enrichedChapters, // Pass the enriched chapters to the function
    });

    if (error) {
      console.error('Error calling reorder_chapters:', error);
      return {
        success: false,
        message: 'Could not update chapter order. Please try again.',
      };
    }

    return {
      success: true,
    };
  } catch (err) {
    console.error('Unexpected error during reorder:', err);
    return {
      success: false,
      message: 'Something went wrong while reordering chapters.',
    };
  }
}
