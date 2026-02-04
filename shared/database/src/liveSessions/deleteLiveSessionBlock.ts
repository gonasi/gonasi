import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

interface DeleteLiveSessionBlockArgs {
  supabase: TypedSupabaseClient;
  blockId: string;
}

export async function deleteLiveSessionBlock({ supabase, blockId }: DeleteLiveSessionBlockArgs): Promise<ApiResponse> {
  try {
    const { error } = await supabase.from('live_session_blocks').delete().eq('id', blockId);

    if (error) {
      console.error('[deleteLiveSessionBlock] error:', error);
      return { success: false, message: 'Failed to delete the block. Please try again.' };
    }

    return { success: true, message: 'Block deleted successfully.' };
  } catch (err) {
    console.error('[deleteLiveSessionBlock] unexpected error:', err);
    return { success: false, message: 'Something went wrong — try again in a bit.' };
  }
}
