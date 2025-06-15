import type { BlocksPositionUpdateArraySchemaTypes } from '@gonasi/schemas/plugins';

import { getUserId } from '../../auth';
import type { TypedSupabaseClient } from '../../client';

interface UpdateBlockPositionsParams {
  supabase: TypedSupabaseClient;
  lessonId: string;
  blockPositions: BlocksPositionUpdateArraySchemaTypes;
}

export async function updateBlockPositions({
  supabase,
  lessonId,
  blockPositions,
}: UpdateBlockPositionsParams) {
  const userId = await getUserId(supabase);

  try {
    const { error } = await supabase.rpc('reorder_lesson_blocks', {
      p_lesson_id: lessonId,
      block_positions: blockPositions,
      p_updated_by: userId,
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
