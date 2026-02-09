import type { TypedSupabaseClient } from '../client';
import type { Database } from '../schema';

interface UpdateLiveSessionStatusArgs {
  supabase: TypedSupabaseClient;
  sessionId: string;
  status: Database['public']['Enums']['live_session_status'];
}

export async function updateLiveSessionStatus({
  supabase,
  sessionId,
  status,
}: UpdateLiveSessionStatusArgs) {
  const { data, error } = await supabase
    .from('live_sessions')
    .update({
      status,
      // Set actual_start_time when transitioning to active for the first time
      ...(status === 'active' && { actual_start_time: new Date().toISOString() }),
      // Set ended_at when ending the session
      ...(status === 'ended' && { ended_at: new Date().toISOString() }),
    })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    console.error('[updateLiveSessionStatus] Error:', error);
    return { success: false as const, error: error.message };
  }

  return { success: true as const, data };
}
