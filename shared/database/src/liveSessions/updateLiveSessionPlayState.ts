import type { TypedSupabaseClient } from '../client';
import type { Database } from '../schema';

interface UpdateLiveSessionPlayStateArgs {
  supabase: TypedSupabaseClient;
  sessionId: string;
  playState: Database['public']['Enums']['live_session_play_state'];
  currentBlockId?: string;
}

export async function updateLiveSessionPlayState({
  supabase,
  sessionId,
  playState,
  currentBlockId,
}: UpdateLiveSessionPlayStateArgs) {
  const updateData: {
    play_state: typeof playState;
    current_block_id?: string | null;
  } = {
    play_state: playState,
  };

  // Only update current_block_id if provided
  if (currentBlockId !== undefined) {
    updateData.current_block_id = currentBlockId || null;
  }

  const { data, error } = await supabase
    .from('live_sessions')
    .update(updateData)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    console.error('[updateLiveSessionPlayState] Error:', error);
    return { success: false as const, error: error.message };
  }

  return { success: true as const, data };
}
