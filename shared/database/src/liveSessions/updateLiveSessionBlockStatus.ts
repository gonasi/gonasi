import type { TypedSupabaseClient } from '../client';
import type { Database } from '../schema';

interface UpdateLiveSessionBlockStatusArgs {
  supabase: TypedSupabaseClient;
  blockId: string;
  status: Database['public']['Enums']['live_session_block_status'];
}

export async function updateLiveSessionBlockStatus({
  supabase,
  blockId,
  status,
}: UpdateLiveSessionBlockStatusArgs) {
  const { data, error } = await supabase
    .from('live_session_blocks')
    .update({ status })
    .eq('id', blockId)
    .select()
    .single();

  if (error) {
    console.error('[updateLiveSessionBlockStatus] Error:', error);
    return { success: false as const, error: error.message };
  }

  return { success: true as const, data };
}
