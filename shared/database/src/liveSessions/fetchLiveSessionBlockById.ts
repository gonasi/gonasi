import type { TypedSupabaseClient } from '../client';

interface FetchLiveSessionBlockByIdArgs {
  supabase: TypedSupabaseClient;
  blockId: string;
}

export async function fetchLiveSessionBlockById({ supabase, blockId }: FetchLiveSessionBlockByIdArgs) {
  const { data, error } = await supabase
    .from('live_session_blocks')
    .select('id, live_session_id, organization_id, plugin_type, content, settings, position, weight, time_limit, status')
    .eq('id', blockId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}
