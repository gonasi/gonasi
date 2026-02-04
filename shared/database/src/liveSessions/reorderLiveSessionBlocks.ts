import type { BlocksPositionUpdateArraySchemaTypes } from '@gonasi/schemas/plugins';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

interface ReorderLiveSessionBlocksArgs {
  supabase: TypedSupabaseClient;
  liveSessionId: string;
  blockPositions: BlocksPositionUpdateArraySchemaTypes;
}

export async function reorderLiveSessionBlocks({
  supabase,
  liveSessionId,
  blockPositions,
}: ReorderLiveSessionBlocksArgs): Promise<ApiResponse> {
  const userId = await getUserId(supabase);

  try {
    const { error } = await supabase.rpc('reorder_live_session_blocks', {
      block_positions: blockPositions,
      p_live_session_id: liveSessionId,
      p_updated_by: userId,
    });

    if (error) {
      console.error('[reorderLiveSessionBlocks] error:', error);
      return { success: false, message: 'Could not update block order. Please try again.' };
    }

    return { success: true, message: 'Blocks reordered.' };
  } catch (err) {
    console.error('[reorderLiveSessionBlocks] unexpected error:', err);
    return { success: false, message: 'Something went wrong while reordering.' };
  }
}
