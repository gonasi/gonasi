import type { TypedSupabaseClient } from '../client';

interface FetchLiveSessionBlockByIdArgs {
  supabase: TypedSupabaseClient;
  blockId: string;
}

// Only override content/settings to safe type
type SafeJson = unknown;

export async function fetchLiveSessionBlockById({
  supabase,
  blockId,
}: FetchLiveSessionBlockByIdArgs) {
  const { data, error } = await supabase
    .from('live_session_blocks')
    .select(
      'id, live_session_id, organization_id, plugin_type, content, settings, position, difficulty, time_limit, status',
    )
    .eq('id', blockId)
    .single();

  if (error || !data) return null;

  // Keep inference for all fields except content/settings
  return {
    ...data,
    content: data.content as SafeJson,
    settings: data.settings as SafeJson,
  };
}
