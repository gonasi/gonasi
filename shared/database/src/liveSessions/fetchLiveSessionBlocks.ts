import type { TypedSupabaseClient } from '../client';

interface FetchLiveSessionBlocksArgs {
  supabase: TypedSupabaseClient;
  liveSessionId: string;
}

export async function fetchLiveSessionBlocks({
  supabase,
  liveSessionId,
}: FetchLiveSessionBlocksArgs) {
  const { data, error } = await supabase
    .from('live_session_blocks')
    .select('id, plugin_type, content, settings, position, time_limit, status, difficulty')
    .eq('live_session_id', liveSessionId)
    .order('position', { ascending: true });

  if (error) {
    console.error('[fetchLiveSessionBlocks] error:', error);
    return [];
  }

  return data;
}
