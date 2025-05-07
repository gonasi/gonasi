import type { BlocksPositionUpdateArray } from '@gonasi/schemas/plugins';
import { BlocksPositionUpdateArraySchema } from '@gonasi/schemas/plugins'; // Assuming schema is imported

import { getUserId } from '../../auth';
import type { TypedSupabaseClient } from '../../client';

export async function updateBlockPositions(
  supabase: TypedSupabaseClient,
  reorderedBlocks: unknown, // Accepts any type, to be validated using Zod
): Promise<{ success: boolean; message?: string }> {
  // Validate the reorderedBlocks input using Zod schema
  let parsedBlocks: BlocksPositionUpdateArray;
  try {
    parsedBlocks = BlocksPositionUpdateArraySchema.parse(reorderedBlocks); // Throws if invalid
  } catch (validationError) {
    console.error('Invalid input data for reordered blocks:', validationError);
    return {
      success: false,
      message: 'Invalid block data. Please check the input and try again.',
    };
  }

  if (parsedBlocks.length === 0) {
    return {
      success: false,
      message: 'No blocks to reorder.',
    };
  }

  const userId = await getUserId(supabase);

  // Enrich blocks with updated_by field
  const enrichedBlocks = parsedBlocks.map((block) => ({
    ...block,
    updated_by: userId,
  }));

  try {
    // Call the `reorder_blocks` function in Supabase
    const { error } = await supabase.rpc('reorder_blocks', {
      blocks: enrichedBlocks, // Pass the enriched blocks to the function
    });

    if (error) {
      console.error('Error calling reorder_blocks:', error);
      return {
        success: false,
        message: 'Could not update block order. Please try again.',
      };
    }

    return {
      success: true,
    };
  } catch (err) {
    console.error('Unexpected error during reorder:', err);
    return {
      success: false,
      message: 'Something went wrong while reordering blocks.',
    };
  }
}
